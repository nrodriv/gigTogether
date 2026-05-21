import { Routes } from '@angular/router';

export const GROUPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./mis-grupos/mis-grupos.component')
        .then(m => m.MisGruposComponent)
  }
];
