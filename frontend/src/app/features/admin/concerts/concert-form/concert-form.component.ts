import { Component, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService, AdminVenue, AdminCity, CreateConcertDto } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-concert-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  template: `
    <div class="admin-form-page">
      <div class="admin-form-header">
        <a routerLink="/admin/conciertos" class="admin-back-link">← Volver a conciertos</a>
        <h1 class="admin-page-title">{{ isEditMode ? 'Editar concierto' : 'Nuevo concierto' }}</h1>
      </div>

      <div class="admin-form-card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
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
              <mat-label>Sala</mat-label>
              <mat-select formControlName="venueId">
                @for (venue of filteredVenues; track venue.id) {
                  <mat-option [value]="venue.id">{{ venue.name }}</mat-option>
                }
                @if (filteredVenues.length === 0) {
                  <mat-option disabled>Selecciona primero una ciudad</mat-option>
                }
              </mat-select>
              <mat-error>Selecciona una sala</mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Nombre del artista</mat-label>
              <input matInput formControlName="artistName" placeholder="MJ Lenderman" />
              <mat-error>Mínimo 2 caracteres</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Título del concierto</mat-label>
              <input matInput formControlName="title" placeholder="Tour 2026" />
              <mat-error>Mínimo 2 caracteres</mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Género</mat-label>
              <input matInput formControlName="genre" placeholder="Indie folk" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>URL de imagen</mat-label>
              <input matInput formControlName="imageUrl" placeholder="https://..." type="url" />
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Fecha del concierto</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="date" />
              <mat-datepicker-toggle matSuffix [for]="picker" />
              <mat-datepicker #picker />
              <mat-error>Selecciona una fecha</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Hora apertura de puertas</mat-label>
              <input matInput formControlName="doorsOpenTime" placeholder="20:00" maxlength="5" />
              <mat-hint>Formato HH:MM</mat-hint>
              <mat-error>Formato HH:MM requerido</mat-error>
            </mat-form-field>
          </div>

          <div class="form-toggle-row">
            <mat-slide-toggle formControlName="isPublished" color="primary">Publicado</mat-slide-toggle>
            <span class="toggle-hint">Los conciertos publicados son visibles para todos los usuarios</span>
          </div>

          <div class="form-actions">
            <a routerLink="/admin/conciertos" class="btn-secondary-admin">Cancelar</a>
            <button type="submit" class="btn-primary-admin" [disabled]="submitting">
              {{ submitting ? 'Guardando...' : (isEditMode ? 'Guardar cambios' : 'Crear concierto') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './concert-form.component.scss'
})
export class ConcertFormComponent implements OnInit {
  form!: FormGroup;
  venues: AdminVenue[] = [];
  cities: AdminCity[] = [];
  filteredVenues: AdminVenue[] = [];
  isEditMode = false;
  concertId: string | null = null;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      cityId:        ['', Validators.required],
      venueId:       ['', Validators.required],
      artistName:    ['', [Validators.required, Validators.minLength(2)]],
      title:         ['', [Validators.required, Validators.minLength(2)]],
      genre:         [''],
      date:          [null, Validators.required],
      doorsOpenTime: ['', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
      imageUrl:      [''],
      isPublished:   [false]
    });

    this.form.get('cityId')!.valueChanges.subscribe(cityId => {
      this.filteredVenues = this.venues.filter(v => v.city.id === cityId);
      this.form.get('venueId')!.setValue('');
    });

    this.concertId = this.route.snapshot.paramMap.get('id');
    if (this.concertId) {
      this.isEditMode = true;
      forkJoin({
        cities: this.adminService.getCities(),
        venues: this.adminService.getVenues(),
        concert: this.adminService.getConcertById(this.concertId)
      }).subscribe(({ cities, venues, concert }) => {
        this.cities = cities;
        this.venues = venues;
        if (!concert) return;
        const venueCity = venues.find(v => v.id === concert.venue.id);
        if (venueCity) {
          this.filteredVenues = venues.filter(v => v.city.id === venueCity.city.id);
        }
        this.form.patchValue({
          artistName:    concert.artistName,
          title:         concert.title,
          genre:         concert.genre ?? '',
          date:          new Date(concert.date),
          doorsOpenTime: concert.doorsOpenTime,
          imageUrl:      concert.imageUrl ?? '',
          isPublished:   concert.isPublished,
          cityId:        venueCity?.city.id ?? '',
          venueId:       concert.venue.id
        }, { emitEvent: false });
      });
    } else {
      forkJoin({
        cities: this.adminService.getCities(),
        venues: this.adminService.getVenues()
      }).subscribe(({ cities, venues }) => {
        this.cities = cities;
        this.venues = venues;
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const raw = this.form.value;
    const dto: CreateConcertDto = {
      artistName:    raw.artistName,
      title:         raw.title,
      genre:         raw.genre || undefined,
      venueId:       raw.venueId,
      date:          (raw.date as Date).toISOString(),
      doorsOpenTime: raw.doorsOpenTime,
      imageUrl:      raw.imageUrl || undefined,
      isPublished:   raw.isPublished
    };

    const action$ = this.isEditMode
      ? this.adminService.updateConcert(this.concertId!, dto)
      : this.adminService.createConcert(dto);

    action$.subscribe({
      next: () => {
        this.snackBar.open('Concierto guardado correctamente', '', { duration: 3000, panelClass: ['snack-success'] });
        this.router.navigate(['/admin/conciertos']);
      },
      error: () => {
        this.submitting = false;
        this.snackBar.open('Error al guardar el concierto', '', { duration: 3000, panelClass: ['snack-error'] });
      }
    });
  }
}
