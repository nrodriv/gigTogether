import { Injectable, inject, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject, Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { ChatMessage, ChatNotification, AppNotification } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private store = inject(Store);
  private socket: Socket | null = null;

  private _newMessage$ = new Subject<ChatMessage>();
  private _memberLeft$ = new Subject<{ groupId: string; userId: string }>();
  private _chatNotification$ = new Subject<ChatNotification>();
  private _notification$ = new Subject<AppNotification>();
  private _adminReport$ = new Subject<void>();

  newMessage$ = this._newMessage$.asObservable();
  memberLeft$ = this._memberLeft$.asObservable();
  chatNotification$ = this._chatNotification$.asObservable();
  notification$ = this._notification$.asObservable();
  adminReport$ = this._adminReport$.asObservable();

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(`${environment.wsUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('newMessage', (msg: ChatMessage) => this._newMessage$.next(msg));
    this.socket.on('memberLeft', (data: { groupId: string; userId: string }) =>
      this._memberLeft$.next(data),
    );
    this.socket.on('chatNotification', (data: ChatNotification) =>
      this._chatNotification$.next(data),
    );
    this.socket.on('notification', (notif: AppNotification) =>
      this._notification$.next(notif),
    );
    this.socket.on('newReport', () => this._adminReport$.next());
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinGroup(groupId: string): void {
    this.socket?.emit('joinGroup', groupId);
  }

  leaveGroupRoom(groupId: string): void {
    this.socket?.emit('leaveGroupRoom', groupId);
  }


  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
