import { createReducer, on } from '@ngrx/store';
import { AuthState } from '../../core/models';
import * as AuthActions from './auth.actions';

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  initialized: false
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.login, state => ({ ...state, loading: true, error: null })),
  on(AuthActions.loginSuccess, (state, { user, token }) => ({
    ...state, user, token, loading: false, error: null, initialized: true
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state, loading: false, error
  })),
  on(AuthActions.logout, () => ({ ...initialState, initialized: true })),
  on(AuthActions.loadUserFromStorage, state => ({ ...state, loading: true })),
  on(AuthActions.updateUser, (state, { user }) => ({
    ...state,
    user: state.user ? { ...state.user, ...user } : state.user
  }))
);
