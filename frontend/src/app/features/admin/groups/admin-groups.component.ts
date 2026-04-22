import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import {
  AdminService, AdminGroup, AdminCity, AdminVenue, AdminConcert
} from '../../../core/services/admin.service';
import { GroupDetailDialogComponent } from './group-detail-dialog/group-detail-dialog.component';

const ARRIVAL_LABELS: Record<string, string> = {
  EARLY: 'Pronto', ON_TIME: 'A tiempo', LATE: 'Tarde',
};
const ACTIVITY_LABELS: Record<string, string> = {
  HAVE_DRINK: 'Tomar algo', GET_GOOD_SPOT: 'Buen sitio',
  CHAT: 'Charlar', NO_PREFERENCE: 'Sin preferencia',
};

@Component({
  selector: 'app-admin-groups',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  template: `
    <div class="admin-groups">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Grupos</h1>
      </div>

      <!-- Filters -->
      <div class="groups-filters">
        <div class="groups-filter-field">
          <label class="groups-filter-field__label">Ciudad</label>
          <div class="groups-filter-field__select-wrap">
            <select class="groups-filter-field__select"
                    [(ngModel)]="filterCityId"
                    (ngModelChange)="onCityChange()">
              <option value="">Todas</option>
              @for (c of cities; track c.id) {
                <option [value]="c.id">{{ c.name }}</option>
              }
            </select>
          </div>
        </div>

        <div class="groups-filter-field">
          <label class="groups-filter-field__label">Sala</label>
          <div class="groups-filter-field__select-wrap">
            <select class="groups-filter-field__select"
                    [(ngModel)]="filterVenueId"
                    (ngModelChange)="onVenueChange()"
                    [disabled]="!filterCityId">
              <option value="">Todas</option>
              @for (v of filteredVenues; track v.id) {
                <option [value]="v.id">{{ v.name }}</option>
              }
            </select>
          </div>
        </div>

        <div class="groups-filter-field">
          <label class="groups-filter-field__label">Concierto</label>
          <div class="groups-filter-field__select-wrap">
            <select class="groups-filter-field__select"
                    [(ngModel)]="filterConcertId"
                    (ngModelChange)="applyFilters()"
                    [disabled]="!filterVenueId">
              <option value="">Todos</option>
              @for (c of filteredConcerts; track c.id) {
                <option [value]="c.id">{{ c.title }}</option>
              }
            </select>
          </div>
        </div>

        <div class="groups-filter-field">
          <label class="groups-filter-field__label">Estado</label>
          <div class="groups-filter-field__select-wrap">
            <select class="groups-filter-field__select"
                    [(ngModel)]="filterStatus"
                    (ngModelChange)="applyFilters()">
              <option value="">Todos</option>
              <option value="OPEN">Abierto</option>
              <option value="FULL">Lleno</option>
              <option value="CLOSED">Cerrado</option>
            </select>
          </div>
        </div>

        <div class="groups-filter-field">
          <label class="groups-filter-field__label">Usuario (alias)</label>
          <div class="groups-filter-field__input-wrap">
            <svg class="groups-filter-field__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5" stroke="#9CA3AF" stroke-width="1.5"/>
              <path d="M13 13l3.5 3.5" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input class="groups-filter-field__input"
                   type="text"
                   [(ngModel)]="filterUserAlias"
                   (ngModelChange)="onUserAliasChange()"
                   placeholder="Alias"
                   autocomplete="off">
            @if (filterUserAlias) {
              <button class="groups-filter-field__clear"
                      (click)="filterUserAlias = ''; filterUserId = ''; applyFilters()">✕</button>
            }
          </div>
        </div>
      </div>

      @if (loading) {
        <p class="admin-loading">Cargando grupos...</p>
      } @else if (filteredGroups.length === 0) {
        <p class="admin-empty">No hay grupos con los filtros aplicados.</p>
      } @else {
        <p class="groups-count">{{ filteredGroups.length }} grupo{{ filteredGroups.length !== 1 ? 's' : '' }}</p>
        <div class="admin-table-wrapper">
          <table mat-table [dataSource]="filteredGroups" class="admin-mat-table">

            <ng-container matColumnDef="concert">
              <th mat-header-cell *matHeaderCellDef>Concierto</th>
              <td mat-cell *matCellDef="let g">
                <div class="cell-concert">
                  <span class="cell-concert__title">{{ g.concert.title }}</span>
                  <span class="cell-concert__artist">{{ g.concert.artistName }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="venue">
              <th mat-header-cell *matHeaderCellDef>Sala / Ciudad</th>
              <td mat-cell *matCellDef="let g">
                <div class="cell-venue">
                  <span class="cell-venue__name">{{ g.concert.venue.name }}</span>
                  <span class="cell-venue__city">{{ g.concert.venue.city.name }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let g">
                <span class="group-status group-status--{{ g.status.toLowerCase() }}">
                  {{ statusLabel(g.status) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="members">
              <th mat-header-cell *matHeaderCellDef>Miembros</th>
              <td mat-cell *matCellDef="let g">
                <div class="members-cell">
                  <div class="members-cell__avatars">
                    @for (m of g.members.slice(0,4); track m.id) {
                      <div class="members-cell__avatar"
                           [matTooltip]="m.user.alias">
                        {{ m.user.alias.charAt(0).toUpperCase() }}
                      </div>
                    }
                  </div>
                  <span class="members-cell__count">{{ g.members.length }}/{{ g.maxSize }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="conditions">
              <th mat-header-cell *matHeaderCellDef>Condiciones</th>
              <td mat-cell *matCellDef="let g">
                <div style="display:flex;flex-direction:column;gap:4px;">
                  <span class="label-chip">{{ arrivalLabel(g.arrivalWindow) }}</span>
                  <span class="label-chip">{{ activityLabel(g.activityType) }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Creado</th>
              <td mat-cell *matCellDef="let g">{{ g.createdAt | date:'dd/MM/yyyy':'':'es-ES' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let g">
                <button class="action-btn" matTooltip="Ver detalle" (click)="openDetail(g)">
                  <mat-icon>visibility</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
      }
    </div>
  `,
  styleUrl: './admin-groups.component.scss'
})
export class AdminGroupsComponent implements OnInit {
  groups: AdminGroup[] = [];
  filteredGroups: AdminGroup[] = [];
  cities: AdminCity[] = [];
  venues: AdminVenue[] = [];
  concerts: AdminConcert[] = [];
  filteredVenues: AdminVenue[] = [];
  filteredConcerts: AdminConcert[] = [];
  loading = true;
  displayedColumns = ['concert', 'venue', 'status', 'members', 'conditions', 'date', 'actions'];

