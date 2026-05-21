import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

const passwordMatchValidator = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password !== confirmPassword ? { passwordMismatch: true } : null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatSnackBarModule, MatProgressSpinnerModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  form = this.fb.group({
    alias: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)
    ]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatchValidator });

  isLoading = false;
  registerError = '';

  showError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.touched && control?.invalid);
  }

  showPasswordMismatch(): boolean {
    const control = this.form.get('confirmPassword');
    return !!(control?.touched && this.form.hasError('passwordMismatch'));
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.registerError = '';

    const { alias, email, password } = this.form.value;

    this.authService.register(alias!, email!, password!).subscribe({
      next: () => {
        this.snackBar.open('¡Cuenta creada! Ya puedes iniciar sesión', '', {
          duration: 3000,
          panelClass: ['snack-success']
        });
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        if (err?.status === 409 || err?.message?.includes('409')) {
          this.registerError = 'Este email ya está registrado';
        } else {
          this.registerError = 'Ha ocurrido un error. Inténtalo de nuevo.';
        }
      }
    });
  }
}
