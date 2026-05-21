import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideMockStore } from '@ngrx/store/testing';
import { of, throwError } from 'rxjs';
import { ConcertDetailComponent } from './concert-detail.component';
import { ConcertsService } from '../../../core/services/concerts.service';
import { GroupsService } from '../../../core/services/groups.service';
import { Concert } from '../../../core/models';

registerLocaleData(localeEs);

const mockConcert: Partial<Concert> = {
  id: 'concert-1',
  title: 'Noche de Rock',
  artistName: 'Interpol',
  date: '2025-09-15',
  doorsOpenTime: '22:00',
  genre: 'Rock',
  isPublished: true,
  myGroup: null,
  isBanned: false,
  isPast: false,
  venue: {
    id: 'v-1',
    name: 'Sala Apolo',
    address: 'Calle Nou de la Rambla',
    city: { id: 'city-1', name: 'Barcelona', slug: 'barcelona' },
  },
};

describe('ConcertDetailComponent - lógica de franjas horarias y formulario', () => {
  let component: ConcertDetailComponent;
  let fixture: ComponentFixture<ConcertDetailComponent>;
  let mockConcertsService: jasmine.SpyObj<ConcertsService>;
  let mockGroupsService: jasmine.SpyObj<GroupsService>;

  beforeEach(async () => {
    mockConcertsService = jasmine.createSpyObj('ConcertsService', ['getById', 'getCities', 'getAll']);
    mockGroupsService = jasmine.createSpyObj('GroupsService', ['joinConcert', 'getMyGroups']);
    mockConcertsService.getById.and.returnValue(of(mockConcert as Concert));

    await TestBed.configureTestingModule({
      imports: [ConcertDetailComponent, NoopAnimationsModule],
      providers: [
        { provide: ConcertsService, useValue: mockConcertsService },
        { provide: GroupsService, useValue: mockGroupsService },
        { provide: LOCALE_ID, useValue: 'es-ES' },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of({ get: (_: string) => 'concert-1' }) },
        },
        provideMockStore({ initialState: { auth: { user: null, token: null, loading: false, error: null, initialized: false } } }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConcertDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('generateArrivalWindows', () => {
    it('genera tres franjas horarias a partir de la hora de apertura de puertas', () => {
      const franjas = component.generateArrivalWindows('22:00');

      expect(franjas.length).toBe(3);
    });

    it('la franja EARLY empieza 90 minutos antes de la apertura (22:00 // 20:30–21:00)', () => {
      const franjas = component.generateArrivalWindows('22:00');

      expect(franjas[0].value).toBe('EARLY');
      expect(franjas[0].label).toBe('20:30 – 21:00');
    });

    it('la franja ON_TIME empieza 60 minutos antes de la apertura (22:00 // 21:00–21:30)', () => {
      const franjas = component.generateArrivalWindows('22:00');

      expect(franjas[1].value).toBe('ON_TIME');
      expect(franjas[1].label).toBe('21:00 – 21:30');
    });

    it('la franja LATE empieza 30 minutos antes de la apertura (22:00 // 21:30–22:00)', () => {
      const franjas = component.generateArrivalWindows('22:00');

      expect(franjas[2].value).toBe('LATE');
      expect(franjas[2].label).toBe('21:30 – 22:00');
    });

    it('maneja correctamente la medianoche sin producir horas negativas (00:00 // 22:30–23:30–00:00)', () => {
      const franjas = component.generateArrivalWindows('00:00');

      expect(franjas[0].label).toBe('22:30 – 23:00');
      expect(franjas[1].label).toBe('23:00 – 23:30');
      expect(franjas[2].label).toBe('23:30 – 00:00');
    });

    it('calcula correctamente con una hora temprana como las 20:00', () => {
      const franjas = component.generateArrivalWindows('20:00');

      expect(franjas[0].label).toBe('18:30 – 19:00');
      expect(franjas[2].label).toBe('19:30 – 20:00');
    });
  });

  describe('isFormComplete', () => {
    it('es false cuando no se ha seleccionado ninguna opción', () => {
      expect(component.isFormComplete).toBeFalse();
    });

    it('es false si solo se ha elegido el punto de encuentro', () => {
      component.selectedMeetingPointId = 'mp-1';

      expect(component.isFormComplete).toBeFalse();
    });

    it('es false si falta la actividad aunque los otros dos campos estén completos', () => {
      component.selectedMeetingPointId = 'mp-1';
      component.selectedArrivalWindow = 'ON_TIME';

      expect(component.isFormComplete).toBeFalse();
    });

    it('es true cuando punto de encuentro, franja horaria y actividad están seleccionados', () => {
      component.selectedMeetingPointId = 'mp-1';
      component.selectedArrivalWindow = 'ON_TIME';
      component.selectedActivity = 'HAVE_DRINK';

      expect(component.isFormComplete).toBeTrue();
    });
  });

  describe('onJoin', () => {
    it('muestra un mensaje de error si se intenta unirse sin completar el formulario', () => {
      component.onJoin();

      expect(component.joinError).toBe('Selecciona punto de encuentro, franja y preferencia');
    });

    it('no llama al servicio si el formulario no está completo', () => {
      component.selectedMeetingPointId = 'mp-1';
      component.onJoin();

      expect(mockGroupsService.joinConcert).not.toHaveBeenCalled();
    });

    it('llama al servicio de grupos con los datos seleccionados cuando el formulario está completo', () => {
      component.concert = mockConcert as Concert;
      component.selectedMeetingPointId = 'mp-1';
      component.selectedArrivalWindow = 'ON_TIME';
      component.selectedActivity = 'HAVE_DRINK';
      mockGroupsService.joinConcert.and.returnValue(of({} as any));

      component.onJoin();

      expect(mockGroupsService.joinConcert).toHaveBeenCalledWith(
        'concert-1',
        { meetingPointId: 'mp-1', arrivalWindow: 'ON_TIME', activityType: 'HAVE_DRINK' },
        jasmine.any(Object)
      );
    });

    it('activa joinSuccess y alreadyInGroup cuando la unión tiene éxito', () => {
      component.concert = mockConcert as Concert;
      component.selectedMeetingPointId = 'mp-1';
      component.selectedArrivalWindow = 'ON_TIME';
      component.selectedActivity = 'HAVE_DRINK';
      mockGroupsService.joinConcert.and.returnValue(of({} as any));

      component.onJoin();

      expect(component.joinSuccess).toBeTrue();
      expect(component.alreadyInGroup).toBeTrue();
      expect(component.joinLoading).toBeFalse();
    });

    it('muestra un mensaje de error y desactiva la carga cuando el servicio falla', () => {
      component.concert = mockConcert as Concert;
      component.selectedMeetingPointId = 'mp-1';
      component.selectedArrivalWindow = 'ON_TIME';
      component.selectedActivity = 'HAVE_DRINK';
      mockGroupsService.joinConcert.and.returnValue(throwError(() => new Error('Error del servidor')));

      component.onJoin();

      expect(component.joinError).toBe('No se pudo unir al grupo. Inténtalo de nuevo.');
      expect(component.joinLoading).toBeFalse();
    });
  });
});
