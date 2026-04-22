import { Component, HostListener, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AsyncPipe, DatePipe, SlicePipe, UpperCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { AdminNotificationsService } from '../../../core/services/admin-notifications.service';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { logout } from '../../../store/auth/auth.actions';
import { User } from '../../../core/models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, AsyncPipe, DatePipe, SlicePipe, UpperCasePipe],
  template: `
    <div class="admin-root">

      <!-- Mobile top bar -->
      <header class="admin-mobile-header">
        <button class="admin-mobile-header__menu" (click)="toggleSidebar()" aria-label="Menú">
          <mat-icon>{{ sidebarOpen ? 'close' : 'menu' }}</mat-icon>
        </button>
        <div class="admin-mobile-header__brand">
          <img src="/assets/logo.svg" alt="GigTogether" class="admin-mobile-header__logo" />
          <span class="admin-mobile-header__name">GigTogether</span>
          <span class="admin-mobile-header__badge">Admin</span>
        </div>

        <!-- Campana de notificaciones admin (solo mobile) -->
        <div class="admin-mobile-notif" [class.admin-mobile-notif--open]="notifPanelOpen">
          <button class="admin-mobile-notif__btn"
                  (click)="toggleNotifPanel()"
                  aria-label="Notificaciones admin"
                  type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round"
                 stroke-linejoin="round" aria-hidden="true">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
            @if ((adminNotifSvc.unreadCount$ | async)! > 0) {
              <span class="admin-mobile-notif__badge">{{ adminNotifSvc.unreadCount$ | async }}</span>
            }
          </button>

          @if (notifPanelOpen) {
            <div class="admin-mobile-notif__panel">
              <div class="admin-mobile-notif__header">
                <span class="admin-mobile-notif__title">Actividad reciente</span>
                <div class="admin-mobile-notif__actions">
                  @if ((adminNotifSvc.unreadCount$ | async)! > 0) {
                    <button class="admin-mobile-notif__action-btn" (click)="notifMarkAllAsRead()" type="button">
                      Marcar leídas
                    </button>
                  }
                  @if ((adminNotifSvc.items$ | async)?.length ?? 0 > 0) {
                    <button class="admin-mobile-notif__action-btn admin-mobile-notif__action-btn--danger"
                            (click)="notifClearAll()" type="button">
                      Borrar todo
                    </button>
                  }
                </div>
              </div>

              @if (((adminNotifSvc.items$ | async)?.length ?? 0) === 0) {
                <p class="admin-mobile-notif__empty">No hay actividad nueva</p>
              } @else {
                <ul class="admin-mobile-notif__list">
                  @for (item of (adminNotifSvc.items$ | async) ?? []; track item.id) {
                    <li class="admin-mobile-notif__item" [class.admin-mobile-notif__item--unread]="!item.isRead">
                      <span class="admin-mobile-notif__icon"
                            [class.admin-mobile-notif__icon--report]="item.type === 'REPORT'"
                            [class.admin-mobile-notif__icon--block]="item.type === 'BLOCK'">
                        @if (item.type === 'REPORT') {
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                            <line x1="4" y1="22" x2="4" y2="15"/>
                          </svg>
                        } @else {
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                          </svg>
                        }
                      </span>
                      <div class="admin-mobile-notif__body">
                        <p class="admin-mobile-notif__msg">{{ item.message }}</p>
                        <span class="admin-mobile-notif__time">{{ item.createdAt | date:'d MMM, HH:mm':'':'es-ES' }}</span>
                      </div>
                      @if (!item.isRead) {
                        <span class="admin-mobile-notif__dot"></span>
                      }
                    </li>
                  }
                </ul>
              }
            </div>
          }
        </div>

        <!-- Avatar / dropdown de usuario (solo mobile) -->
        @if (currentUser$ | async; as user) {
          <div class="admin-mobile-user" [class.admin-mobile-user--open]="dropdownOpen">
            <button class="admin-mobile-user__avatar"
                    (click)="dropdownOpen = !dropdownOpen; notifPanelOpen = false; sidebarOpen = false"
                    [attr.aria-expanded]="dropdownOpen"
                    type="button">
              @if (user.profilePicture) {
                <img [src]="user.profilePicture" alt="" class="admin-mobile-user__avatar-img" />
              } @else {
                {{ user.alias | slice:0:2 | uppercase }}
              }
            </button>
            @if (dropdownOpen) {
              <div class="admin-mobile-user__dropdown">
                <div class="admin-mobile-user__dropdown-header">
                  <span class="admin-mobile-user__alias">{{ user.alias }}</span>
                  <span class="admin-mobile-user__email">{{ user.email }}</span>
                </div>
                <hr class="admin-mobile-user__divider" />
                <a class="admin-mobile-user__item" routerLink="/mi-perfil/perfil" (click)="dropdownOpen = false">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
                  </svg>
                  Mi perfil
                </a>
                <a class="admin-mobile-user__item" routerLink="/mi-perfil/cuenta" (click)="dropdownOpen = false">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  Mi cuenta
                </a>
                <hr class="admin-mobile-user__divider" />
                <button class="admin-mobile-user__item admin-mobile-user__item--danger" (click)="onLogout()">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            }
          </div>
        }
      </header>

      <div class="admin-shell">

        <!-- Backdrop -->
        <div class="admin-sidebar-backdrop"
             [class.is-visible]="sidebarOpen"
             (click)="closeSidebar()"></div>

        <!-- Sidebar -->
        <aside class="admin-sidebar" [class.is-open]="sidebarOpen">
          <div class="admin-sidebar__brand">
            <img src="/assets/logo.svg" alt="GigTogether" class="admin-sidebar__brand-logo" />
            <span class="admin-sidebar__brand-text">GigTogether</span>
            <span class="admin-sidebar__badge">Admin</span>
          </div>
          <nav class="admin-sidebar__nav" aria-label="Navegación admin">
            <a class="admin-sidebar__link"
               routerLink="/admin"
               routerLinkActive="admin-sidebar__link--active"
               [routerLinkActiveOptions]="{ exact: true }"
               (click)="closeSidebar()">
              <mat-icon class="admin-sidebar__icon">dashboard</mat-icon>
              Dashboard
            </a>
            <a class="admin-sidebar__link"
               routerLink="/admin/conciertos"
               routerLinkActive="admin-sidebar__link--active"
               (click)="closeSidebar()">
              <mat-icon class="admin-sidebar__icon">music_note</mat-icon>
              Conciertos
            </a>
            <a class="admin-sidebar__link"
               routerLink="/admin/ciudades"
               routerLinkActive="admin-sidebar__link--active"
               (click)="closeSidebar()">
              <mat-icon class="admin-sidebar__icon">location_city</mat-icon>
              Ciudades
            </a>
            <a class="admin-sidebar__link"
               routerLink="/admin/salas"
               routerLinkActive="admin-sidebar__link--active"
               (click)="closeSidebar()">
              <mat-icon class="admin-sidebar__icon">domain</mat-icon>
              Salas
            </a>
            <a class="admin-sidebar__link"
               routerLink="/admin/grupos"
               routerLinkActive="admin-sidebar__link--active"
               (click)="closeSidebar()">
              <mat-icon class="admin-sidebar__icon">group</mat-icon>
              Grupos
            </a>
            <a class="admin-sidebar__link"
               routerLink="/admin/usuarios"
               routerLinkActive="admin-sidebar__link--active"
               (click)="closeSidebar()">
              <mat-icon class="admin-sidebar__icon">manage_accounts</mat-icon>
              Usuarios
            </a>
            <a class="admin-sidebar__link"
               routerLink="/admin/reportes"
               routerLinkActive="admin-sidebar__link--active"
               (click)="closeSidebar()">
              <mat-icon class="admin-sidebar__icon">flag</mat-icon>
              Reportes
              @if ((adminNotifSvc.unreadReportCount$ | async)! > 0) {
                <span class="admin-sidebar__badge-count">{{ adminNotifSvc.unreadReportCount$ | async }}</span>
              }
            </a>
          </nav>
          <div class="admin-sidebar__footer">
            <a routerLink="/inicio" class="admin-sidebar__back" (click)="closeSidebar()">
              ← Volver a la app
            </a>
          </div>
        </aside>

        <main class="admin-content">
          <router-outlet />
        </main>
      </div>

      <!-- Mobile bottom navigation -->
      <nav class="admin-bottom-nav" aria-label="Navegación rápida">
        <a class="admin-bottom-nav__link"
           routerLink="/admin"
           routerLinkActive="admin-bottom-nav__link--active"
           [routerLinkActiveOptions]="{ exact: true }"
           (click)="closeSidebar()">
          <mat-icon>dashboard</mat-icon>
          Dashboard
        </a>
        <a class="admin-bottom-nav__link"
           routerLink="/admin/conciertos"
           routerLinkActive="admin-bottom-nav__link--active"
           (click)="closeSidebar()">
          <mat-icon>music_note</mat-icon>
          Conciertos
        </a>
        <a class="admin-bottom-nav__link"
           routerLink="/admin/ciudades"
           routerLinkActive="admin-bottom-nav__link--active"
           (click)="closeSidebar()">
          <mat-icon>location_city</mat-icon>
          Ciudades
        </a>
      </nav>
    </div>
  `,
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  sidebarOpen    = false;
  notifPanelOpen = false;
  dropdownOpen   = false;

  private store  = inject(Store);
  private router = inject(Router);
  currentUser$: Observable<User | null> = this.store.select(selectCurrentUser);

  constructor(public adminNotifSvc: AdminNotificationsService) {}

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    if (this.sidebarOpen) this.notifPanelOpen = false;
  }
  closeSidebar(): void { this.sidebarOpen = false; }

  toggleNotifPanel(): void {
    this.notifPanelOpen = !this.notifPanelOpen;
    if (this.notifPanelOpen) this.sidebarOpen = false;
  }

  notifMarkAllAsRead(): void {
    this.adminNotifSvc.markAllAsRead().subscribe();
  }

  notifClearAll(): void {
    this.adminNotifSvc.clearAll();
    this.notifPanelOpen = false;
  }

  onLogout(): void {
    this.dropdownOpen   = false;
    this.notifPanelOpen = false;
    this.sidebarOpen    = false;
    this.store.dispatch(logout());
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.admin-mobile-notif')) this.notifPanelOpen = false;
    if (!target.closest('.admin-mobile-user'))  this.dropdownOpen   = false;
  }
}
