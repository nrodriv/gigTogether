import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of, tap, catchError } from 'rxjs';
import { AdminService, AdminReport, AdminBlock } from './admin.service';

export interface AdminNotifItem {
  id: string;
  type: 'REPORT' | 'BLOCK';
  message: string;
  isRead: boolean;
  createdAt: string;
}

const LS_SEEN_BLOCKS  = 'admin_seen_blocks';
const LS_READ_BLOCKS  = 'admin_read_blocks';
const LS_DISMISSED_AT = 'admin_dismissed_at';

@Injectable({ providedIn: 'root' })
export class AdminNotificationsService {
  private adminSvc = inject(AdminService);

  private _items = new BehaviorSubject<AdminNotifItem[]>([]);
  items$ = this._items.asObservable();

  private _unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this._unreadCount.asObservable();

  private _unreadReportCount = new BehaviorSubject<number>(0);
  unreadReportCount$ = this._unreadReportCount.asObservable();

  loadItems(): Observable<[AdminReport[], AdminBlock[]]> {
    return forkJoin([
      this.adminSvc.getReports().pipe(catchError(() => of([] as AdminReport[]))),
      this.adminSvc.getBlocks().pipe(catchError(() => of([] as AdminBlock[]))),
    ]).pipe(
      tap(([reports, blocks]) => {
        const dismissedAt = this.getDismissedAt();
        const readIds  = this.getStoredSet(LS_READ_BLOCKS);
        const seenIds  = this.getStoredSet(LS_SEEN_BLOCKS);


        const reportItems: AdminNotifItem[] = reports
          .filter(r => !dismissedAt || new Date(r.createdAt) > dismissedAt)
          .map(r => ({
            id: 'r_' + r.id,
            type: 'REPORT' as const,
            message: `Nuevo reporte de ${r.reporter.alias} sobre ${r.reported.alias}${r.group ? ' · ' + r.group.concert.artistName : ''}`,
            isRead: r.isRead,
            createdAt: r.createdAt,
          }));


        const blockItems: AdminNotifItem[] = blocks
          .filter(b => !seenIds.has(b.id))
          .map(b => ({
            id: 'b_' + b.id,
            type: 'BLOCK' as const,
            message: `${b.blocker.alias} ha bloqueado a ${b.blocked.alias}${b.group ? ' · ' + b.group.concert.artistName : ''}`,
            isRead: readIds.has(b.id),
            createdAt: b.createdAt,
          }));

        const items = [...reportItems, ...blockItems]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        this._items.next(items);
        this._unreadReportCount.next(reportItems.filter(i => !i.isRead).length);
        this._unreadCount.next(items.filter(i => !i.isRead).length);
      })
    );
  }

  markOneReportRead(reportId: string): void {
    const updated = this._items.value.map(i =>
      i.id === 'r_' + reportId ? { ...i, isRead: true } : i
    );
    this._items.next(updated);
    this._unreadReportCount.next(updated.filter(i => i.type === 'REPORT' && !i.isRead).length);
    this._unreadCount.next(updated.filter(i => !i.isRead).length);
  }


  markAllAsRead(): Observable<{ count: number }> {
    return this.adminSvc.markAllReportsAsRead().pipe(
      tap(() => {
        const blockIds = this._items.value
          .filter(i => i.type === 'BLOCK')
          .map(i => i.id.replace('b_', ''));
        this.addToStoredSet(LS_READ_BLOCKS, blockIds);

        const updated = this._items.value.map(i => ({ ...i, isRead: true }));
        this._items.next(updated);
        this._unreadReportCount.next(0);
        this._unreadCount.next(0);
      })
    );
  }


  clearAll(): void {
    const blockIds = this._items.value
      .filter(i => i.type === 'BLOCK')
      .map(i => i.id.replace('b_', ''));
    this.addToStoredSet(LS_SEEN_BLOCKS, blockIds);
    this.setDismissedAt(new Date());
    this.adminSvc.markAllReportsAsRead().subscribe();

    this._items.next([]);
    this._unreadReportCount.next(0);
    this._unreadCount.next(0);
  }

  clearItems(): void {
    this._items.next([]);
    this._unreadReportCount.next(0);
    this._unreadCount.next(0);
  }



  private getDismissedAt(): Date | null {
    try {
      const raw = localStorage.getItem(LS_DISMISSED_AT);
      return raw ? new Date(raw) : null;
    } catch {
      return null;
    }
  }

  private setDismissedAt(date: Date): void {
    try {
      localStorage.setItem(LS_DISMISSED_AT, date.toISOString());
    } catch {}
  }

  private getStoredSet(key: string): Set<string> {
    try {
      const raw = localStorage.getItem(key);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  private addToStoredSet(key: string, newIds: string[]): void {
    try {
      const existing = this.getStoredSet(key);
      newIds.forEach(id => existing.add(id));
      localStorage.setItem(key, JSON.stringify([...existing]));
    } catch {}
  }
}
