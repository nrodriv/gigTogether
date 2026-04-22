import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from '../../core/models';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(selectAuthState, s => s.user);
export const selectToken = createSelector(selectAuthState, s => s.token);
export const selectIsAuthenticated = createSelector(selectAuthState, s => !!s.token);
export const selectIsAdmin = createSelector(selectAuthState, s => s.user?.role === 'ADMIN');
export const selectAuthLoading = createSelector(selectAuthState, s => s.loading);
export const selectAuthError = createSelector(selectAuthState, s => s.error);
export const selectAuthInitialized = createSelector(selectAuthState, s => s.initialized);
