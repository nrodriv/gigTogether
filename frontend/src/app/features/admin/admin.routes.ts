import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-layout/admin-layout.component')
        .then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard/admin-dashboard.component')
            .then(m => m.AdminDashboardComponent)
      },
      {
        path: 'conciertos',
        loadComponent: () =>
          import('./concerts/admin-concerts.component')
            .then(m => m.AdminConcertsComponent)
      },
      {
        path: 'conciertos/nuevo',
        loadComponent: () =>
          import('./concerts/concert-form/concert-form.component')
            .then(m => m.ConcertFormComponent)
      },
      {
        path: 'conciertos/:id/editar',
        loadComponent: () =>
          import('./concerts/concert-form/concert-form.component')
            .then(m => m.ConcertFormComponent)
      },
      {
        path: 'ciudades',
        loadComponent: () =>
          import('./cities/admin-cities.component')
            .then(m => m.AdminCitiesComponent)
      },
      {
        path: 'salas',
        loadComponent: () =>
          import('./venues/admin-venues.component')
            .then(m => m.AdminVenuesComponent)
      },
      {
        path: 'grupos',
        loadComponent: () =>
          import('./groups/admin-groups.component')
            .then(m => m.AdminGroupsComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./users/admin-users.component')
            .then(m => m.AdminUsersComponent)
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./reports/admin-reports.component')
            .then(m => m.AdminReportsComponent)
      }
    ]
  }
];
