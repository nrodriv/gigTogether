import { Component, Inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormGroupDirective } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import {
  AdminService, AdminVenue, AdminCity, AdminMeetingPoint
} from '../../../../core/services/admin.service';

export interface VenueEditDialogData {
  venue: AdminVenue;
}

@Component({
  selector: 'app-venue-edit-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="venue-dialog">
      <div class="venue-dialog__header">
        <h2 class="venue-dialog__title">Editar sala</h2>
        <button mat-icon-button mat-dialog-close class="venue-dialog__close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="venue-dialog__body">
        <section class="venue-dialog__section">
          <h3 class="venue-dialog__section-title">Datos de la sala</h3>
          <form [formGroup]="form" (ngSubmit)="saveVenue()">
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
                <input matInput formControlName="name" />
                <mat-error>Mínimo 2 caracteres</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row form-row--single">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Dirección</mat-label>
                <input matInput formControlName="address" />
                <mat-error>Introduce la dirección</mat-error>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary-admin" [disabled]="saving">
                {{ saving ? 'Guardando...' : 'Guardar cambios' }}
              </button>
            </div>
          </form>
        </section>

        <section class="venue-dialog__section">
          <h3 class="venue-dialog__section-title">Puntos de encuentro</h3>
          <p class="venue-dialog__hint">Los usuarios elegirán uno de estos puntos para quedar antes del concierto.</p>

          @if (mpLoading) {
            <p class="dialog-loading">Cargando...</p>
          } @else {
            @if (meetingPoints.length === 0) {
              <p class="dialog-empty">Esta sala no tiene puntos de encuentro todavía.</p>
            } @else {
              <ul class="mp-list">
                @for (mp of meetingPoints; track mp.id) {
                  <li class="mp-list__item">
                    <div class="mp-list__info">
                      <span class="mp-list__name">{{ mp.name }}</span>
                      @if (mp.description) {
                        <span class="mp-list__desc">{{ mp.description }}</span>
                      }
                    </div>
                    <button class="action-btn action-btn--delete"
                            type="button"
                            (click)="deleteMeetingPoint(mp)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </li>
                }
              </ul>
            }

            <div class="mp-add-card">
              <h4 class="mp-add-title">Añadir punto de encuentro</h4>
              <form [formGroup]="mpForm" #mpFormDir="ngForm" (ngSubmit)="addMeetingPoint(mpFormDir)">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Nombre del punto</mat-label>
                    <input matInput formControlName="name" placeholder="Puerta principal" />
                    <mat-error>Mínimo 2 caracteres</mat-error>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Descripción (opcional)</mat-label>
                    <input matInput formControlName="description" placeholder="Al lado de la taquilla" />
                  </mat-form-field>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn-primary-admin" [disabled]="mpSaving">
                    {{ mpSaving ? 'Añadiendo...' : 'Añadir punto' }}
                  </button>
                </div>
              </form>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .venue-dialog {
      width: min(680px, 100%);
      font-family: 'Inter', sans-serif;
    }
    @media (max-width: 767px) {
      .form-row { grid-template-columns: 1fr !important; }
      .venue-dialog__body { padding: 16px; }
    }
    .venue-dialog__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #E5E7EB;
    }
    .venue-dialog__title { font-size: 18px; font-weight: 700; color: #111827; margin: 0; }
    .venue-dialog__close { color: #6B7280; }
    .venue-dialog__body { padding: 24px; display: flex; flex-direction: column; gap: 32px; }
    .venue-dialog__section-title { font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.04em; }
    .venue-dialog__hint { font-size: 13px; color: #6B7280; margin: -8px 0 16px; }
    .dialog-loading, .dialog-empty { font-size: 13px; color: #6B7280; }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 8px;
    }
    .form-row--single { grid-template-columns: 1fr; }
    .form-field { width: 100%; }
    .form-actions { display: flex; justify-content: flex-end; margin-top: 16px; padding-top: 16px; border-top: 1px solid #F3F4F6; }
    .mp-list { list-style: none; padding: 0; margin: 0 0 16px; border: 1px solid #E5E7EB; border-radius: 10px; overflow: hidden; }
    .mp-list__item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #F3F4F6; &:last-child { border-bottom: none; } }
    .mp-list__info { display: flex; flex-direction: column; gap: 2px; }
    .mp-list__name { font-size: 14px; font-weight: 500; color: #111827; }
    .mp-list__desc { font-size: 12px; color: #9CA3AF; }
    .mp-add-card { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 20px; }
    .mp-add-title { font-size: 13px; font-weight: 600; color: #374151; margin: 0 0 16px; }
    .action-btn {
      background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px;
      transition: background 0.12s, color 0.12s; color: #6B7280; display: inline-flex; align-items: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &--delete:hover { background: #FEE2E2; color: #DC2626; }
    }
    .btn-primary-admin {
      padding: 10px 20px; background: #3B5BDB; color: #fff; border: none; border-radius: 8px;
      font-size: 14px; font-weight: 500; font-family: 'Inter', sans-serif; cursor: pointer;
      &:hover:not(:disabled) { background: #2F4AC4; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  `]
})
export class VenueEditDialogComponent implements OnInit {
  form!: FormGroup;
  mpForm!: FormGroup;
  cities: AdminCity[] = [];
  meetingPoints: AdminMeetingPoint[] = [];
  saving = false;
  mpLoading = false;
  mpSaving = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<VenueEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VenueEditDialogData
  ) {}

  ngOnInit(): void {
    const v = this.data.venue;
    this.form = this.fb.group({
      cityId:  [v.city.id, Validators.required],
      name:    [v.name, [Validators.required, Validators.minLength(2)]],
      address: [v.address, Validators.required]
    });

    this.mpForm = this.fb.group({
      name:        ['', [Validators.required, Validators.minLength(2)]],
      description: ['']
    });

    forkJoin({
      cities: this.adminService.getCities(),
      mps:    this.adminService.getMeetingPoints(v.id)
    }).subscribe(({ cities, mps }) => {
      this.cities = cities;
      this.meetingPoints = mps;
    });
  }

  saveVenue(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.adminService.updateVenue(this.data.venue.id, this.form.value).subscribe({
      next: (updated) => {
        this.saving = false;
        this.snackBar.open('Sala actualizada', '', { duration: 3000, panelClass: ['snack-success'] });
        this.dialogRef.close(updated);
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.message ?? 'Error al guardar la sala';
        this.snackBar.open(msg, '', { duration: 4000, panelClass: ['snack-error'] });
      }
    });
  }

  addMeetingPoint(mpFormDir: FormGroupDirective): void {
    if (this.mpForm.invalid) { this.mpForm.markAllAsTouched(); return; }
    this.mpSaving = true;
    const { name, description } = this.mpForm.value;
    const dto = description ? { name, description } : { name };
    this.adminService.createMeetingPoint(this.data.venue.id, dto).subscribe({
      next: (mp) => {
        this.meetingPoints = [...this.meetingPoints, mp];
        mpFormDir.resetForm({ name: '', description: '' });
        this.mpSaving = false;
        this.snackBar.open('Punto de encuentro añadido', '', { duration: 3000, panelClass: ['snack-success'] });
      },
      error: () => {
        this.mpSaving = false;
        this.snackBar.open('Error al añadir el punto', '', { duration: 3000, panelClass: ['snack-error'] });
      }
    });
  }

  deleteMeetingPoint(mp: AdminMeetingPoint): void {
    this.adminService.deleteMeetingPoint(mp.id).subscribe({
      next: () => {
        this.meetingPoints = this.meetingPoints.filter(m => m.id !== mp.id);
        this.snackBar.open('Punto eliminado', '', { duration: 3000, panelClass: ['snack-success'] });
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'No se puede eliminar este punto';
        this.snackBar.open(msg, '', { duration: 4000, panelClass: ['snack-error'] });
      }
    });
  }
}
