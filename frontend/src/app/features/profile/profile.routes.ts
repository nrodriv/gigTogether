import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile-shell/profile-shell.component').then(m => m.ProfileShellComponent),
    children: [
      { path: '', redirectTo: 'perfil', pathMatch: 'full' },
      {
        path: 'perfil',
        loadComponent: () => import('./public-profile/public-profile.component').then(m => m.PublicProfileComponent)
      },
      {
        path: 'cuenta',
        loadComponent: () => import('./cuenta/cuenta.component').then(m => m.CuentaComponent)
      }
    ]
  }
];
