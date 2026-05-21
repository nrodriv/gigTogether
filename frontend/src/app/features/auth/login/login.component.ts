import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { login } from '../../../store/auth/auth.actions';
import { selectAuthError, selectIsAuthenticated } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  isLoading = false;
  loginError = false;

  showError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.touched && control?.invalid);
  }

  goToRegister(): void {
    this.router.navigate(['/registro']);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.loginError = false;

    const { email, password } = this.form.value;
    this.store.dispatch(login({ email: email!, password: password! }));

    this.store.select(selectAuthError).pipe(
      filter(error => error !== null),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.isLoading = false;
      this.loginError = true;
    });

    this.store.select(selectIsAuthenticated).pipe(
      filter(isAuth => isAuth === true),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.isLoading = false;
    });
  }
}
