import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, take } from 'rxjs/operators';
import { selectAuthState } from '../../store/auth/auth.selectors';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);
  return store.select(selectAuthState).pipe(
    filter(state => state.initialized),
    take(1),
    map(state => {
      if (state.token) return true;
      router.navigate(['/login']);
      return false;
    })
  );
};
