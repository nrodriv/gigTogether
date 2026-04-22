import { Component, Inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AdminGroup } from '../../../../core/services/admin.service';

const ARRIVAL_LABELS: Record<string, string> = {
  EARLY: 'Pronto', ON_TIME: 'A tiempo', LATE: 'Tarde',
};
const ACTIVITY_LABELS: Record<string, string> = {
  HAVE_DRINK: 'Tomar algo', GET_GOOD_SPOT: 'Buen sitio',
  CHAT: 'Charlar', NO_PREFERENCE: 'Sin preferencia',
};

@Component({
  selector: 'app-group-detail-dialog',
  standalone: true,
  imports: [DatePipe, MatDialogModule, MatIconModule],
  template: `
    <div class="gd-dialog">
      <div class="gd-header">
        <div class="gd-header__left">
          <span class="gd-status" [class]="statusClass">{{ statusLabel }}</span>
          <span class="gd-title">Grupo</span>
        </div>
        <button class="gd-close" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="gd-body">
        <!-- Concert info -->
        <div class="gd-section">
          <p class="gd-section__label">Concierto</p>
          <div class="gd-concert-card">
            <p class="gd-concert-card__title">{{ group.concert.title }}</p>
            <p class="gd-concert-card__artist">{{ group.concert.artistName }}</p>
            <div class="gd-concert-card__meta">
              <span>
                <mat-icon class="gd-icon">calendar_today</mat-icon>
                {{ group.concert.date | date:'dd/MM/yyyy':'':'es-ES' }}
              </span>
              <span>
                <mat-icon class="gd-icon">domain</mat-icon>
                {{ group.concert.venue.name }}
              </span>
              <span>
                <mat-icon class="gd-icon">location_city</mat-icon>
                {{ group.concert.venue.city.name }}
              </span>
            </div>
          </div>
        </div>

        <!-- Group conditions -->
        <div class="gd-section">
          <p class="gd-section__label">Condiciones del grupo</p>
          <div class="gd-conditions">
            <div class="gd-condition">
              <span class="gd-condition__key">Punto de encuentro</span>
              <span class="gd-condition__val">{{ group.meetingPoint?.name ?? '-' }}</span>
            </div>
            <div class="gd-condition">
              <span class="gd-condition__key">Llegada</span>
              <span class="gd-condition__val">{{ arrivalLabel }}</span>
            </div>
            <div class="gd-condition">
              <span class="gd-condition__key">Actividad</span>
              <span class="gd-condition__val">{{ activityLabel }}</span>
            </div>
            <div class="gd-condition">
              <span class="gd-condition__key">Tamaño máximo</span>
              <span class="gd-condition__val">{{ group.members.length }} / {{ group.maxSize }}</span>
            </div>
            <div class="gd-condition">
              <span class="gd-condition__key">Creado</span>
              <span class="gd-condition__val">{{ group.createdAt | date:'dd/MM/yyyy HH:mm':'':'es-ES' }}</span>
            </div>
          </div>
        </div>

        <!-- Members -->
        <div class="gd-section">
          <p class="gd-section__label">Miembros ({{ group.members.length }})</p>
          <ul class="gd-members">
            @for (m of group.members; track m.id) {
              <li class="gd-member">
                <div class="gd-member__avatar">
                  {{ m.user.alias.charAt(0).toUpperCase() }}
                </div>
                <div class="gd-member__info">
                  <span class="gd-member__alias">{{ m.user.alias }}</span>
                  @if (m.isOwner) {
                    <span class="gd-member__owner">Creador</span>
                  }
                </div>
                <span class="gd-member__date">{{ m.joinedAt | date:'dd/MM/yy':'':'es-ES' }}</span>
              </li>
            }
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gd-dialog { width: 480px; max-width: 100%; font-family: 'Inter', sans-serif; }
    @media (max-width: 767px) {
      .gd-concert-card__meta { flex-direction: column; gap: 6px; }
    }

    .gd-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #F3F4F6;

      &__left { display: flex; align-items: center; gap: 10px; }
    }
    .gd-title { font-size: 18px; font-weight: 700; color: #111827; }
    .gd-close {
      background: none; border: none; cursor: pointer;
      color: #9CA3AF; padding: 4px; border-radius: 6px;
      display: flex; align-items: center;
      &:hover { background: #F3F4F6; color: #374151; }
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    .gd-status {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 9999px;
      &.open   { background: #DCFCE7; color: #16A34A; }
      &.full   { background: #FEF3C7; color: #D97706; }
      &.closed { background: #F3F4F6; color: #6B7280; }
    }

    .gd-body { padding: 0 24px 24px; }

    .gd-section {
      margin-top: 20px;
      &__label {
        font-size: 11px;
        font-weight: 600;
        color: #9CA3AF;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 10px;
      }
    }

    .gd-concert-card {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 10px;
      padding: 14px 16px;

      &__title  { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 2px; }
      &__artist { font-size: 13px; color: #6B7280; margin: 0 0 10px; }
      &__meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        font-size: 12px;
        color: #374151;
        span { display: flex; align-items: center; gap: 4px; }
      }
    }

    .gd-icon { font-size: 14px; width: 14px; height: 14px; color: #9CA3AF; }

    .gd-conditions { display: flex; flex-direction: column; gap: 8px; }
    .gd-condition {
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

    .gd-members {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .gd-member {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: #F9FAFB;
      border-radius: 8px;

      &__avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #EEF2FF;
        color: #3B5BDB;
        font-size: 13px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      &__info { display: flex; align-items: center; gap: 6px; flex: 1; }
      &__alias { font-size: 13px; font-weight: 500; color: #111827; }
      &__owner {
        font-size: 10px;
        font-weight: 600;
        background: #EEF2FF;
        color: #3B5BDB;
        padding: 1px 7px;
        border-radius: 9999px;
      }
      &__date { font-size: 11px; color: #9CA3AF; margin-left: auto; }
    }
  `]
})
export class GroupDetailDialogComponent {
  group: AdminGroup;

  constructor(
    private ref: MatDialogRef<GroupDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { group: AdminGroup }
  ) {
    this.group = data.group;
  }

  get statusClass(): string {
    return this.group.status.toLowerCase();
  }

  get statusLabel(): string {
    return { OPEN: 'Abierto', FULL: 'Lleno', CLOSED: 'Cerrado' }[this.group.status] ?? this.group.status;
  }

  get arrivalLabel(): string {
    return ARRIVAL_LABELS[this.group.arrivalWindow] ?? this.group.arrivalWindow;
  }

  get activityLabel(): string {
    return ACTIVITY_LABELS[this.group.activityType] ?? this.group.activityType;
  }

  close(): void { this.ref.close(); }
}
