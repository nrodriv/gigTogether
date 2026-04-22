import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { distinctUntilChanged, skip, map } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService, AdminReport, AdminBlock } from '../../../core/services/admin.service';
import { AdminNotificationsService } from '../../../core/services/admin-notifications.service';
import { GroupDetailDialogComponent } from '../groups/group-detail-dialog/group-detail-dialog.component';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatTabsModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    <div class="admin-reports">
      <h1 class="admin-page-title">Reportes y bloqueos</h1>

      <mat-tab-group animationDuration="0" class="reports-tabs">

        <!-- TAB: REPORTES -->
        <mat-tab [label]="'Reportes (' + reports.length + ')'">
          <div class="tab-content">
            <div class="reports-filters">
              <div class="reports-filter-field">
                <label class="reports-filter-field__label" for="filterReporter">Reportado por</label>
                <div class="reports-filter-field__input-wrap">
                  <svg class="reports-filter-field__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="8.5" cy="8.5" r="5" stroke="#9CA3AF" stroke-width="1.5"/>
                    <path d="M13 13l3.5 3.5" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  <input id="filterReporter" class="reports-filter-field__input"
                         type="text" [(ngModel)]="filterReporter"
                         (ngModelChange)="applyFilters()"
                         placeholder="Alias del reportador"
                         autocomplete="off">
                  @if (filterReporter) {
                    <button class="reports-filter-field__clear" aria-label="Limpiar" (click)="filterReporter = ''; applyFilters()">✕</button>
                  }
                </div>
              </div>

              <div class="reports-filter-field">
                <label class="reports-filter-field__label" for="filterReported">Usuario reportado</label>
                <div class="reports-filter-field__input-wrap">
                  <svg class="reports-filter-field__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="8.5" cy="8.5" r="5" stroke="#9CA3AF" stroke-width="1.5"/>
                    <path d="M13 13l3.5 3.5" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  <input id="filterReported" class="reports-filter-field__input"
                         type="text" [(ngModel)]="filterReported"
                         (ngModelChange)="applyFilters()"
                         placeholder="Alias del reportado"
                         autocomplete="off">
                  @if (filterReported) {
                    <button class="reports-filter-field__clear" aria-label="Limpiar" (click)="filterReported = ''; applyFilters()">✕</button>
                  }
                </div>
              </div>
            </div>

            @if (loadingReports) {
              <p class="admin-loading">Cargando reportes...</p>
            } @else if (filteredReports.length === 0) {
              <p class="admin-empty">No hay reportes con los filtros aplicados.</p>
            } @else {
              <div class="admin-table-wrapper">
                <table mat-table [dataSource]="filteredReports" class="admin-mat-table">

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let r" class="status-cell">
                      @if (r.isRead) {
                        <span class="read-badge">✓ Leído</span>
                      } @else {
                        <button class="mark-read-btn"
                                matTooltip="Marcar como leído"
                                (click)="markAsRead(r)">
                          <mat-icon>done</mat-icon>
                          Marcar leído
                        </button>
                      }
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="reporter">
                    <th mat-header-cell *matHeaderCellDef>Reportado por</th>
                    <td mat-cell *matCellDef="let r">{{ r.reporter.alias }}</td>
                  </ng-container>

                  <ng-container matColumnDef="reported">
                    <th mat-header-cell *matHeaderCellDef>Usuario reportado</th>
                    <td mat-cell *matCellDef="let r">{{ r.reported.alias }}</td>
                  </ng-container>

                  <ng-container matColumnDef="group">
                    <th mat-header-cell *matHeaderCellDef>Grupo</th>
                    <td mat-cell *matCellDef="let r">
                      @if (r.group) {
                        <button class="cell-group-btn" (click)="openGroup(r.group.id)"
                                matTooltip="Ver detalles del grupo">
                          {{ r.group.concert.artistName }} - {{ r.group.concert.venue.name }}
                          <mat-icon class="cell-group-btn__icon">open_in_new</mat-icon>
                        </button>
                      } @else {
                        <span class="cell-no-group">-</span>
                      }
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="reason">
                    <th mat-header-cell *matHeaderCellDef>Motivo</th>
                    <td mat-cell *matCellDef="let r">
                      <div class="cell-reason">
                        <span>{{ r.reason }}</span>
                        @if (r.details) {
                          <span class="cell-reason__details">{{ r.details }}</span>
                        }
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Fecha</th>
                    <td mat-cell *matCellDef="let r">{{ r.createdAt | date:'dd/MM/yyyy':'':'es-ES' }}</td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="reportColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: reportColumns;"
                      [class.report-row--unread]="!row.isRead"
                      [class.report-row--read]="row.isRead"></tr>
                </table>
              </div>
            }
          </div>
        </mat-tab>

        <!-- TAB: BLOQUEOS -->
        <mat-tab [label]="'Bloqueos (' + blocks.length + ')'">
          <div class="tab-content">
            <div class="reports-filters">
              <div class="reports-filter-field">
                <label class="reports-filter-field__label" for="filterBlocker">Bloqueado por</label>
                <div class="reports-filter-field__input-wrap">
                  <svg class="reports-filter-field__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="8.5" cy="8.5" r="5" stroke="#9CA3AF" stroke-width="1.5"/>
                    <path d="M13 13l3.5 3.5" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  <input id="filterBlocker" class="reports-filter-field__input"
                         type="text" [(ngModel)]="filterBlocker"
                         (ngModelChange)="applyBlockFilters()"
                         placeholder="Alias del que bloquea"
                         autocomplete="off">
                  @if (filterBlocker) {
                    <button class="reports-filter-field__clear" aria-label="Limpiar" (click)="filterBlocker = ''; applyBlockFilters()">✕</button>
                  }
                </div>
              </div>

              <div class="reports-filter-field">
                <label class="reports-filter-field__label" for="filterBlocked">Usuario bloqueado</label>
                <div class="reports-filter-field__input-wrap">
                  <svg class="reports-filter-field__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="8.5" cy="8.5" r="5" stroke="#9CA3AF" stroke-width="1.5"/>
                    <path d="M13 13l3.5 3.5" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  <input id="filterBlocked" class="reports-filter-field__input"
                         type="text" [(ngModel)]="filterBlocked"
                         (ngModelChange)="applyBlockFilters()"
                         placeholder="Alias del bloqueado"
                         autocomplete="off">
                  @if (filterBlocked) {
                    <button class="reports-filter-field__clear" aria-label="Limpiar" (click)="filterBlocked = ''; applyBlockFilters()">✕</button>
                  }
                </div>
              </div>
            </div>

            @if (loadingBlocks) {
              <p class="admin-loading">Cargando bloqueos...</p>
            } @else if (filteredBlocks.length === 0) {
              <p class="admin-empty">No hay bloqueos con los filtros aplicados.</p>
            } @else {
              <div class="admin-table-wrapper">
                <table mat-table [dataSource]="filteredBlocks" class="admin-mat-table">

                  <ng-container matColumnDef="blocker">
                    <th mat-header-cell *matHeaderCellDef>Bloqueado por</th>
                    <td mat-cell *matCellDef="let b">{{ b.blocker.alias }}</td>
                  </ng-container>

                  <ng-container matColumnDef="blocked">
                    <th mat-header-cell *matHeaderCellDef>Usuario bloqueado</th>
                    <td mat-cell *matCellDef="let b">{{ b.blocked.alias }}</td>
                  </ng-container>

                  <ng-container matColumnDef="blockGroup">
                    <th mat-header-cell *matHeaderCellDef>Grupo</th>
                    <td mat-cell *matCellDef="let b">
                      @if (b.group) {
                        <button class="cell-group-btn" (click)="openGroup(b.group.id)"
                                matTooltip="Ver detalles del grupo">
                          {{ b.group.concert.artistName }} - {{ b.group.concert.venue.name }}
                          <mat-icon class="cell-group-btn__icon">open_in_new</mat-icon>
                        </button>
                      } @else {
                        <span class="cell-no-group">-</span>
                      }
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="blockDate">
                    <th mat-header-cell *matHeaderCellDef>Fecha</th>
                    <td mat-cell *matCellDef="let b">{{ b.createdAt | date:'dd/MM/yyyy':'':'es-ES' }}</td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="blockColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: blockColumns;"></tr>
                </table>
              </div>
            }
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .tab-content { padding: 24px 0 0; }
    .status-cell { white-space: nowrap; width: 130px; }
    .read-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      color: #16A34A;
      background: #DCFCE7;
      border: 1px solid #BBF7D0;
      padding: 2px 8px;
      border-radius: 9999px;
      white-space: nowrap;
    }
    .report-row--unread td { font-weight: 500; }
    .mark-read-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border: 1px solid #D1D5DB;
      border-radius: 6px;
      background: #fff;
      color: #374151;
      font-size: 12px;
      font-weight: 500;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: border-color 0.12s, color 0.12s, background 0.12s;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
      &:hover { border-color: #16A34A; color: #16A34A; background: #F0FDF4; }
    }
    .cell-group-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #3B5BDB;
      background: #EEF2FF;
      border: 1px solid #C7D2FE;
      padding: 2px 8px 2px 10px;
      border-radius: 9999px;
      white-space: nowrap;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      transition: background 0.12s, border-color 0.12s;
      &:hover { background: #E0E7FF; border-color: #A5B4FC; }
      &__icon { font-size: 13px; width: 13px; height: 13px; }
    }
    .cell-no-group { color: #9CA3AF; font-size: 13px; }
  `],
  styleUrl: './admin-reports.component.scss'
})
export class AdminReportsComponent implements OnInit {
  reports: AdminReport[] = [];
  filteredReports: AdminReport[] = [];
  blocks: AdminBlock[] = [];
  filteredBlocks: AdminBlock[] = [];

  loadingReports = true;
  loadingBlocks = true;

  reportColumns = ['status', 'reporter', 'reported', 'group', 'reason', 'date'];
  blockColumns = ['blocker', 'blocked', 'blockGroup', 'blockDate'];

  filterReporter = '';
  filterReported = '';
  filterBlocker = '';
  filterBlocked = '';

  private destroyRef = inject(DestroyRef);

  constructor(
    private adminService: AdminService,
    private adminNotifSvc: AdminNotificationsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadReports();
    this.loadBlocks();


    this.adminNotifSvc.unreadReportCount$.pipe(
      distinctUntilChanged(),
      skip(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.loadReports());


    this.adminNotifSvc.items$.pipe(
      map(items => items.filter(i => i.type === 'BLOCK').length),
      distinctUntilChanged(),
      skip(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.loadBlocks());
  }

  loadReports(): void {
    this.loadingReports = true;
    this.adminService.getReports().subscribe(data => {
      this.reports = data;
      this.applyFilters();
      this.loadingReports = false;
    });
  }

  loadBlocks(): void {
    this.loadingBlocks = true;
    this.adminService.getBlocks().subscribe(data => {
      this.blocks = data;
      this.applyBlockFilters();
      this.loadingBlocks = false;
    });
  }

  applyFilters(): void {
    let result = [...this.reports];
    if (this.filterReporter) {
      result = result.filter(r => r.reporter.alias.toLowerCase().includes(this.filterReporter.toLowerCase()));
    }
    if (this.filterReported) {
      result = result.filter(r => r.reported.alias.toLowerCase().includes(this.filterReported.toLowerCase()));
    }
    this.filteredReports = result;
  }

  applyBlockFilters(): void {
    let result = [...this.blocks];
    if (this.filterBlocker) {
      result = result.filter(b => b.blocker.alias.toLowerCase().includes(this.filterBlocker.toLowerCase()));
    }
    if (this.filterBlocked) {
      result = result.filter(b => b.blocked.alias.toLowerCase().includes(this.filterBlocked.toLowerCase()));
    }
    this.filteredBlocks = result;
  }

  openGroup(groupId: string): void {
    this.adminService.getGroupById(groupId).subscribe(group => {
      this.dialog.open(GroupDetailDialogComponent, {
        data: { group },
        width: '520px',
        maxWidth: '95vw',
      });
    });
  }

  markAsRead(report: AdminReport): void {
    this.adminService.markReportAsRead(report.id).subscribe({
      next: () => {
        report.isRead = true;
        this.adminNotifSvc.markOneReportRead(report.id);
        this.snackBar.open('Reporte marcado como leído', '', { duration: 2500, panelClass: ['snack-success'] });
      },
      error: () => {
        this.snackBar.open('Error al actualizar el reporte', '', { duration: 3000, panelClass: ['snack-error'] });
      }
    });
  }
}
