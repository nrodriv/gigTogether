import { Component, computed, inject, HostListener, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map, startWith, distinctUntilChanged, switchMap, EMPTY } from 'rxjs';
import { selectIsAuthenticated, selectCurrentUser, selectIsAdmin, selectToken } from '../../../store/auth/auth.selectors';
import { logout } from '../../../store/auth/auth.actions';
import { NotificationsService } from '../../../core/services/notifications.service';
import { AdminNotificationsService, AdminNotifItem } from '../../../core/services/admin-notifications.service';
import { SocketService } from '../../../core/services/socket.service';
import { AppNotification } from '../../../core/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  private store = inject(Store);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private notifSvc = inject(NotificationsService);
  private adminNotifSvc = inject(AdminNotificationsService);
  private socketSvc = inject(SocketService);

  private isAuth      = toSignal(this.store.select(selectIsAuthenticated), { initialValue: false });
  private isAdminUser = toSignal(this.store.select(selectIsAdmin),         { initialValue: false });

  // DB notifications
  private dbUnreadCount = toSignal(this.notifSvc.unreadCount$, { initialValue: 0 });
  notifications = toSignal(this.notifSvc.notifications$, { initialValue: [] as AppNotification[] });

  // Badge: solo notificaciones no leídas en DB (incluye GROUP_MESSAGE)
  unreadCount = computed(() => this.dbUnreadCount() ?? 0);

  // Admin notifications
  adminUnreadCount   = toSignal(this.adminNotifSvc.unreadCount$, { initialValue: 0 });
  adminNotifications = toSignal(this.adminNotifSvc.items$,       { initialValue: [] as AdminNotifItem[] });

  isAuthenticated$ = this.store.select(selectIsAuthenticated);
  currentUser$     = this.store.select(selectCurrentUser);
  isAdmin$         = this.store.select(selectIsAdmin);

  showNotifBell = computed(() => !!this.isAuth() && !this.isAdminUser());
  showAdminBell = computed(() => !!this.isAuth() && !!this.isAdminUser());

  dropdownOpen   = false;
  notifPanelOpen = false;
  adminPanelOpen = false;

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  isAuthRoute = computed(() => {
    const url = this.currentUrl();
    return url.startsWith('/login') || url.startsWith('/registro');
  });

  isAdminRoute = computed(() => this.currentUrl().startsWith('/admin'));

  constructor() {
    // Cargar notificaciones DB y conectar socket al autenticarse
    this.store.select(selectIsAuthenticated).pipe(
      distinctUntilChanged(),
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          this.notifSvc.clearNotifications();
          return EMPTY;
        }
        return this.notifSvc.loadNotifications();
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    // Conectar socket para todos los usuarios autenticados (admins y no-admins)
    this.store.select(selectToken).pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(token => {
      if (token) {
        this.socketSvc.connect(token);
      } else {
        this.socketSvc.disconnect();
      }
    });

    // Notificaciones de expulsión en tiempo real: añadir al panel y al badge
    this.socketSvc.notification$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(notif => {
      this.notifSvc.prependNotification(notif);
    });

    // Admin notifications: carga inicial al autenticarse
    this.store.select(selectIsAdmin).pipe(
      distinctUntilChanged(),
      switchMap(isAdmin => {
        if (!isAdmin) {
          this.adminNotifSvc.clearItems();
          return EMPTY;
        }
        return this.adminNotifSvc.loadItems();
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    // Recargar notificaciones admin en tiempo real al llegar nuevo reporte
    this.socketSvc.adminReport$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.adminNotifSvc.loadItems().subscribe();
    });
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) { this.notifPanelOpen = false; this.adminPanelOpen = false; }
  }

  toggleNotifPanel(): void {
    this.notifPanelOpen = !this.notifPanelOpen;
    if (this.notifPanelOpen) {
      this.dropdownOpen = false;
      this.adminPanelOpen = false;
      this.notifSvc.loadNotifications().subscribe();
    }
  }

  toggleAdminPanel(): void {
    this.adminPanelOpen = !this.adminPanelOpen;
    if (this.adminPanelOpen) {
      this.dropdownOpen = false;
      this.notifPanelOpen = false;
      this.adminNotifSvc.loadItems().subscribe();
    }
  }

  adminMarkAllAsRead(): void {
    this.adminNotifSvc.markAllAsRead().subscribe();
  }

  adminClearAll(): void {
    this.adminNotifSvc.clearAll();
    this.adminPanelOpen = false;
  }

  markAllAsRead(): void {
    this.notifSvc.markAllAsRead().subscribe();
  }

  deleteAllNotifications(): void {
    this.notifSvc.deleteAll().subscribe();
  }

  markAsRead(notif: AppNotification): void {
    if (!notif.isRead) {
      this.notifSvc.markAsRead(notif.id).subscribe();
    }
  }

  onLogout(): void {
    this.dropdownOpen   = false;
    this.notifPanelOpen = false;
    this.adminPanelOpen = false;
    this.store.dispatch(logout());
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.navbar__user') && !target.closest('.navbar__notif')) {
      this.dropdownOpen   = false;
      this.notifPanelOpen = false;
      this.adminPanelOpen = false;
    }
  }
}
