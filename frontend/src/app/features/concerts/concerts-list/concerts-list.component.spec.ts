import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { ConcertsListComponent } from './concerts-list.component';
import { ConcertsService } from '../../../core/services/concerts.service';
import { Concert, City } from '../../../core/models';

const ciudadBase = { id: 'city-1', name: 'Barcelona', slug: 'barcelona' };
const venueBase = { id: 'v-1', name: 'Sala Apolo', address: 'Calle test', city: ciudadBase };

const makeConcert = (overrides: Partial<Concert> = {}): Concert => ({
  id: 'concert-1',
  title: 'Concierto de prueba',
  artistName: 'Artista A',
  imageUrl: null,
  date: '2025-07-15',
  doorsOpenTime: '21:00',
  genre: 'Rock',
  isPublished: true,
  myGroup: null,
  isBanned: false,
  isPast: false,
  venue: venueBase,
  ...overrides,
} as Concert);

const ciudadZamora: City = { id: 'city-zamora', name: 'Zamora', slug: 'zamora' };

describe('ConcertsListComponent - filtrado y búsqueda de conciertos', () => {
  let component: ConcertsListComponent;
  let fixture: ComponentFixture<ConcertsListComponent>;
  let mockConcertsService: jasmine.SpyObj<ConcertsService>;
  let mockBreakpointObserver: jasmine.SpyObj<BreakpointObserver>;

  beforeEach(async () => {
    mockConcertsService = jasmine.createSpyObj('ConcertsService', ['getAll', 'getCities']);
    mockBreakpointObserver = jasmine.createSpyObj('BreakpointObserver', ['observe']);

    mockConcertsService.getAll.and.returnValue(of([]));
    mockConcertsService.getCities.and.returnValue(of([]));
    mockBreakpointObserver.observe.and.returnValue(of({ matches: false, breakpoints: {} }));

    await TestBed.configureTestingModule({
      imports: [ConcertsListComponent, NoopAnimationsModule],
      providers: [
        { provide: ConcertsService, useValue: mockConcertsService },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
      ],
    })
    .overrideComponent(ConcertsListComponent, {
      set: { imports: [CommonModule, MatProgressSpinnerModule], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConcertsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea el componente correctamente', () => {
    expect(component).toBeTruthy();
  });

  describe('applyFilters', () => {
    it('muestra todos los conciertos cuando no hay filtros activos', () => {
      component.allConcerts = [
        makeConcert({ id: 'c-1', artistName: 'Interpol' }),
        makeConcert({ id: 'c-2', artistName: 'Radiohead' }),
      ];

      component.applyFilters();

      expect(component.filteredConcerts.length).toBe(2);
    });

    it('filtra conciertos por nombre del artista cuando hay una búsqueda activa', () => {
      component.allConcerts = [
        makeConcert({ id: 'c-1', artistName: 'Interpol' }),
        makeConcert({ id: 'c-2', artistName: 'Radiohead' }),
      ];
      component.searchQuery = 'inter';

      component.applyFilters();

      expect(component.filteredConcerts.length).toBe(1);
      expect(component.filteredConcerts[0].artistName).toBe('Interpol');
    });

    it('filtra conciertos por nombre de sala cuando la búsqueda coincide con la venue', () => {
      component.allConcerts = [
        makeConcert({ id: 'c-1', venue: { ...venueBase, id: 'v-1', name: 'Sala Apolo' } }),
        makeConcert({ id: 'c-2', venue: { ...venueBase, id: 'v-2', name: 'Palau Sant Jordi' } }),
      ];
      component.searchQuery = 'apolo';

      component.applyFilters();

      expect(component.filteredConcerts.length).toBe(1);
      expect(component.filteredConcerts[0].venue.name).toBe('Sala Apolo');
    });

    it('la búsqueda no distingue entre mayúsculas y minúsculas', () => {
      component.allConcerts = [
        makeConcert({ artistName: 'INTERPOL' }),
        makeConcert({ id: 'c-2', artistName: 'Radiohead' }),
      ];
      component.searchQuery = 'interpol';

      component.applyFilters();

      expect(component.filteredConcerts.length).toBe(1);
    });

    it('filtra por género cuando hay un género activo distinto de "Todos"', () => {
      component.allConcerts = [
        makeConcert({ id: 'c-1', genre: 'Rock' }),
        makeConcert({ id: 'c-2', genre: 'Jazz' }),
        makeConcert({ id: 'c-3', genre: 'Rock' }),
      ];
      component.activeGenre = 'Jazz';

      component.applyFilters();

      expect(component.filteredConcerts.length).toBe(1);
      expect(component.filteredConcerts[0].genre).toBe('Jazz');
    });

    it('muestra todos los géneros cuando el filtro activo es "Todos"', () => {
      component.allConcerts = [
        makeConcert({ id: 'c-1', genre: 'Rock' }),
        makeConcert({ id: 'c-2', genre: 'Jazz' }),
      ];
      component.activeGenre = 'Todos';

      component.applyFilters();

      expect(component.filteredConcerts.length).toBe(2);
    });

    it('combina búsqueda por texto y filtro por género correctamente', () => {
      component.allConcerts = [
        makeConcert({ id: 'c-1', artistName: 'Interpol', genre: 'Rock' }),
        makeConcert({ id: 'c-2', artistName: 'Interpol', genre: 'Jazz' }),
        makeConcert({ id: 'c-3', artistName: 'Radiohead', genre: 'Rock' }),
      ];
      component.searchQuery = 'interpol';
      component.activeGenre = 'Rock';

      component.applyFilters();

      expect(component.filteredConcerts.length).toBe(1);
      expect(component.filteredConcerts[0].id).toBe('c-1');
    });

    it('devuelve lista vacía si ningún concierto coincide con los filtros aplicados', () => {
      component.allConcerts = [
        makeConcert({ artistName: 'Interpol', genre: 'Rock' }),
      ];
      component.searchQuery = 'radiohead';

      component.applyFilters();

      expect(component.filteredConcerts.length).toBe(0);
    });
  });

  describe('onCityChange', () => {
    it('lanza una nueva petición al servicio con la ciudad seleccionada', () => {
      mockConcertsService.getAll.and.returnValue(of([]));

      component.onCityChange(ciudadZamora);

      expect(mockConcertsService.getAll).toHaveBeenCalledWith(
        ciudadZamora.id, undefined, 100
      );
    });

    it('resetea el filtro de género a "Todos" al cambiar de ciudad', () => {
      component.activeGenre = 'Jazz';
      mockConcertsService.getAll.and.returnValue(of([]));

      component.onCityChange(ciudadZamora);

      expect(component.activeGenre).toBe('Todos');
    });

    it('actualiza la ciudad seleccionada en el componente', () => {
      mockConcertsService.getAll.and.returnValue(of([]));

      component.onCityChange(ciudadZamora);

      expect(component.selectedCity).toBe(ciudadZamora);
    });

    it('acepta null para mostrar conciertos de todas las ciudades', () => {
      mockConcertsService.getAll.and.returnValue(of([]));

      component.onCityChange(null);

      expect(mockConcertsService.getAll).toHaveBeenCalledWith(undefined, undefined, 100);
      expect(component.selectedCity).toBeNull();
    });
  });

  describe('onSearch', () => {
    it('actualiza la consulta de búsqueda y aplica los filtros', () => {
      component.allConcerts = [
        makeConcert({ artistName: 'Interpol' }),
        makeConcert({ id: 'c-2', artistName: 'Radiohead' }),
      ];

      component.onSearch('radio');

      expect(component.searchQuery).toBe('radio');
      expect(component.filteredConcerts.length).toBe(1);
    });
  });

  describe('onGenreFilter', () => {
    it('actualiza el género activo y aplica los filtros', () => {
      component.allConcerts = [
        makeConcert({ id: 'c-1', genre: 'Rock' }),
        makeConcert({ id: 'c-2', genre: 'Jazz' }),
      ];

      component.onGenreFilter('Jazz');

      expect(component.activeGenre).toBe('Jazz');
      expect(component.filteredConcerts.length).toBe(1);
    });
  });
});
