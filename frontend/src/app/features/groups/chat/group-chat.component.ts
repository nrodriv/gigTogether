import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { CommonModule, DatePipe, SlicePipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SocketService } from '../../../core/services/socket.service';
import { ChatHttpService } from '../../../core/services/chat-http.service';
import { ChatMessage, GroupMember } from '../../../core/models';
import { GroupWithConcert } from '../../../core/services/groups.service';

interface DisplayMessage extends ChatMessage {
  isOwn: boolean;
  showUnreadDivider: boolean;
}

@Component({
  selector: 'app-group-chat',
  standalone: true,
  imports: [CommonModule, DatePipe, SlicePipe, UpperCasePipe, FormsModule],
  templateUrl: './group-chat.component.html',
  styleUrl: './group-chat.component.scss',
})
export class GroupChatComponent implements OnInit, OnDestroy {
  @Input() group!: GroupWithConcert;
  @Input() currentUserId!: string;
  @Output() close = new EventEmitter<void>();

  @ViewChild('messageList') messageListRef!: ElementRef<HTMLElement>;
  @ViewChild('bottomAnchor') bottomAnchorRef!: ElementRef<HTMLElement>;

  private socketSvc = inject(SocketService);
  private chatHttp = inject(ChatHttpService);
  private cdr = inject(ChangeDetectorRef);

  messages: DisplayMessage[] = [];
  inputText = '';
  isLoading = true;
  sendError = '';

  unreadCount = 0;
  showUnreadBanner = false;
  private scrolledAwayFromBottom = false;
  private programmaticScroll = false;

  private subs = new Subscription();
  private lastSeenKey = '';

  get chatTitle(): string {
    return `${this.group.concert.artistName} en ${this.group.concert.venue.name}`;
  }

