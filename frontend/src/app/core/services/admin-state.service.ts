import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminStateService {
  private unreadReports = new BehaviorSubject<number>(0);
  unreadReports$ = this.unreadReports.asObservable();

  setUnreadCount(count: number): void {
    this.unreadReports.next(count);
  }

  decrement(): void {
    const current = this.unreadReports.value;
    if (current > 0) this.unreadReports.next(current - 1);
  }
}