  filterCityId = '';
  filterVenueId = '';
  filterConcertId = '';
  filterStatus = '';
  filterUserAlias = '';
  filterUserId = '';

  private userAliasTimer: any;

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    forkJoin({
      cities: this.adminService.getCities(),
      venues: this.adminService.getVenues(),
      concerts: this.adminService.getConcerts(),
    }).subscribe(({ cities, venues, concerts }) => {
      this.cities = cities;
      this.venues = venues;
      this.concerts = concerts;
      this.loadGroups();
    });
  }

  loadGroups(): void {
    this.loading = true;
    this.adminService.getGroups().subscribe(data => {
      this.groups = data;
      this.applyFilters();
      this.loading = false;
    });
  }

  onCityChange(): void {
    this.filterVenueId = '';
    this.filterConcertId = '';
    this.filteredVenues = this.filterCityId
      ? this.venues.filter(v => v.city.id === this.filterCityId)
      : [];
    this.filteredConcerts = [];
    this.applyFilters();
  }

  onVenueChange(): void {
    this.filterConcertId = '';
    this.filteredConcerts = this.filterVenueId
      ? this.concerts.filter(c => c.venue.id === this.filterVenueId)
      : [];
    this.applyFilters();
  }

  onUserAliasChange(): void {
    clearTimeout(this.userAliasTimer);
    this.userAliasTimer = setTimeout(() => this.applyFilters(), 300);
  }

  applyFilters(): void {
    let result = [...this.groups];

    if (this.filterStatus) {
      result = result.filter(g => g.status === this.filterStatus);
    }
    if (this.filterConcertId) {
      result = result.filter(g => g.concert.id === this.filterConcertId);
    } else if (this.filterVenueId) {
      result = result.filter(g => g.concert.venue.id === this.filterVenueId);
    } else if (this.filterCityId) {
      result = result.filter(g => g.concert.venue.city.id === this.filterCityId);
    }
    if (this.filterUserAlias.trim()) {
      const alias = this.filterUserAlias.trim().toLowerCase();
      result = result.filter(g =>
        g.members.some(m => m.user.alias.toLowerCase().includes(alias))
      );
    }

    this.filteredGroups = result;
  }

  openDetail(group: AdminGroup): void {
    this.dialog.open(GroupDetailDialogComponent, {
      data: { group },
      panelClass: 'admin-dialog-panel',
      maxWidth: '95vw',
    });
  }

  statusLabel(s: string): string {
    return { OPEN: 'Abierto', FULL: 'Lleno', CLOSED: 'Cerrado' }[s] ?? s;
  }

  arrivalLabel(s: string): string {
    return ARRIVAL_LABELS[s] ?? s;
  }

  activityLabel(s: string): string {
    return ACTIVITY_LABELS[s] ?? s;
  }
}
