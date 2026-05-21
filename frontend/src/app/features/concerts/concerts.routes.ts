import { Routes } from '@angular/router';

export const CONCERTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./concerts-list/concerts-list.component')
        .then(m => m.ConcertsListComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./concert-detail/concert-detail.component')
        .then(m => m.ConcertDetailComponent)
  }
];
