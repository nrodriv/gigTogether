import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, AsyncPipe, SlicePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConcertsService } from '../../../core/services/concerts.service';
import { City, Concert } from '../../../core/models';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { ConcertCardComponent } from '../../../shared/components/concert-card/concert-card.component';
import { CitySelectComponent } from '../../../shared/components/city-select/city-select.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    SlicePipe,
    MatProgressSpinnerModule,
    RouterModule,
    ConcertCardComponent,
    CitySelectComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private store = inject(Store);
  private concertsService = inject(ConcertsService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  currentUser$ = this.store.select(selectCurrentUser);
  concerts$: Observable<Concert[]> = this.concertsService.getHomeConciertos().pipe(
    catchError(() => of([]))
  );

  cities: City[] = [];
  citiesLoading = true;
  selectedCity = signal<City | null>(null);

  ngOnInit(): void {
    this.concertsService.getCities()
      .pipe(takeUntilDestroyed(this.destroyRef), catchError(() => of([])))
      .subscribe(cities => { this.cities = cities; this.citiesLoading = false; });
  }

  onCityChange(city: City | null): void {
    this.selectedCity.set(city);
    this.concerts$ = (city
      ? this.concertsService.getAll(city.id, undefined, 5)
      : this.concertsService.getHomeConciertos()
    ).pipe(catchError(() => of([])));
  }

  goToAllConcerts(): void {
    this.router.navigate(['/conciertos']);
  }
}
