import { Component, OnInit, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormGroupDirective } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService, AdminCity } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-cities',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="admin-cities">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Ciudades</h1>
      </div>

      @if (loading) {
        <p class="admin-loading">Cargando ciudades...</p>
      } @else {
        <div class="admin-table-wrapper">
          <table mat-table [dataSource]="cities" class="admin-mat-table">

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let c">{{ c.name }}</td>
            </ng-container>

            <ng-container matColumnDef="venues">
              <th mat-header-cell *matHeaderCellDef>Salas</th>
              <td mat-cell *matCellDef="let c">{{ c._count?.venues ?? 0 }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let c">
                <div class="cell-actions">
                  <button class="action-btn action-btn--delete"
                          matTooltip="Eliminar"
                          (click)="deleteCity(c.id)">
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

      <div class="add-city-section">
        <h2 class="admin-section-title">Añadir nueva ciudad</h2>
        <div class="admin-form-card">
          <form [formGroup]="createForm" #formDir="ngForm" (ngSubmit)="onAddCity(formDir)">
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Nombre de la ciudad</mat-label>
                <input matInput formControlName="name" placeholder="Sevilla" (input)="onNameInput()" />
                <mat-error>Mínimo 2 caracteres</mat-error>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary-admin" [disabled]="submitting">
                {{ submitting ? 'Añadiendo...' : 'Añadir ciudad' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrl: './admin-cities.component.scss'
})
export class AdminCitiesComponent implements OnInit {
  cities: AdminCity[] = [];
  loading = true;
  submitting = false;
  displayedColumns = ['name', 'venues', 'actions'];
  createForm!: FormGroup;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      slug: ['', [Validators.required, Validators.minLength(2)]]
    });
    this.loadCities();
  }

  onNameInput(): void {
    const name: string = this.createForm.get('name')!.value ?? '';
    const slug = name.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    this.createForm.get('slug')!.setValue(slug, { emitEvent: false });
  }

  loadCities(): void {
    this.loading = true;
    this.adminService.getCities().subscribe(data => {
      this.cities = data;
      this.loading = false;
    });
  }

  onAddCity(formDir: FormGroupDirective): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.adminService.createCity(this.createForm.value).subscribe({
      next: () => {
        this.loadCities();
        formDir.resetForm({ name: '', slug: '' });
        this.submitting = false;
        this.snackBar.open('Ciudad añadida correctamente', '', { duration: 3000, panelClass: ['snack-success'] });
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message ?? 'Error al añadir la ciudad';
        this.snackBar.open(msg, '', { duration: 4000, panelClass: ['snack-error'] });
      }
    });
  }

  deleteCity(id: string): void {
    this.adminService.deleteCity(id).subscribe({
      next: () => {
        this.loadCities();
        this.snackBar.open('Ciudad eliminada', '', { duration: 3000, panelClass: ['snack-success'] });
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'No se puede eliminar la ciudad';
        this.snackBar.open(msg, '', { duration: 4000, panelClass: ['snack-error'] });
      }
    });
  }
}
