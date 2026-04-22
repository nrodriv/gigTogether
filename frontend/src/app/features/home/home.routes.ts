import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const HOME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard]
  }
];
