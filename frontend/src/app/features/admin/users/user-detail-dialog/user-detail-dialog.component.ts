import { Component, Inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AdminService, AdminUser, AdminUserDetail } from '../../../../core/services/admin.service';

const ARRIVAL_LABELS: Record<string, string> = {
  EARLY: 'Pronto', ON_TIME: 'A tiempo', LATE: 'Tarde',
};
const ACTIVITY_LABELS: Record<string, string> = {
  HAVE_DRINK: 'Tomar algo', GET_GOOD_SPOT: 'Buen sitio',
  CHAT: 'Charlar', NO_PREFERENCE: 'Sin preferencia',
};

@Component({
  selector: 'app-user-detail-dialog',
  standalone: true,
  imports: [DatePipe, MatDialogModule, MatIconModule, MatTabsModule],
  template: `
    <div class="ud-dialog">
      <div class="ud-header">
        <div class="ud-header__left">
          <div class="ud-avatar">{{ summary.alias.charAt(0).toUpperCase() }}</div>
          <div>
            <p class="ud-alias">{{ summary.alias }}</p>
            <p class="ud-email">{{ summary.email }}</p>
          </div>
        </div>
        <button class="ud-close" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      @if (loading) {
        <div class="ud-loading">
          <p>Cargando perfil...</p>
        </div>
      } @else if (detail) {
        <mat-tab-group class="ud-tabs" animationDuration="0">

          <!-- Profile tab -->
          <mat-tab label="Perfil">
            <div class="ud-tab-content">
              <div class="ud-section">
                <p class="ud-section__label">Información</p>
                <div class="ud-info-grid">
                  <div class="ud-info-item">
                    <span class="ud-info-item__key">Estado</span>
                    <span class="ud-info-item__val">
                      <span class="ud-active" [class.ud-active--ok]="detail.isActive"
                            [class.ud-active--ko]="!detail.isActive">
                        {{ detail.isActive ? 'Activo' : 'Inactivo' }}
                      </span>
                    </span>
                  </div>
                  <div class="ud-info-item">
                    <span class="ud-info-item__key">Registro</span>
                    <span class="ud-info-item__val">{{ detail.createdAt | date:'dd/MM/yyyy':'':'es-ES' }}</span>
                  </div>
                  @if (detail.currentSong) {
                    <div class="ud-info-item">
                      <span class="ud-info-item__key">Canción actual</span>
                      <span class="ud-info-item__val">{{ detail.currentSong }}</span>
                    </div>
                  }
                  @if (detail.bio) {
                    <div class="ud-info-item ud-info-item--full">
                      <span class="ud-info-item__key">Bio</span>
                      <span class="ud-info-item__val">{{ detail.bio }}</span>
                    </div>
                  }
                </div>
              </div>

              @if (detail.musicGenres.length > 0) {
                <div class="ud-section">
                  <p class="ud-section__label">Géneros musicales</p>
                  <div class="ud-genres">
                    @for (g of detail.musicGenres; track g) {
                      <span class="ud-genre-chip">{{ g }}</span>
                    }
                  </div>
                </div>
              }

              @if (detail.preferences) {
                <div class="ud-section">
                  <p class="ud-section__label">Preferencias por defecto</p>
                  <div class="ud-conditions">
                    <div class="ud-condition">
                      <span class="ud-condition__key">Llegada</span>
                      <span class="ud-condition__val">{{ arrivalLabel(detail.preferences.arrivalWindow) }}</span>
                    </div>
                    <div class="ud-condition">
                      <span class="ud-condition__key">Actividad</span>
                      <span class="ud-condition__val">{{ activityLabel(detail.preferences.activityType) }}</span>
                    </div>
                    @if (detail.preferences.notes) {
                      <div class="ud-condition">
                        <span class="ud-condition__key">Notas</span>
                        <span class="ud-condition__val">{{ detail.preferences.notes }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </mat-tab>

          <!-- Groups tab -->
          <mat-tab [label]="'Grupos (' + detail.groupMembers.length + ')'">
            <div class="ud-tab-content">
              @if (detail.groupMembers.length === 0) {
                <p class="ud-empty">Sin grupos activos</p>
              } @else {
                <div class="ud-groups-list">
                  @for (gm of detail.groupMembers; track gm.id) {
                    <div class="ud-group-card">
                      <div class="ud-group-card__top">
                        <div>
                          <p class="ud-group-card__concert">{{ gm.group.concert.title }}</p>
                          <p class="ud-group-card__artist">{{ gm.group.concert.artistName }}</p>
                        </div>
                        <div class="ud-group-card__badges">
                          <span class="ud-status ud-status--{{ gm.group.status.toLowerCase() }}">
                            {{ groupStatusLabel(gm.group.status) }}
                          </span>
                          @if (gm.isOwner) {
                            <span class="ud-owner-badge">Creador</span>
                          }
                        </div>
                      </div>
                      <div class="ud-group-card__meta">
                        <span>
                          <mat-icon class="ud-meta-icon">domain</mat-icon>
                          {{ gm.group.concert.venue.name }}, {{ gm.group.concert.venue.city.name }}
                        </span>
                        <span>
                          <mat-icon class="ud-meta-icon">people</mat-icon>
                          {{ gm.group._count.members }} / {{ gm.group.maxSize }} miembros
                        </span>
                        @if (gm.group.meetingPoint) {
                          <span>
                            <mat-icon class="ud-meta-icon">place</mat-icon>
                            {{ gm.group.meetingPoint.name }}
                          </span>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </mat-tab>

          <!-- Reports tab -->
          <mat-tab [label]="'Reportes (' + totalReports + ')'">
            <div class="ud-tab-content">
              @if (detail.reportsReceived.length > 0) {
                <p class="ud-reports-subtitle">Recibidos como reportado</p>
                <div class="ud-reports-list">
                  @for (r of detail.reportsReceived; track r.id) {
                    <div class="ud-report-item ud-report-item--received">
                      <div class="ud-report-item__left">
                        <mat-icon class="ud-report-icon">flag</mat-icon>
                        <div>
                          <p class="ud-report-item__reason">{{ r.reason }}</p>
                          @if (r.details) {
                            <p class="ud-report-item__details">{{ r.details }}</p>
                          }
                          <p class="ud-report-item__meta">
                            por <strong>{{ r.reporter.alias }}</strong> ·
                            {{ r.createdAt | date:'dd/MM/yyyy':'':'es-ES' }}
                            @if (r.group) {
                              · <span class="ud-report-group">{{ r.group.concert.artistName }} - {{ r.group.concert.venue.name }}</span>
                            }
                          </p>
                        </div>
                      </div>
                      @if (r.isRead) {
                        <span class="ud-read-badge">✓ Leído</span>
                      }
                    </div>
                  }
                </div>
              }

              @if (detail.reportsGiven.length > 0) {
                <p class="ud-reports-subtitle" [style.margin-top]="detail.reportsReceived.length > 0 ? '20px' : '0'">
                  Emitidos como reportador
                </p>
                <div class="ud-reports-list">
                  @for (r of detail.reportsGiven; track r.id) {
                    <div class="ud-report-item ud-report-item--given">
                      <div class="ud-report-item__left">
                        <mat-icon class="ud-report-icon">report</mat-icon>
                        <div>
                          <p class="ud-report-item__reason">{{ r.reason }}</p>
                          @if (r.details) {
                            <p class="ud-report-item__details">{{ r.details }}</p>
                          }
                          <p class="ud-report-item__meta">
                            contra <strong>{{ r.reported.alias }}</strong> ·
                            {{ r.createdAt | date:'dd/MM/yyyy':'':'es-ES' }}
                            @if (r.group) {
                              · <span class="ud-report-group">{{ r.group.concert.artistName }} - {{ r.group.concert.venue.name }}</span>
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }

              @if (totalReports === 0) {
                <p class="ud-empty">Sin reportes</p>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .ud-dialog { width: 560px; max-width: 100%; font-family: 'Inter', sans-serif; }
    @media (max-width: 767px) {
      .ud-group-card__top { flex-direction: column; gap: 8px; }
      .ud-group-card__meta { flex-direction: column; gap: 4px; }
      .ud-tab-content { padding: 16px; }
    }

    .ud-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #F3F4F6;

      &__left { display: flex; align-items: center; gap: 12px; }
    }
    .ud-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #EEF2FF;
      color: #3B5BDB;
      font-size: 18px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ud-alias { font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 2px; }
    .ud-email { font-size: 12px; color: #6B7280; margin: 0; }

    .ud-close {
      background: none; border: none; cursor: pointer;
      color: #9CA3AF; padding: 4px; border-radius: 6px;
      display: flex; align-items: center;
      &:hover { background: #F3F4F6; color: #374151; }
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    .ud-loading { padding: 40px 24px; text-align: center; color: #6B7280; font-size: 14px; }

    .ud-tabs { margin: 0; }
    .ud-tab-content { padding: 20px 24px 24px; }

    .ud-section {
      margin-bottom: 20px;
      &__label {
        font-size: 11px;
        font-weight: 600;
        color: #9CA3AF;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 10px;
      }
    }

    .ud-info-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ud-info-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 8px 12px;
      background: #F9FAFB;
      border-radius: 8px;
      font-size: 13px;
      gap: 12px;

      &__key { color: #6B7280; flex-shrink: 0; }
      &__val { font-weight: 500; color: #111827; text-align: right; }
      &--full { flex-direction: column; align-items: flex-start;
        .ud-info-item__val { text-align: left; } }
    }

    .ud-active {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 9999px;
      &--ok { background: #DCFCE7; color: #16A34A; }
      &--ko { background: #FEE2E2; color: #DC2626; }
    }

    .ud-genres {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .ud-genre-chip {
      font-size: 12px;
      padding: 3px 10px;
      background: #EEF2FF;
      color: #3B5BDB;
      border-radius: 9999px;
    }

    .ud-conditions { display: flex; flex-direction: column; gap: 8px; }
    .ud-condition {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #F9FAFB;
      border-radius: 8px;
      font-size: 13px;
      &__key { color: #6B7280; }
      &__val { font-weight: 500; color: #111827; }
    }

    .ud-empty { color: #9CA3AF; font-size: 13px; text-align: center; padding: 24px 0; }

    .ud-groups-list { display: flex; flex-direction: column; gap: 10px; }
    .ud-group-card {
      border: 1px solid #E5E7EB;
      border-radius: 10px;
      padding: 12px 14px;
      background: #FAFAFA;

      &__top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
      }
      &__concert { font-size: 13px; font-weight: 600; color: #111827; margin: 0 0 2px; }
      &__artist  { font-size: 12px; color: #6B7280; margin: 0; }
      &__badges  { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
      &__meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        font-size: 12px;
        color: #6B7280;
        span { display: flex; align-items: center; gap: 4px; }
      }
    }

    .ud-meta-icon { font-size: 13px; width: 13px; height: 13px; }

    .ud-status {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 9999px;
      &--open   { background: #DCFCE7; color: #16A34A; }
      &--full   { background: #FEF3C7; color: #D97706; }
      &--closed { background: #F3F4F6; color: #6B7280; }
    }
    .ud-owner-badge {
      font-size: 10px;
      font-weight: 600;
      background: #EEF2FF;
      color: #3B5BDB;
      padding: 2px 7px;
      border-radius: 9999px;
    }

    .ud-reports-subtitle {
      font-size: 12px;
      font-weight: 600;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 0 10px;
    }
    .ud-reports-list { display: flex; flex-direction: column; gap: 8px; }
    .ud-report-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid;

      &--received { background: #FFF7F7; border-color: #FCA5A5; }
      &--given    { background: #F9FAFB; border-color: #E5E7EB; }

      &__left { display: flex; align-items: flex-start; gap: 8px; }
      &__reason  { font-size: 13px; font-weight: 500; color: #111827; margin: 0 0 2px; }
      &__details { font-size: 12px; color: #9CA3AF; margin: 0 0 4px; }
      &__meta    { font-size: 11px; color: #9CA3AF; margin: 0; }
    }
    .ud-report-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-top: 2px;
      flex-shrink: 0;
      color: #9CA3AF;
    }
    .ud-read-badge {
      font-size: 10px;
      font-weight: 600;
      color: #16A34A;
      background: #DCFCE7;
      border: 1px solid #BBF7D0;
      padding: 2px 7px;
      border-radius: 9999px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .ud-report-group {
      font-size: 10px;
      font-weight: 600;
      background: #EEF2FF;
      color: #3B5BDB;
      padding: 1px 6px;
      border-radius: 9999px;
      border: 1px solid #C7D2FE;
    }
  `]
})
export class UserDetailDialogComponent implements OnInit {
  summary: AdminUser;
  detail: AdminUserDetail | null = null;
  loading = true;

  constructor(
    private ref: MatDialogRef<UserDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { user: AdminUser },
    private adminService: AdminService
  ) {
    this.summary = data.user;
  }

  ngOnInit(): void {
    this.adminService.getUserById(this.summary.id).subscribe(d => {
      this.detail = d;
      this.loading = false;
    });
  }

  get totalReports(): number {
    if (!this.detail) return 0;
    return this.detail.reportsGiven.length + this.detail.reportsReceived.length;
  }

  groupStatusLabel(s: string): string {
    return { OPEN: 'Abierto', FULL: 'Lleno', CLOSED: 'Cerrado' }[s] ?? s;
  }

  arrivalLabel(s: string): string { return ARRIVAL_LABELS[s] ?? s; }
  activityLabel(s: string): string { return ACTIVITY_LABELS[s] ?? s; }

  close(): void { this.ref.close(); }
}
