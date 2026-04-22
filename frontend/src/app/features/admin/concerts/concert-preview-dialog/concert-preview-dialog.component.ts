import { Component, Inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminConcert, AdminMeetingPoint } from '../../../../core/services/admin.service';

export interface ConcertPreviewData {
  concert: AdminConcert & { venue: { id: string; name: string; address?: string; city: { name: string } } };
  meetingPoints: AdminMeetingPoint[];
}

interface ArrivalWindow { label: string; }

@Component({
  selector: 'app-concert-preview-dialog',
  standalone: true,
  imports: [DatePipe, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="preview-dialog">
      <div class="preview-dialog__header">
        <span class="preview-dialog__badge">Vista previa del usuario</span>
        <button mat-icon-button mat-dialog-close class="preview-dialog__close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="preview-dialog__body">
        <div class="preview-left">
          <img [src]="concert.imageUrl || 'https://picsum.photos/seed/default/800/450'"
               [alt]="concert.artistName"
               class="preview-hero" />

          <h1 class="preview-artist">{{ concert.artistName }}</h1>

          @if (concert.genre) {
            <span class="preview-genre">{{ concert.genre }}</span>
          }

          <div class="preview-info">
            <div class="preview-info__row">
              <span class="preview-info__label">Fecha</span>
              <span class="preview-info__value">
                {{ concert.date | date:'EEEE d MMMM yyyy':'':'es-ES' }} · {{ concert.doorsOpenTime }}h
              </span>
            </div>
            <div class="preview-info__row">
              <span class="preview-info__label">Sala</span>
              <div>
                <span class="preview-info__value preview-info__value--bold">{{ concert.venue.name }}</span>
                @if (concert.venue.address) {
                  <span class="preview-info__address">{{ concert.venue.address }}</span>
                }
              </div>
            </div>
            @if (data.meetingPoints.length > 0) {
              <div class="preview-info__row">
                <span class="preview-info__label">Puntos de encuentro</span>
                <ul class="preview-mp-list">
                  @for (mp of data.meetingPoints; track mp.id) {
                    <li>· {{ mp.name }}@if (mp.description) { <span class="preview-mp-desc"> - {{ mp.description }}</span> }</li>
                  }
                </ul>
              </div>
            }
          </div>
        </div>

        <div class="preview-right">
          <div class="preview-card">
            <h2 class="preview-card__title">Configura tu previa</h2>
            <p class="preview-card__subtitle">Elige cómo quieres organizarte antes del concierto</p>

            @if (data.meetingPoints.length > 0) {
              <div class="preview-section">
                <p class="preview-section__label">Punto de encuentro</p>
                <div class="preview-section__options">
                  @for (mp of data.meetingPoints; track mp.id) {
                    <div class="option-item-preview">{{ mp.name }}</div>
                  }
                </div>
              </div>
            } @else {
              <div class="preview-section">
                <p class="preview-section__label">Punto de encuentro</p>
                <p class="preview-empty-note">Sin puntos de encuentro definidos para esta sala.</p>
              </div>
            }

            <div class="preview-section">
              <p class="preview-section__label">Franja de llegada</p>
              <div class="preview-section__pills">
                @for (w of arrivalWindows; track w.label) {
                  <div class="arrival-pill-preview">{{ w.label }}</div>
                }
              </div>
            </div>

            <div class="preview-section">
              <p class="preview-section__label">¿Qué te apetece?</p>
              <div class="preview-section__options">
                <div class="option-item-preview">Tomar algo tranquilamente</div>
                <div class="option-item-preview">Coger buen sitio para el concierto</div>
                <div class="option-item-preview">Charlar sin prisa antes del concierto</div>
              </div>
            </div>

            <button class="btn-preview-cta" disabled>Voy solo/a</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .preview-dialog {
      width: min(900px, 90vw);
      max-height: 85vh;
      overflow-y: auto;
      font-family: 'Inter', sans-serif;
    }
    .preview-dialog__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px 12px;
      border-bottom: 1px solid #E5E7EB;
      position: sticky;
      top: 0;
      background: #fff;
      z-index: 1;
    }
    .preview-dialog__badge {
      font-size: 12px;
      font-weight: 600;
      background: #FEF3C7;
      color: #D97706;
      padding: 4px 10px;
      border-radius: 9999px;
    }
    .preview-dialog__close { color: #6B7280; }
    .preview-dialog__body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding: 24px;
    }
    .preview-hero {
      width: 100%;
      aspect-ratio: 16/9;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 16px;
    }
    .preview-artist { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 8px; }
    .preview-genre {
      display: inline-block;
      font-size: 12px;
      background: #EEF2FF;
      color: #3B5BDB;
      padding: 3px 10px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    .preview-info { display: flex; flex-direction: column; gap: 12px; }
    .preview-info__row { display: flex; flex-direction: column; gap: 2px; }
    .preview-info__label { font-size: 11px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; }
    .preview-info__value { font-size: 14px; color: #111827; }
    .preview-info__value--bold { font-weight: 600; }
    .preview-info__address { font-size: 12px; color: #6B7280; display: block; margin-top: 2px; }
    .preview-mp-list { list-style: none; padding: 0; margin: 4px 0 0; font-size: 13px; color: #374151; }
    .preview-mp-desc { color: #9CA3AF; }
    .preview-card {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 16px;
      padding: 24px;
    }
    .preview-card__title { font-size: 17px; font-weight: 700; color: #111827; margin: 0 0 4px; }
    .preview-card__subtitle { font-size: 13px; color: #6B7280; margin: 0 0 20px; }
    .preview-section { margin-bottom: 20px; }
    .preview-section__label { font-size: 12px; font-weight: 600; color: #374151; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.04em; }
    .preview-section__options { display: flex; flex-direction: column; gap: 8px; }
    .preview-section__pills { display: flex; flex-wrap: wrap; gap: 8px; }
    .option-item-preview {
      padding: 10px 14px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 13px;
      color: #374151;
      background: #fff;
    }
    .arrival-pill-preview {
      padding: 7px 14px;
      border: 1px solid #D1D5DB;
      border-radius: 9999px;
      font-size: 13px;
      color: #374151;
      background: #fff;
    }
    .preview-empty-note { font-size: 13px; color: #9CA3AF; font-style: italic; }
    .btn-preview-cta {
      width: 100%;
      padding: 12px;
      background: #3B5BDB;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      opacity: 0.6;
      cursor: not-allowed;
      margin-top: 8px;
    }
    @media (max-width: 640px) {
      .preview-dialog__body { grid-template-columns: 1fr; }
    }
  `]
})
export class ConcertPreviewDialogComponent {
  concert: ConcertPreviewData['concert'];
  arrivalWindows: ArrivalWindow[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: ConcertPreviewData) {
    this.concert = data.concert;
    this.arrivalWindows = this.buildWindows(data.concert.doorsOpenTime);
  }

  private buildWindows(doorsOpenTime: string): ArrivalWindow[] {
    const [h, m] = doorsOpenTime.split(':').map(Number);
    const total = h * 60 + m;
    const fmt = (mins: number) => {
      const hh = Math.floor(((mins % 1440) + 1440) % 1440 / 60);
      const mm = ((mins % 60) + 60) % 60;
      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    };
    return [
      { label: `${fmt(total - 90)} – ${fmt(total - 60)}` },
      { label: `${fmt(total - 60)} – ${fmt(total - 30)}` },
      { label: `${fmt(total - 30)} – ${fmt(total)}` },
    ];
  }
}