  ngOnInit(): void {
    this.lastSeenKey = `chatLastSeen_${this.group.id}`;

    // Unirse a la sala de socket (para recibir mensajes en tiempo real)
    this.socketSvc.joinGroup(this.group.id);

    // Cargar historial de mensajes vía HTTP (fiable, persiste entre sesiones)
    this.chatHttp.getMessages(this.group.id).subscribe({
      next: (msgs) => {
        this.isLoading = false;
        this.processInitialMessages(msgs);
        this.cdr.detectChanges();
        this.scrollToFirstUnread();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });

    // Mensajes en tiempo real de otros miembros (los propios ya llegan por HTTP)
    this.subs.add(
      this.socketSvc.newMessage$.subscribe((msg) => {
        if (msg.sender.userId === this.currentUserId) return;
        // Evitar duplicados por si acaso
        if (this.messages.some((m) => m.id === msg.id)) return;
        this.addIncomingMessage(msg);
        if (!this.scrolledAwayFromBottom) {
          setTimeout(() => this.scrollToBottom(), 50);
        }
        this.cdr.detectChanges();
      }),
    );

    // Suscribirse a eventos de miembro que sale (marcar mensajes en gris)
    this.subs.add(
      this.socketSvc.memberLeft$.subscribe(({ groupId, userId }) => {
        if (groupId !== this.group.id) return;
        this.messages = this.messages.map((m) =>
          m.sender.userId === userId
            ? { ...m, sender: { ...m.sender, isActive: false } }
            : m,
        );
        // También actualizar lista de miembros del grupo
        this.group = {
          ...this.group,
          members: this.group.members.filter((m) => m.userId !== userId),
        };
        this.cdr.detectChanges();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.socketSvc.leaveGroupRoom(this.group.id);
    this.updateLastSeen();
  }

  private processInitialMessages(raw: ChatMessage[]): void {
    const lastSeen = localStorage.getItem(this.lastSeenKey);
    const lastSeenDate = lastSeen ? new Date(lastSeen) : null;

    let firstUnreadIndex = -1;
    const mapped: DisplayMessage[] = raw.map((msg, i) => {
      const isUnread = lastSeenDate ? new Date(msg.createdAt) > lastSeenDate : i >= raw.length - 5;
      if (isUnread && firstUnreadIndex === -1) firstUnreadIndex = i;
      return {
        ...msg,
        isOwn: msg.sender.userId === this.currentUserId,
        showUnreadDivider: false,
      };
    });

    if (firstUnreadIndex > 0) {
      mapped[firstUnreadIndex].showUnreadDivider = true;
      this.unreadCount = raw.length - firstUnreadIndex;
      this.showUnreadBanner = true;
    } else if (firstUnreadIndex === 0 && mapped.length > 0) {
      mapped[0].showUnreadDivider = true;
      this.unreadCount = raw.length;
      this.showUnreadBanner = true;
    }

    this.messages = mapped;
  }

  private addIncomingMessage(msg: ChatMessage): void {
    this.messages.push({
      ...msg,
      isOwn: false,
      showUnreadDivider: false,
    });
  }

  isSending = false;

  sendMessage(): void {
    const content = this.inputText.trim();
    if (!content || this.isSending) return;

    this.inputText = '';
    this.sendError = '';
    this.isSending = true;

    // Añadir mensaje optimista inmediatamente
    const tmpId = 'tmp-' + Date.now();
    const optimistic: DisplayMessage = {
      id: tmpId,
      content,
      createdAt: new Date().toISOString(),
      sender: { userId: this.currentUserId, alias: 'Tú', profilePicture: null, isActive: true },
      isOwn: true,
      showUnreadDivider: false,
    };
    this.messages.push(optimistic);
    this.cdr.detectChanges();
    setTimeout(() => this.scrollToBottom(), 50);

    // Persistir vía HTTP (fiable)
    this.chatHttp.sendMessage(this.group.id, content).subscribe({
      next: (saved) => {
        this.isSending = false;
        // Reemplazar optimista con el mensaje real guardado en DB
        const idx = this.messages.findIndex((m) => m.id === tmpId);
        if (idx !== -1) {
          this.messages[idx] = { ...saved, isOwn: true, showUnreadDivider: false };
        }
        this.updateLastSeen();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSending = false;
        this.sendError = err?.error?.message ?? 'Error al enviar el mensaje';
        this.messages = this.messages.filter((m) => m.id !== tmpId);
        this.inputText = content; // Devolver texto al input
        this.cdr.detectChanges();
      },
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    const el = this.messageListRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  private scrollToFirstUnread(): void {
    setTimeout(() => {
      this.programmaticScroll = true;
      const firstUnread = this.messageListRef?.nativeElement?.querySelector('.unread-divider');
      if (firstUnread) {
        firstUnread.scrollIntoView({ block: 'start', behavior: 'auto' });
      } else {
        this.scrollToBottom();
      }
      setTimeout(() => { this.programmaticScroll = false; }, 50);
    }, 80);
  }

  onMessageListScroll(): void {
    const el = this.messageListRef?.nativeElement;
    if (!el) return;

    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    this.scrolledAwayFromBottom = !atBottom;

    // El banner desaparece en cuanto el usuario hace scroll (pero no si es programático)
    if (this.showUnreadBanner && !this.programmaticScroll) {
      this.showUnreadBanner = false;
      this.updateLastSeen();
      this.cdr.detectChanges();
    }
  }

  dismissBanner(): void {
    this.showUnreadBanner = false;
    this.scrollToBottom();
    this.updateLastSeen();
  }

  private updateLastSeen(): void {
    if (this.messages.length > 0) {
      const last = this.messages[this.messages.length - 1];
      localStorage.setItem(this.lastSeenKey, last.createdAt);
    }
  }

  memberAvatar(member: GroupMember | { alias: string; profilePicture: string | null }): string {
    return member.alias.slice(0, 2).toUpperCase();
  }

  onClose(): void {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onClose();
  }
}
