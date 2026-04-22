import { createAction, props } from '@ngrx/store';
import { User } from '../../core/models';

export const login = createAction(
  '[Auth] Login',
  props<{ email: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User; token: string; shouldNavigate?: boolean }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

export const logout = createAction('[Auth] Logout');

export const loadUserFromStorage = createAction('[Auth] Load User From Storage');

export const updateUser = createAction(
  '[Auth] Update User',
  props<{ user: Partial<User> }>()
);
