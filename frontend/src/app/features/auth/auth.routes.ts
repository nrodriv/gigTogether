import { Routes } from '@angular/router';
import { publicGuard } from '../../core/guards/public.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
    canActivate: [publicGuard]
  },
  {
    path: 'registro',
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent),
    canActivate: [publicGuard]
  }
];
