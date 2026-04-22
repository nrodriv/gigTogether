import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProfileService } from '../../../core/services/profile.service';
import { logout, updateUser } from '../../../store/auth/auth.actions';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { take } from 'rxjs/operators';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const newPwd = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  if (newPwd && confirm && newPwd !== confirm) {
    return { passwordsMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-cuenta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './cuenta.component.html',
  styleUrl: './cuenta.component.scss'
})
export class CuentaComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private profileService = inject(ProfileService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  currentEmail = signal('');
  currentAlias = signal('');
  savingEmail = signal(false);
  savingPassword = signal(false);
  deletingAccount = signal(false);
  showDeleteConfirm = signal(false);

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordsMatch });

  constructor() {
    this.store.select(selectCurrentUser).pipe(take(1)).subscribe(user => {
      if (user) {
        this.currentEmail.set(user.email);
        this.currentAlias.set(user.alias);
        this.emailForm.patchValue({ email: user.email });
      }
    });
  }

  showError(form: any, field: string): boolean {
    const control = form.get(field);
    return !!(control?.touched && control?.invalid);
  }

  onSaveEmail(): void {
    if (this.emailForm.invalid || this.savingEmail()) return;
    this.savingEmail.set(true);

    const { email } = this.emailForm.value;
    this.profileService.updateAccount({ email: email! }).subscribe({
      next: (updated) => {
        this.store.dispatch(updateUser({ user: updated }));
        this.currentEmail.set(email!);
        this.savingEmail.set(false);
        this.snackBar.open('Email actualizado correctamente', 'Cerrar', { duration: 3000, panelClass: 'snack-success' });
      },
      error: (err) => {
        this.savingEmail.set(false);
        const msg = err?.error?.message ?? 'Error al actualizar el email';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: 'snack-error' });
      }
    });
  }

  onSavePassword(): void {
    if (this.passwordForm.invalid || this.savingPassword()) return;
    this.savingPassword.set(true);

    const { currentPassword, newPassword } = this.passwordForm.value;
    this.profileService.updateAccount({ currentPassword: currentPassword!, newPassword: newPassword! }).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordForm.reset();
        this.snackBar.open('Contraseña actualizada correctamente', 'Cerrar', { duration: 3000, panelClass: 'snack-success' });
      },
      error: (err) => {
        this.savingPassword.set(false);
        const msg = err?.error?.message ?? 'Error al cambiar la contraseña';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: 'snack-error' });
      }
    });
  }

  onDeleteAccount(): void {
    if (this.deletingAccount()) return;
    this.deletingAccount.set(true);

    this.profileService.deleteAccount().subscribe({
      next: () => {
        this.store.dispatch(logout());
        this.router.navigate(['/login']);
      },
      error: () => {
        this.deletingAccount.set(false);
        this.snackBar.open('Error al eliminar la cuenta', 'Cerrar', { duration: 4000, panelClass: 'snack-error' });
      }
    });
  }
}
