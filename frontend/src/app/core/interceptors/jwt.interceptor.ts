import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { selectToken } from '../../store/auth/auth.selectors';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api')) {
    return next(req);
  }


  const store = inject(Store);
  let token: string | null = null;
  store.select(selectToken).pipe(take(1)).subscribe(t => (token = t));


  if (!token) {
    token = localStorage.getItem('gt_token');
  }

  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
