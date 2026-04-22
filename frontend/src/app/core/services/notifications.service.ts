import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, catchError } from 'rxjs';
import { AppNotification } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/notifications`;

  private _unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this._unreadCount.asObservable();

  private _notifications = new BehaviorSubject<AppNotification[]>([]);
  notifications$ = this._notifications.asObservable();

  loadNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(this.base).pipe(
      tap(notifications => {
        this._notifications.next(notifications);
        this._unreadCount.next(notifications.filter(n => !n.isRead).length);
      }),
      catchError(() => of([]))
    );
  }

  markAsRead(id: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.base}/${id}/read`, {}).pipe(
      tap(() => {
        const updated = this._notifications.value.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        );
        this._notifications.next(updated);
        this._unreadCount.next(updated.filter(n => !n.isRead).length);
      })
    );
  }

  markAllAsRead(): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.base}/read-all`, {}).pipe(
      tap(() => {
        const updated = this._notifications.value.map(n => ({ ...n, isRead: true }));
        this._notifications.next(updated);
        this._unreadCount.next(0);
      })
    );
  }

  deleteAll(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(this.base).pipe(
      tap(() => {
        this._notifications.next([]);
        this._unreadCount.next(0);
      })
    );
  }

  clearNotifications(): void {
    this._notifications.next([]);
    this._unreadCount.next(0);
  }

  markGroupNotificationsAsRead(groupId: string): void {
    const updated = this._notifications.value.map(n =>
      n.type === 'GROUP_MESSAGE' && n.data?.groupId === groupId ? { ...n, isRead: true } : n
    );
    this._notifications.next(updated);
    this._unreadCount.next(updated.filter(n => !n.isRead).length);
  }

  private _activeGroupId: string | null = null;

  setActiveGroup(groupId: string | null): void {
    this._activeGroupId = groupId;
    if (groupId) this.markGroupNotificationsAsRead(groupId);
  }

  prependNotification(notif: AppNotification): void {
    const current = this._notifications.value;
    if (current.some(n => n.id === notif.id)) return;
    const isActiveGroupMsg =
      notif.type === 'GROUP_MESSAGE' &&
      notif.data?.groupId === this._activeGroupId;
    const entry = isActiveGroupMsg ? { ...notif, isRead: true } : notif;
    const updated = [entry, ...current];
    this._notifications.next(updated);
    this._unreadCount.next(updated.filter(n => !n.isRead).length);
  }
}
