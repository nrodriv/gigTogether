import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { selectIsAuthenticated } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-bottom-tab-bar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './bottom-tab-bar.component.html',
  styleUrl: './bottom-tab-bar.component.scss'
})
export class BottomTabBarComponent {
  private store = inject(Store);
  private router = inject(Router);

  isAuthenticated$ = this.store.select(selectIsAuthenticated);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  isAuthRoute = computed(() => {
    const url = this.currentUrl();
    return url.startsWith('/login') || url.startsWith('/registro');
  });
}
