import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule, DatePipe, SlicePipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { switchMap, of, Subscription } from 'rxjs';
import { GroupsService, GroupWithConcert } from '../../../core/services/groups.service';
import { UsersService } from '../../../core/services/users.service';
import { ProfileService, PublicProfile } from '../../../core/services/profile.service';
import { SocketService } from '../../../core/services/socket.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { ProfileCardComponent } from '../../../shared/components/profile-card/profile-card.component';
import { GroupChatComponent } from '../chat/group-chat.component';
import { ActivityType, GroupMember } from '../../../core/models';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { selectToken } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-mis-grupos',
  standalone: true,
  imports: [CommonModule, DatePipe, SlicePipe, UpperCasePipe, RouterLink, FormsModule, MatProgressSpinnerModule, MatIconModule, ProfileCardComponent, GroupChatComponent],
  templateUrl: './mis-grupos.component.html',
  styleUrl: './mis-grupos.component.scss'
})
export class MisGruposComponent implements OnInit, OnDestroy {
  private groupsService = inject(GroupsService);
  private usersService = inject(UsersService);
  private profileService = inject(ProfileService);
  private socketSvc = inject(SocketService);
  private notifSvc = inject(NotificationsService);
  private store = inject(Store);

  currentUser$ = this.store.select(selectCurrentUser);
  currentUserId: string | null = null;
  groups: GroupWithConcert[] = [];
  isLoading = true;
  pastFilter = '';

  viewedProfile: PublicProfile | null = null;
  loadingProfileId: string | null = null;

  openMenuUserId: string | null = null;
  blockingUserId: string | null = null;
  blockReasonMap: Record<string, string> = {};

  // Chat
  openChatGroup: GroupWithConcert | null = null;

  chatUnreadMap: Record<string, number> = {};

  private subs = new Subscription();

  ngOnInit(): void {
    this.store.select(selectCurrentUser).subscribe(user => {
      this.currentUserId = user?.id ?? null;
    });
    this.groupsService.getMyGroups().subscribe({
      next: g => { this.groups = g; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });

    // Conectar socket y escuchar notificaciones de chat
    this.store.select(selectToken).subscribe(token => {
      if (token) {
        this.socketSvc.connect(token);
      }
    });

    // Badge del botón chat: derivado de notificaciones GROUP_MESSAGE no leídas en DB
    this.subs.add(
      this.notifSvc.notifications$.subscribe(notifications => {
        const counts: Record<string, number> = {};
        for (const n of notifications) {
          if (n.type === 'GROUP_MESSAGE' && !n.isRead && n.data?.groupId) {
            if (n.data.groupId !== this.openChatGroup?.id) {
              counts[n.data.groupId] = (counts[n.data.groupId] ?? 0) + 1;
            }
          }
        }
        this.chatUnreadMap = counts;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get upcomingGroups(): GroupWithConcert[] {
    return this.groups.filter(g => !g.isPast);
  }

  get hasPastGroups(): boolean {
    return this.groups.some(g => g.isPast);
  }

  get pastGroups(): GroupWithConcert[] {
    const f = this.pastFilter.toLowerCase().trim();
    return this.groups
      .filter(g => g.isPast)
      .filter(g => !f ||
        g.concert.artistName.toLowerCase().includes(f) ||
        g.concert.venue.name.toLowerCase().includes(f)
      )
      .sort((a, b) => new Date(b.concert.date).getTime() - new Date(a.concert.date).getTime());
  }

  isMe(userId: string): boolean {
    return this.currentUserId === userId;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openMenuUserId = null;
  }

  toggleMenu(event: MouseEvent, userId: string): void {
    event.stopPropagation();
    this.openMenuUserId = this.openMenuUserId === userId ? null : userId;
  }

  confirmBlock(event: MouseEvent, member: GroupMember, groupId: string): void {
    event.stopPropagation();
    this.blockingUserId = member.userId;
    const reason = (this.blockReasonMap[member.userId] ?? '').trim();

    
    this.usersService.blockUser(member.userId, groupId).pipe(
      switchMap(() => {
        if (reason.length >= 5) {
          return this.usersService.reportUser(member.userId, { reason, groupId });
        }
        return of(null);
      })
    ).subscribe({
      next: () => {
        this.blockingUserId = null;
        this.openMenuUserId = null;
        delete this.blockReasonMap[member.userId];
        
        this.groups = this.groups.map(g => ({
          ...g,
          members: g.members.filter(m => m.userId !== member.userId)
        }));
      },
      error: () => {
        this.blockingUserId = null;
        this.openMenuUserId = null;
      }
    });
  }

  cancelMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuUserId = null;
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  openMemberProfile(event: Event, member: GroupMember): void {
    event.stopPropagation();
    this.loadingProfileId = member.userId;
    this.profileService.getPublicProfile(member.userId).subscribe({
      next: profile => {
        this.loadingProfileId = null;
        this.viewedProfile = profile;
      },
      error: () => { this.loadingProfileId = null; }
    });
  }

  closeProfile(): void {
    this.viewedProfile = null;
  }

  leaveGroup(groupId: string): void {
    if (this.openChatGroup?.id === groupId) this.openChatGroup = null;
    this.groupsService.leaveGroup(groupId).subscribe(() => {
      this.groups = this.groups.filter(g => g.id !== groupId);
    });
  }

  openChat(group: GroupWithConcert): void {
    this.openChatGroup = group;
    this.notifSvc.setActiveGroup(group.id);
  }

  closeChat(): void {
    this.notifSvc.setActiveGroup(null);
    this.openChatGroup = null;
  }

  chatUnreadFor(groupId: string): number {
    return this.chatUnreadMap[groupId] ?? 0;
  }

  onChatGroupUpdated(updatedGroup: GroupWithConcert): void {
    this.openChatGroup = updatedGroup;
    this.groups = this.groups.map(g => g.id === updatedGroup.id ? updatedGroup : g);
  }

  activityLabel(type: ActivityType): string {
    const map: Record<ActivityType, string> = {
      HAVE_DRINK: 'Tomar algo tranquilamente',
      GET_GOOD_SPOT: 'Coger buen sitio',
      CHAT: 'Charlar antes del concierto',
      NO_PREFERENCE: 'Sin preferencia'
    };
    return map[type] ?? '';
  }


  arrivalWindowTimeRange(window: string, doorsOpenTime: string): string {
    const [h, m] = doorsOpenTime.split(':').map(Number);
    const doorsMins = h * 60 + m;

    let startMins: number;
    let endMins: number;

    switch (window) {
      case 'EARLY':
        startMins = doorsMins - 60;
        endMins   = doorsMins - 30;
        break;
      case 'ON_TIME':
        startMins = doorsMins - 30;
        endMins   = doorsMins;
        break;
      case 'LATE':
        startMins = doorsMins;
        endMins   = doorsMins + 30;
        break;
      default:
        return doorsOpenTime;
    }

    const fmt = (mins: number) => {
      const hh = Math.floor(mins / 60) % 24;
      const mm = mins % 60;
      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    };

    return `${fmt(startMins)} – ${fmt(endMins)}`;
  }
}
