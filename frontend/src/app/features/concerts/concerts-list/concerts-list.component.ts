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
    const season = this.seasonLabel;
    return season ? `${cityPart} · ${season}` : cityPart;
  }

  private get seasonLabel(): string {
    const first = this.filteredConcerts[0] ?? this.allConcerts[0];
    if (!first) return '';
    const d = new Date(first.date);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getFullYear();
    if ((m === 3 && day >= 20) || m === 4 || m === 5 || (m === 6 && day < 21)) return `Primavera ${year}`;
    if ((m === 6 && day >= 21) || m === 7 || m === 8 || (m === 9 && day < 23)) return `Verano ${year}`;
    if ((m === 9 && day >= 23) || m === 10 || m === 11 || (m === 12 && day < 21)) return `Otoño ${year}`;
    return `Invierno ${year}`;
  }

  ngOnInit(): void {
    this.breakpointObserver.observe('(max-width: 767px)').subscribe(state => {
      this.isMobile = state.matches;
    });

    this.concertsService.getCities().subscribe({ next: cities => { this.cities = cities; this.citiesLoading = false; }, error: () => { this.citiesLoading = false; } });

    this.loadConcerts(null);
  }

  private loadConcerts(city: City | null): void {
    this.isLoading = true;
    this.concertsService.getAll(city?.id, undefined, 100).subscribe({
      next: concerts => {
        this.allConcerts = concerts;
        this.genres = ['Todos', ...Array.from(new Set(
          concerts.filter(c => c.genre).map(c => c.genre!)
        ))];
        this.isLoading = false;
        this.applyFilters();
      },
      error: () => { this.isLoading = false; }
    });
  }

  onCityChange(city: City | null): void {
    this.selectedCity = city;
    this.activeGenre = 'Todos';
    this.loadConcerts(city);
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
      const matchesSearch = !this.searchQuery ||
        c.artistName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.venue?.name?.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesGenre = this.activeGenre === 'Todos' ||
        c.genre?.toLowerCase() === this.activeGenre.toLowerCase();
      return matchesSearch && matchesGenre;
    });
  }
}
