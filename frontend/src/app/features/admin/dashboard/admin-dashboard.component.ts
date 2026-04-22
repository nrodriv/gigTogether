import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AdminService, AdminStats } from '../../../core/services/admin.service';
import { AdminNotificationsService } from '../../../core/services/admin-notifications.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, MatIconModule, AsyncPipe],
  template: `
    <div class="admin-dashboard">
      <h1 class="admin-page-title">Dashboard</h1>

      @if (loading) {
        <p class="admin-loading">Cargando estadísticas...</p>
      } @else if (stats) {
        <div class="stats-grid">
          <div class="stat-card">
            <mat-icon class="stat-card__icon">music_note</mat-icon>
            <span class="stat-card__value">{{ stats.publishedConcerts }}</span>
            <span class="stat-card__label">Conciertos publicados</span>
            <span class="stat-card__sub">de {{ stats.totalConcerts }} en total</span>
          </div>
          <div class="stat-card">
            <mat-icon class="stat-card__icon">group</mat-icon>
            <span class="stat-card__value">{{ stats.totalUsers }}</span>
            <span class="stat-card__label">Usuarios registrados</span>
          </div>
          <div class="stat-card" [class.stat-card--alert]="(adminNotifSvc.unreadReportCount$ | async)! > 0">
            <mat-icon class="stat-card__icon">flag</mat-icon>
            <span class="stat-card__value">{{ adminNotifSvc.unreadReportCount$ | async }}</span>
            <span class="stat-card__label">Nuevos reportes sin leer</span>
            @if ((adminNotifSvc.unreadReportCount$ | async)! > 0) {
              <a routerLink="/admin/reportes" class="stat-card__cta">Ver →</a>
            }
          </div>
        </div>

        <div class="admin-quick-actions">
          <h2 class="admin-section-title">Accesos rápidos</h2>
          <div class="quick-actions-grid">
            <a routerLink="/admin/conciertos/nuevo" class="quick-action-card">
              <mat-icon class="quick-action-card__icon">add_circle</mat-icon>
              <span>Nuevo concierto</span>
            </a>
            <a routerLink="/admin/salas" class="quick-action-card">
              <mat-icon class="quick-action-card__icon">domain</mat-icon>
              <span>Gestionar salas</span>
            </a>
            <a routerLink="/admin/reportes" class="quick-action-card">
              <mat-icon class="quick-action-card__icon">flag</mat-icon>
              <span>Ver reportes</span>
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStats | null = null;
  loading = true;
  adminNotifSvc = inject(AdminNotificationsService);

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getStats().subscribe({
      next: s => { this.stats = s; this.loading = false; }
    });
  }
}
