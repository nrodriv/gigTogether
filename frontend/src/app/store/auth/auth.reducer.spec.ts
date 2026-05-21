import { authReducer } from './auth.reducer';
import * as AuthActions from './auth.actions';
import { AuthState } from '../../core/models';

const estadoInicial: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  initialized: false,
};

const usuarioFalso = {
  id: 'usuario-1',
  email: 'ana@gigtogether.com',
  alias: 'Ana',
  role: 'USER' as const,
};

describe('authReducer', () => {
  it('devuelve el estado inicial cuando no se despacha ninguna acción conocida', () => {
    const estado = authReducer(undefined, { type: '@@INIT' } as any);
    expect(estado).toEqual(estadoInicial);
  });

  it('activa el indicador de carga y limpia errores previos al iniciar el login', () => {
    const estadoPrevio: AuthState = { ...estadoInicial, error: 'Error anterior' };
    const estado = authReducer(estadoPrevio, AuthActions.login({ email: 'ana@gigtogether.com', password: 'MiPass1' }));

    expect(estado.loading).toBeTrue();
    expect(estado.error).toBeNull();
  });

  it('guarda el usuario y el token cuando el login tiene éxito', () => {
    const estado = authReducer(
      estadoInicial,
      AuthActions.loginSuccess({ user: usuarioFalso, token: 'token-jwt-123', shouldNavigate: true })
    );

    expect(estado.user).toEqual(usuarioFalso);
    expect(estado.token).toBe('token-jwt-123');
    expect(estado.loading).toBeFalse();
    expect(estado.error).toBeNull();
    expect(estado.initialized).toBeTrue();
  });

  it('guarda el mensaje de error y desactiva la carga cuando el login falla', () => {
    const estado = authReducer(
      { ...estadoInicial, loading: true },
      AuthActions.loginFailure({ error: 'Credenciales incorrectas' })
    );

    expect(estado.loading).toBeFalse();
    expect(estado.error).toBe('Credenciales incorrectas');
    expect(estado.user).toBeNull();
    expect(estado.token).toBeNull();
  });

  it('borra el usuario y el token al cerrar sesión pero mantiene initialized a true', () => {
    const estadoAutenticado: AuthState = {
      user: usuarioFalso,
      token: 'token-jwt-123',
      loading: false,
      error: null,
      initialized: true,
    };

    const estado = authReducer(estadoAutenticado, AuthActions.logout());

    expect(estado.user).toBeNull();
    expect(estado.token).toBeNull();
    expect(estado.initialized).toBeTrue();
  });

  it('activa la carga al intentar recuperar el usuario desde el almacenamiento local', () => {
    const estado = authReducer(estadoInicial, AuthActions.loadUserFromStorage());

    expect(estado.loading).toBeTrue();
  });

  it('actualiza parcialmente los datos del usuario sin perder los campos no modificados', () => {
    const estadoAutenticado: AuthState = {
      ...estadoInicial,
      user: usuarioFalso,
    };

    const estado = authReducer(
      estadoAutenticado,
      AuthActions.updateUser({ user: { alias: 'Ana actualizada', bio: 'Nueva bio' } })
    );

    expect(estado.user?.alias).toBe('Ana actualizada');
    expect(estado.user?.email).toBe('ana@gigtogether.com');
    expect(estado.user?.role).toBe('USER');
  });

  it('no modifica el usuario si no hay ninguno en el estado al hacer updateUser', () => {
    const estado = authReducer(
      estadoInicial,
      AuthActions.updateUser({ user: { alias: 'Nueva alias' } })
    );

    expect(estado.user).toBeNull();
  });
});
