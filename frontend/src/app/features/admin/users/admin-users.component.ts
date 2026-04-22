import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService, AdminUser } from '../../../core/services/admin.service';
import { UserDetailDialogComponent } from './user-detail-dialog/user-detail-dialog.component';

@Component({
  selector: 'app-admin-users',
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
    <div class="admin-users">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Usuarios</h1>
      </div>

      <!-- Filters -->
      <div class="users-filters">
        <div class="users-filter-field">
          <label class="users-filter-field__label">Alias</label>
          <div class="users-filter-field__input-wrap">
            <svg class="users-filter-field__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5" stroke="#9CA3AF" stroke-width="1.5"/>
              <path d="M13 13l3.5 3.5" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input class="users-filter-field__input"
                   type="text"
                   [(ngModel)]="filterAlias"
                   (ngModelChange)="onFilterChange()"
                   placeholder="Buscar por alias"
                   autocomplete="off">
            @if (filterAlias) {
              <button class="users-filter-field__clear"
                      (click)="filterAlias = ''; onFilterChange()">✕</button>
            }
          </div>
        </div>

        <div class="users-filter-field">
          <label class="users-filter-field__label">Email</label>
          <div class="users-filter-field__input-wrap">
            <svg class="users-filter-field__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5" stroke="#9CA3AF" stroke-width="1.5"/>
              <path d="M13 13l3.5 3.5" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input class="users-filter-field__input"
                   type="text"
                   [(ngModel)]="filterEmail"
                   (ngModelChange)="onFilterChange()"
                   placeholder="Buscar por email"
                   autocomplete="off">
            @if (filterEmail) {
              <button class="users-filter-field__clear"
                      (click)="filterEmail = ''; onFilterChange()">✕</button>
            }
          </div>
        </div>
      </div>

      @if (loading) {
        <p class="admin-loading">Cargando usuarios...</p>
      } @else if (users.length === 0) {
        <p class="admin-empty">No se encontraron usuarios.</p>
      } @else {
        <p class="users-count">{{ users.length }} usuario{{ users.length !== 1 ? 's' : '' }}</p>
        <div class="admin-table-wrapper">
          <table mat-table [dataSource]="users" class="admin-mat-table">

            <ng-container matColumnDef="alias">
              <th mat-header-cell *matHeaderCellDef>Usuario</th>
              <td mat-cell *matCellDef="let u">
                <div class="user-alias-cell">
                  <div class="user-alias-cell__avatar">
                    {{ u.alias.charAt(0).toUpperCase() }}
                  </div>
                  <span class="user-alias-cell__name">{{ u.alias }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let u">{{ u.email }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let u">
                <span class="active-chip"
                      [class.active-chip--active]="u.isActive"
                      [class.active-chip--inactive]="!u.isActive">
                  {{ u.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="groups">
              <th mat-header-cell *matHeaderCellDef>Grupos</th>
              <td mat-cell *matCellDef="let u">
                <span class="count-badge">
                  <mat-icon>people</mat-icon>
                  {{ u._count.groupMembers }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="reports">
              <th mat-header-cell *matHeaderCellDef>Reportes</th>
              <td mat-cell *matCellDef="let u">
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  @if (u._count.reportsReceived > 0) {
                    <span class="count-badge" style="background:#FEF2F2;"
                          [matTooltip]="'Recibidos como reportado'">
                      <mat-icon style="color:#DC2626;">flag</mat-icon>
                      {{ u._count.reportsReceived }}
                    </span>
                  }
                  @if (u._count.reportsGiven > 0) {
                    <span class="count-badge"
                          [matTooltip]="'Emitidos como reportador'">
                      <mat-icon>report</mat-icon>
                      {{ u._count.reportsGiven }}
                    </span>
                  }
                  @if (u._count.reportsReceived === 0 && u._count.reportsGiven === 0) {
                    <span style="font-size:12px;color:#9CA3AF;">-</span>
                  }
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="joined">
              <th mat-header-cell *matHeaderCellDef>Registro</th>
              <td mat-cell *matCellDef="let u">
                {{ u.createdAt | date:'dd/MM/yyyy':'':'es-ES' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let u">
                <button class="action-btn" matTooltip="Ver perfil" (click)="openDetail(u)">
                  <mat-icon>person</mat-icon>
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
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  loading = true;
  displayedColumns = ['alias', 'email', 'status', 'groups', 'reports', 'joined', 'actions'];
  filterAlias = '';
  filterEmail = '';

  private filterTimer: any;

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getUsers({
      alias: this.filterAlias || undefined,
      email: this.filterEmail || undefined,
    }).subscribe(data => {
      this.users = data;
      this.loading = false;
    });
  }

  onFilterChange(): void {
    clearTimeout(this.filterTimer);
    this.filterTimer = setTimeout(() => this.loadUsers(), 350);
  }

  openDetail(user: AdminUser): void {
    this.dialog.open(UserDetailDialogComponent, {
      data: { user },
      panelClass: 'admin-dialog-panel',
      maxWidth: '95vw',
    });
  }
}
