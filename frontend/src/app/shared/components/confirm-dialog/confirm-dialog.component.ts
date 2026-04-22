import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-button [mat-dialog-close]="true" class="btn-danger">
        {{ data.confirmLabel || 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .btn-danger { background: #DC2626; color: #FFFFFF; border-radius: 6px; }
  `]
})
export class ConfirmDialogComponent {
  data = inject(MAT_DIALOG_DATA) as { title: string; message: string; confirmLabel?: string };
}
