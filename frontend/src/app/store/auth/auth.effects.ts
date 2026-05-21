import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          switchMap(({ accessToken }) =>
            this.authService.getProfile(accessToken).pipe(
              map(user => AuthActions.loginSuccess({ user, token: accessToken, shouldNavigate: true })),
              catchError(() => of(AuthActions.loginFailure({ error: 'Error al obtener perfil' })))
            )
          ),
          catchError(() => of(AuthActions.loginFailure({ error: 'Credenciales incorrectas' })))
        )
      )
    )
  );

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(({ user, token, shouldNavigate }) => {
        localStorage.setItem('gt_token', token);
        if (shouldNavigate) {
          const destination = user.role === 'ADMIN' ? '/admin' : '/inicio';
          this.router.navigate([destination]);
        }
      })
    ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        localStorage.removeItem('gt_token');
        this.router.navigate(['/login']);
      })
    ),
    { dispatch: false }
  );

  loadUserFromStorage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUserFromStorage),
      switchMap(() => {
        const token = localStorage.getItem('gt_token');
        if (!token) return of(AuthActions.logout());
        return this.authService.getProfile(token).pipe(
          map(user => AuthActions.loginSuccess({ user, token, shouldNavigate: false })),
          catchError(() => of(AuthActions.logout()))
        );
      })
    )
  );
}
