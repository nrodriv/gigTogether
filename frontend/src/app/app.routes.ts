import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { userOnlyGuard } from './core/guards/user-only.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/conciertos', pathMatch: 'full' },
  {
    path: 'conciertos',
    canActivate: [userOnlyGuard],
    loadChildren: () => import('./features/concerts/concerts.routes').then(m => m.CONCERTS_ROUTES)
  },
  {
    path: 'inicio',
    canActivate: [authGuard, userOnlyGuard],
    loadChildren: () => import('./features/home/home.routes').then(m => m.HOME_ROUTES)
  },
  {
    path: 'mis-grupos',
    canActivate: [authGuard, userOnlyGuard],
    loadChildren: () => import('./features/groups/groups.routes').then(m => m.GROUPS_ROUTES)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'mi-perfil',
    canActivate: [authGuard],
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES)
  },
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  { path: '**', redirectTo: '/conciertos' }
];
