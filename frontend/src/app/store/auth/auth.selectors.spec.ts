import {
  selectCurrentUser,
  selectToken,
  selectIsAuthenticated,
  selectIsAdmin,
  selectAuthLoading,
  selectAuthError,
  selectAuthInitialized,
} from './auth.selectors';
import { AuthState } from '../../core/models';

const estadoBase: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  initialized: false,
};

const estadoConUsuario: AuthState = {
  user: { id: 'u-1', email: 'ana@gigtogether.com', alias: 'Ana', role: 'USER' },
  token: 'token-valido-xyz',
  loading: false,
  error: null,
  initialized: true,
};

const estadoAdmin: AuthState = {
  ...estadoConUsuario,
  user: { id: 'admin-1', email: 'admin@gigtogether.com', alias: 'Admin', role: 'ADMIN' },
};

describe('Selectores de autenticación', () => {
  it('selectCurrentUser devuelve null cuando no hay sesión activa', () => {
    const resultado = selectCurrentUser.projector(estadoBase);
    expect(resultado).toBeNull();
  });

  it('selectCurrentUser devuelve el usuario cuando la sesión está activa', () => {
    const resultado = selectCurrentUser.projector(estadoConUsuario);
    expect(resultado?.alias).toBe('Ana');
    expect(resultado?.email).toBe('ana@gigtogether.com');
  });

  it('selectToken devuelve null cuando no hay token almacenado', () => {
    const resultado = selectToken.projector(estadoBase);
    expect(resultado).toBeNull();
  });

  it('selectToken devuelve el token cuando el usuario está autenticado', () => {
    const resultado = selectToken.projector(estadoConUsuario);
    expect(resultado).toBe('token-valido-xyz');
  });

  it('selectIsAuthenticated es false cuando no hay token', () => {
    const resultado = selectIsAuthenticated.projector(estadoBase);
    expect(resultado).toBeFalse();
  });

  it('selectIsAuthenticated es true cuando existe un token válido', () => {
    const resultado = selectIsAuthenticated.projector(estadoConUsuario);
    expect(resultado).toBeTrue();
  });

  it('selectIsAdmin es false para un usuario normal', () => {
    const resultado = selectIsAdmin.projector(estadoConUsuario);
    expect(resultado).toBeFalse();
  });

  it('selectIsAdmin es true para un usuario con rol de administrador', () => {
    const resultado = selectIsAdmin.projector(estadoAdmin);
    expect(resultado).toBeTrue();
  });

  it('selectIsAdmin es false cuando no hay usuario en el estado', () => {
    const resultado = selectIsAdmin.projector(estadoBase);
    expect(resultado).toBeFalse();
  });

  it('selectAuthLoading es true mientras se procesa la autenticación', () => {
    const estadoCargando: AuthState = { ...estadoBase, loading: true };
    const resultado = selectAuthLoading.projector(estadoCargando);
    expect(resultado).toBeTrue();
  });

  it('selectAuthError devuelve null cuando no hay error', () => {
    const resultado = selectAuthError.projector(estadoBase);
    expect(resultado).toBeNull();
  });

  it('selectAuthError devuelve el mensaje de error cuando el login ha fallado', () => {
    const estadoConError: AuthState = { ...estadoBase, error: 'Credenciales incorrectas' };
    const resultado = selectAuthError.projector(estadoConError);
    expect(resultado).toBe('Credenciales incorrectas');
  });

  it('selectAuthInitialized es false en el estado inicial y true después de la primera verificación', () => {
    expect(selectAuthInitialized.projector(estadoBase)).toBeFalse();
    expect(selectAuthInitialized.projector(estadoConUsuario)).toBeTrue();
  });
});
