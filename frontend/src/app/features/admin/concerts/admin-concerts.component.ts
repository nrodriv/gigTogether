import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService, AdminConcert } from '../../../core/services/admin.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ConcertPreviewDialogComponent } from './concert-preview-dialog/concert-preview-dialog.component';

@Component({
  selector: 'app-admin-concerts',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="admin-concerts">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Conciertos</h1>
        <a routerLink="/admin/conciertos/nuevo" class="btn-primary-admin">
          + Nuevo concierto
        </a>
      </div>

      @if (loading) {
        <p class="admin-loading">Cargando conciertos...</p>
      } @else {
        <div class="admin-table-wrapper">
          <table mat-table [dataSource]="concerts" class="admin-mat-table">

            <ng-container matColumnDef="artist">
              <th mat-header-cell *matHeaderCellDef>Artista / Título</th>
              <td mat-cell *matCellDef="let c">
                <div class="cell-artist">
                  <span class="cell-artist__name">{{ c.artistName }}</span>
                  <span class="cell-artist__title">{{ c.title }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="venue">
              <th mat-header-cell *matHeaderCellDef>Sala</th>
              <td mat-cell *matCellDef="let c">{{ c.venue.name }}</td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let c">{{ c.date | date:'dd/MM/yyyy':'':'es-ES' }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let c">
                <span class="status-chip"
                      [class.status-chip--published]="c.isPublished"
                      [class.status-chip--draft]="!c.isPublished">
                  {{ c.isPublished ? 'Publicado' : 'Borrador' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let c">
                <div class="cell-actions">
                  <button class="action-btn action-btn--preview"
                          matTooltip="Vista previa"
                          (click)="openPreview(c)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <a [routerLink]="['/admin/conciertos', c.id, 'editar']"
                     class="action-btn action-btn--edit"
                     matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </a>
                  <button class="action-btn action-btn--publish"
                          [matTooltip]="c.isPublished ? 'Despublicar' : 'Publicar'"
                          (click)="togglePublish(c)">
                    <mat-icon>{{ c.isPublished ? 'lock' : 'rocket_launch' }}</mat-icon>
                  </button>
                  <button class="action-btn action-btn--delete"
                          matTooltip="Eliminar"
                          (click)="openDeleteDialog(c)">
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
    </div>
  `,
  styles: [`
    .action-btn--preview:hover { background: #F0FDF4; color: #16A34A; }
  `],
  styleUrl: './admin-concerts.component.scss'
})
export class AdminConcertsComponent implements OnInit {
  concerts: AdminConcert[] = [];
  loading = true;
  displayedColumns = ['artist', 'venue', 'date', 'status', 'actions'];

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadConcerts();
  }

  loadConcerts(): void {
    this.loading = true;
    this.adminService.getConcerts().subscribe(data => {
      this.concerts = data;
      this.loading = false;
    });
  }

  openPreview(concert: AdminConcert): void {
    forkJoin({
      full: this.adminService.getConcertById(concert.id),
      meetingPoints: this.adminService.getMeetingPoints(concert.venue.id)
    }).subscribe({
      next: ({ full, meetingPoints }) => {
        this.dialog.open(ConcertPreviewDialogComponent, {
          data: { concert: full ?? concert, meetingPoints },
          panelClass: 'admin-dialog-panel',
          maxWidth: '95vw'
        });
      },
      error: () => {
        this.snackBar.open('Error al cargar la vista previa', '', { duration: 3000, panelClass: ['snack-error'] });
      }
    });
  }

  togglePublish(concert: AdminConcert): void {
    const action$ = concert.isPublished
      ? this.adminService.unpublishConcert(concert.id)
      : this.adminService.publishConcert(concert.id);
    const msg = concert.isPublished ? 'Concierto despublicado' : 'Concierto publicado';

    action$.subscribe(() => {
      this.loadConcerts();
      this.snackBar.open(msg, '', { duration: 3000, panelClass: ['snack-success'] });
    });
  }

  openDeleteDialog(concert: AdminConcert): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      panelClass: 'admin-dialog-panel',
      data: {
        title: '¿Eliminar concierto?',
        message: `¿Estás seguro de que quieres eliminar el concierto de ${concert.artistName}? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.adminService.deleteConcert(concert.id).subscribe({
          next: () => {
            this.loadConcerts();
            this.snackBar.open('Concierto eliminado', '', { duration: 3000, panelClass: ['snack-success'] });
          },
          error: (err) => {
            const msg = err?.error?.message ?? 'No se puede eliminar el concierto';
            this.snackBar.open(msg, '', { duration: 4000, panelClass: ['snack-error'] });
          }
        });
      }
    });
  }
}
