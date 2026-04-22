import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ConcertsService } from '../../../core/services/concerts.service';
import { City, Concert } from '../../../core/models';
import { ConcertCardComponent } from '../../../shared/components/concert-card/concert-card.component';
import { CitySelectComponent } from '../../../shared/components/city-select/city-select.component';

@Component({
  selector: 'app-concerts-list',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, ConcertCardComponent, CitySelectComponent],
  templateUrl: './concerts-list.component.html',
  styleUrl: './concerts-list.component.scss'
})
export class ConcertsListComponent implements OnInit {
  private concertsService = inject(ConcertsService);
  private breakpointObserver = inject(BreakpointObserver);

  allConcerts: Concert[] = [];
  filteredConcerts: Concert[] = [];
  cities: City[] = [];
  citiesLoading = true;
  selectedCity: City | null = null;
  searchQuery = '';
  activeGenre = 'Todos';
  genres: string[] = ['Todos'];
  isLoading = true;
  isMobile = false;

  get subtitleText(): string {
    const cityPart = this.selectedCity?.name ?? 'Todas las ciudades';
    return `${cityPart} · Primavera 2026`;
  }

  ngOnInit(): void {
    this.breakpointObserver.observe('(max-width: 767px)').subscribe(state => {
      this.isMobile = state.matches;
    });

    this.concertsService.getCities().subscribe({ next: cities => { this.cities = cities; this.citiesLoading = false; }, error: () => { this.citiesLoading = false; } });

    this.concertsService.getAll().subscribe({
      next: concerts => {
        this.allConcerts = concerts;
        this.filteredConcerts = concerts;
        this.genres = ['Todos', ...Array.from(new Set(
          concerts.filter(c => c.genre).map(c => c.genre!)
        ))];
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onCityChange(city: City | null): void {
    this.selectedCity = city;
    this.applyFilters();
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  onGenreFilter(genre: string): void {
    this.activeGenre = genre;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredConcerts = this.allConcerts.filter(c => {
      const matchesCity = !this.selectedCity || c.venue?.city?.id === this.selectedCity.id;
      const matchesSearch = !this.searchQuery ||
        c.artistName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.venue?.name?.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesGenre = this.activeGenre === 'Todos' ||
        c.genre?.toLowerCase() === this.activeGenre.toLowerCase();
      return matchesCity && matchesSearch && matchesGenre;
    });
  }
}
