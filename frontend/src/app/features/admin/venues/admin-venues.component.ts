import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormGroupDirective } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService, AdminVenue, AdminCity } from '../../../core/services/admin.service';
import { VenueEditDialogComponent } from './venue-edit-dialog/venue-edit-dialog.component';

interface PendingMeetingPoint { name: string; description?: string; }

@Component({
  selector: 'app-admin-venues',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="admin-venues">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Salas</h1>
      </div>

      @if (loading) {
        <p class="admin-loading">Cargando salas...</p>
      } @else {
        <div class="admin-table-wrapper">
          <table mat-table [dataSource]="venues" class="admin-mat-table">

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let v">{{ v.name }}</td>
            </ng-container>

            <ng-container matColumnDef="address">
              <th mat-header-cell *matHeaderCellDef>Dirección</th>
              <td mat-cell *matCellDef="let v">{{ v.address }}</td>
            </ng-container>

            <ng-container matColumnDef="city">
              <th mat-header-cell *matHeaderCellDef>Ciudad</th>
              <td mat-cell *matCellDef="let v">{{ v.city.name }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let v">
                <div class="cell-actions">
                  <button class="action-btn action-btn--edit"
                          matTooltip="Editar"
                          (click)="openEdit(v)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button class="action-btn action-btn--delete"
                          matTooltip="Eliminar"
                          (click)="deleteVenue(v.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
      }

      <div class="add-venue-section">
        <h2 class="admin-section-title">Añadir nueva sala</h2>
        <div class="admin-form-card">
          <form [formGroup]="createForm" #formDir="ngForm" (ngSubmit)="onAddVenue(formDir)">

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Ciudad</mat-label>
                <mat-select formControlName="cityId">
                  @for (city of cities; track city.id) {
                    <mat-option [value]="city.id">{{ city.name }}</mat-option>
                  }
                </mat-select>
                <mat-error>Selecciona una ciudad</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Nombre de la sala</mat-label>
                <input matInput formControlName="name" placeholder="Sala Caracol" />
                <mat-error>Mínimo 2 caracteres</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Dirección</mat-label>
                <input matInput formControlName="address" placeholder="C/ Mayor, 1" />
                <mat-error>Introduce la dirección</mat-error>
              </mat-form-field>
            </div>

            <div class="mp-inline-section">
              <p class="mp-inline-label">Puntos de encuentro</p>

              @if (pendingMps.length > 0) {
                <ul class="mp-pending-list">
                  @for (mp of pendingMps; track $index) {
                    <li class="mp-pending-list__item">
                      <span class="mp-pending-list__name">{{ mp.name }}</span>
                      @if (mp.description) {
                        <span class="mp-pending-list__desc"> - {{ mp.description }}</span>
                      }
                      <button type="button" class="mp-pending-list__remove"
                              (click)="removePendingMp($index)"
                              title="Quitar">
                        <mat-icon>close</mat-icon>
                      </button>
                    </li>
                  }
                </ul>
              }

              <div class="mp-add-row">
                <mat-form-field appearance="outline" class="form-field mp-field-name">
                  <mat-label>Nombre del punto</mat-label>
                  <input matInput [formControl]="mpNameCtrl" placeholder="Puerta principal"
                         (keydown.enter)="$event.preventDefault(); addPendingMp()" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="form-field mp-field-desc">
                  <mat-label>Descripción (opcional)</mat-label>
                  <input matInput [formControl]="mpDescCtrl" placeholder="Al lado de la taquilla"
                         (keydown.enter)="$event.preventDefault(); addPendingMp()" />
                </mat-form-field>
                <button type="button" class="btn-add-mp" (click)="addPendingMp()"
                        [disabled]="!mpNameCtrl.value?.trim()">
                  <mat-icon>add</mat-icon>
                </button>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary-admin" [disabled]="submitting">
                {{ submitting ? 'Guardando...' : 'Añadir sala' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mp-inline-section {
      border-top: 1px solid #F3F4F6;
      margin-top: 8px;
      padding-top: 20px;
    }
    .mp-inline-label {
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 0 12px;
    }
    .mp-pending-list {
      list-style: none;
      padding: 0;
      margin: 0 0 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .mp-pending-list__item {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 13px;
    }
    .mp-pending-list__name { font-weight: 500; color: #15803D; }
    .mp-pending-list__desc { color: #6B7280; }
    .mp-pending-list__remove {
      margin-left: auto;
      background: none;
      border: none;
      cursor: pointer;
      color: #9CA3AF;
      padding: 2px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      &:hover { color: #EF4444; }
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .mp-add-row {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    .mp-field-name { flex: 1.2; }
    .mp-field-desc { flex: 1; }
    .btn-add-mp {
      flex-shrink: 0;
      width: 42px;
      height: 42px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 4px;
      color: #374151;
      transition: border-color 0.12s, background 0.12s, color 0.12s;
      &:hover:not(:disabled) { border-color: #3B5BDB; color: #3B5BDB; background: #EEF2FF; }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
  `],
  styleUrl: './admin-venues.component.scss'
})
export class AdminVenuesComponent implements OnInit {
  venues: AdminVenue[] = [];
  cities: AdminCity[] = [];
  loading = true;
  submitting = false;
  displayedColumns = ['name', 'address', 'city', 'actions'];
  createForm!: FormGroup;
  mpNameCtrl!: import('@angular/forms').FormControl;
  mpDescCtrl!: import('@angular/forms').FormControl;
  pendingMps: PendingMeetingPoint[] = [];

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      cityId:  ['', Validators.required],
      name:    ['', [Validators.required, Validators.minLength(2)]],
      address: ['', Validators.required]
    });
    this.mpNameCtrl = this.fb.control('');
    this.mpDescCtrl = this.fb.control('');

    this.adminService.getCities().subscribe(cities => {
      this.cities = cities;
    });

    this.loadVenues();
  }

  loadVenues(): void {
    this.loading = true;
    this.adminService.getVenues().subscribe(data => {
      this.venues = data;
      this.loading = false;
    });
  }

  addPendingMp(): void {
    const name = this.mpNameCtrl.value?.trim();
    if (!name) return;
    const description = this.mpDescCtrl.value?.trim() || undefined;
    this.pendingMps = [...this.pendingMps, { name, description }];
    this.mpNameCtrl.reset('');
    this.mpDescCtrl.reset('');
  }

  removePendingMp(index: number): void {
    this.pendingMps = this.pendingMps.filter((_, i) => i !== index);
  }

  openEdit(venue: AdminVenue): void {
    const ref = this.dialog.open(VenueEditDialogComponent, {
      data: { venue },
      panelClass: 'admin-dialog-panel',
      maxWidth: '95vw'
    });
    ref.afterClosed().subscribe(updated => {
      if (updated) this.loadVenues();
    });
  }

  onAddVenue(formDir: FormGroupDirective): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.adminService.createVenue(this.createForm.value).pipe(
      switchMap(newVenue => {
        if (this.pendingMps.length === 0) return of(newVenue);
        return forkJoin(
          this.pendingMps.map(mp => this.adminService.createMeetingPoint(newVenue.id, mp))
        ).pipe(switchMap(() => of(newVenue)));
      })
    ).subscribe({
      next: () => {
        this.loadVenues();
        formDir.resetForm({ cityId: '', name: '', address: '' });
        this.pendingMps = [];
        this.mpNameCtrl.reset('');
        this.mpDescCtrl.reset('');
        this.submitting = false;
        this.snackBar.open('Sala añadida correctamente', '', { duration: 3000, panelClass: ['snack-success'] });
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message ?? 'Error al añadir la sala';
        this.snackBar.open(msg, '', { duration: 4000, panelClass: ['snack-error'] });
      }
    });
  }

  deleteVenue(id: string): void {
    this.adminService.deleteVenue(id).subscribe({
      next: () => {
        this.loadVenues();
        this.snackBar.open('Sala eliminada', '', { duration: 3000, panelClass: ['snack-success'] });
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'No se puede eliminar la sala';
        this.snackBar.open(msg, '', { duration: 4000, panelClass: ['snack-error'] });
      }
    });
  }
}
