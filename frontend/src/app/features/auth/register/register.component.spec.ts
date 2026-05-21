import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';

describe('RegisterComponent - validación del formulario', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['register']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea el componente correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('el formulario es inválido cuando está vacío al cargarse', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('el alias es inválido si tiene menos de 3 caracteres', () => {
    component.form.get('alias')!.setValue('ab');
    component.form.get('alias')!.markAsTouched();

    expect(component.showError('alias')).toBeTrue();
  });

  it('el alias es válido con 3 o más caracteres', () => {
    component.form.get('alias')!.setValue('Ana');
    component.form.get('alias')!.markAsTouched();

    expect(component.showError('alias')).toBeFalse();
  });

  it('el campo email muestra error con un formato inválido', () => {
    component.form.get('email')!.setValue('esto-no-es-un-email');
    component.form.get('email')!.markAsTouched();

    expect(component.showError('email')).toBeTrue();
  });

  it('la contraseña es inválida si tiene menos de 8 caracteres', () => {
    component.form.get('password')!.setValue('Abc1');
    component.form.get('password')!.markAsTouched();

    expect(component.showError('password')).toBeTrue();
  });

  it('la contraseña es inválida si no contiene ninguna letra mayúscula', () => {
    component.form.get('password')!.setValue('abcde123');
    component.form.get('password')!.markAsTouched();

    expect(component.showError('password')).toBeTrue();
  });

  it('la contraseña es inválida si no contiene ningún número', () => {
    component.form.get('password')!.setValue('Abcdefgh');
    component.form.get('password')!.markAsTouched();

    expect(component.showError('password')).toBeTrue();
  });

  it('la contraseña es válida con mayúscula, número y al menos 8 caracteres', () => {
    component.form.get('password')!.setValue('MiPass123');
    component.form.get('password')!.markAsTouched();

    expect(component.showError('password')).toBeFalse();
  });

  it('no muestra el aviso de contraseñas no coincidentes si el campo confirmPassword no ha sido tocado', () => {
    component.form.get('password')!.setValue('MiPass123');
    component.form.get('confirmPassword')!.setValue('OtraPass456');

    expect(component.showPasswordMismatch()).toBeFalse();
  });

  it('muestra el aviso de contraseñas no coincidentes cuando los valores difieren y el campo ha sido tocado', () => {
    component.form.get('password')!.setValue('MiPass123');
    component.form.get('confirmPassword')!.setValue('OtraPass456');
    component.form.get('confirmPassword')!.markAsTouched();

    expect(component.showPasswordMismatch()).toBeTrue();
  });

  it('no muestra aviso cuando ambas contraseñas son idénticas', () => {
    component.form.get('password')!.setValue('MiPass123');
    component.form.get('confirmPassword')!.setValue('MiPass123');
    component.form.get('confirmPassword')!.markAsTouched();

    expect(component.showPasswordMismatch()).toBeFalse();
  });

  it('el formulario es válido cuando todos los campos son correctos y las contraseñas coinciden', () => {
    component.form.setValue({
      alias: 'Ana',
      email: 'ana@gigtogether.com',
      password: 'MiPass123',
      confirmPassword: 'MiPass123',
    });

    expect(component.form.valid).toBeTrue();
  });

  it('marca todos los campos como tocados si se intenta enviar el formulario vacío', () => {
    component.onSubmit();

    expect(component.form.get('alias')?.touched).toBeTrue();
    expect(component.form.get('email')?.touched).toBeTrue();
    expect(component.form.get('password')?.touched).toBeTrue();
    expect(component.form.get('confirmPassword')?.touched).toBeTrue();
  });

  it('no llama al servicio de registro si el formulario es inválido', () => {
    component.onSubmit();

    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  it('llama al servicio de registro con los datos correctos cuando el formulario es válido', () => {
    mockAuthService.register.and.returnValue(
      of({ id: 'u-1', email: 'ana@gigtogether.com', alias: 'Ana' })
    );
    component.form.setValue({
      alias: 'Ana',
      email: 'ana@gigtogether.com',
      password: 'MiPass123',
      confirmPassword: 'MiPass123',
    });

    component.onSubmit();

    expect(mockAuthService.register).toHaveBeenCalledWith(
      'Ana', 'ana@gigtogether.com', 'MiPass123'
    );
  });

  it('muestra el error correspondiente si el email ya está registrado (conflicto 409)', () => {
    mockAuthService.register.and.returnValue(throwError(() => ({ status: 409 })));
    component.form.setValue({
      alias: 'Ana',
      email: 'ana@gigtogether.com',
      password: 'MiPass123',
      confirmPassword: 'MiPass123',
    });

    component.onSubmit();

    expect(component.registerError).toBe('Este email ya está registrado');
    expect(component.isLoading).toBeFalse();
  });

  it('muestra un mensaje de error genérico si el registro falla por un motivo desconocido', () => {
    mockAuthService.register.and.returnValue(throwError(() => ({ status: 500 })));
    component.form.setValue({
      alias: 'Ana',
      email: 'ana@gigtogether.com',
      password: 'MiPass123',
      confirmPassword: 'MiPass123',
    });

    component.onSubmit();

    expect(component.registerError).toBe('Ha ocurrido un error. Inténtalo de nuevo.');
    expect(component.isLoading).toBeFalse();
  });
});
