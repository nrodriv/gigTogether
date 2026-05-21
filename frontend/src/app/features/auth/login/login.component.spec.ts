import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MemoizedSelector } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { LoginComponent } from './login.component';
import { login } from '../../../store/auth/auth.actions';
import { selectAuthError, selectIsAuthenticated } from '../../../store/auth/auth.selectors';
import { AuthState } from '../../../core/models';

const estadoInicial: { auth: AuthState } = {
  auth: {
    user: null, token: null, loading: false, error: null, initialized: false,
  },
};

describe('LoginComponent - validación del formulario', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let store: MockStore;
  let mockSelectAuthError: MemoizedSelector<{ auth: AuthState }, string | null>;
  let mockSelectIsAuthenticated: MemoizedSelector<{ auth: AuthState }, boolean>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        provideMockStore({ initialState: estadoInicial }),
        provideRouter([]),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    mockSelectAuthError = store.overrideSelector(selectAuthError, null);
    mockSelectIsAuthenticated = store.overrideSelector(selectIsAuthenticated, false);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    store.resetSelectors();
  });

  it('crea el componente correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('el formulario es inválido cuando está vacío al cargarse', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('no muestra error en el campo email si el usuario no lo ha tocado aún', () => {
    expect(component.showError('email')).toBeFalse();
  });

  it('muestra error en el campo email cuando está vacío y ha sido tocado', () => {
    const emailControl = component.form.get('email')!;
    emailControl.markAsTouched();

    expect(component.showError('email')).toBeTrue();
  });

  it('muestra error si el email no tiene un formato válido y ha sido tocado', () => {
    const emailControl = component.form.get('email')!;
    emailControl.setValue('esto-no-es-un-email');
    emailControl.markAsTouched();

    expect(component.showError('email')).toBeTrue();
  });

  it('no muestra error cuando el email tiene un formato correcto', () => {
    const emailControl = component.form.get('email')!;
    emailControl.setValue('ana@gigtogether.com');
    emailControl.markAsTouched();

    expect(component.showError('email')).toBeFalse();
  });

  it('muestra error en el campo contraseña cuando está vacío y ha sido tocado', () => {
    const passControl = component.form.get('password')!;
    passControl.markAsTouched();

    expect(component.showError('password')).toBeTrue();
  });

  it('el formulario es válido cuando email y contraseña tienen valores correctos', () => {
    component.form.setValue({ email: 'ana@gigtogether.com', password: 'MiPass123' });
    expect(component.form.valid).toBeTrue();
  });

  it('marca todos los campos como tocados si se intenta enviar el formulario vacío', () => {
    spyOn(store, 'dispatch');
    component.onSubmit();

    expect(component.form.get('email')?.touched).toBeTrue();
    expect(component.form.get('password')?.touched).toBeTrue();
  });

  it('no despacha la acción de login si el formulario es inválido', () => {
    spyOn(store, 'dispatch');
    component.onSubmit();

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('despacha la acción de login con las credenciales correctas cuando el formulario es válido', () => {
    spyOn(store, 'dispatch');
    component.form.setValue({ email: 'ana@gigtogether.com', password: 'MiPass123' });
    component.onSubmit();

    expect(store.dispatch).toHaveBeenCalledWith(
      login({ email: 'ana@gigtogether.com', password: 'MiPass123' })
    );
  });

  it('activa el estado de carga al enviar el formulario', () => {
    component.form.setValue({ email: 'ana@gigtogether.com', password: 'MiPass123' });
    component.onSubmit();

    expect(component.isLoading).toBeTrue();
  });
});
