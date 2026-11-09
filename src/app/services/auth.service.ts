import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from '../core/services/api.service';
import { API_ENDPOINTS } from '../core/constants/api-endpoints';
import { ApiResponse } from '../core/models/api-response.model';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  type?: string;
  status?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  label: string;
}

export interface LoginData {
  token: string;
  token_type?: string;
  expires_at?: string;
  user?: AuthUser;
}

export type LoginResponse = ApiResponse<LoginData>;
export type CurrentUserResponse = ApiResponse<AuthUser>;
export type LogoutResponse = ApiResponse<null>;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly tokenKey = environment.tokenStorageKey;
  private readonly userKey = 'auth_user';

  /**
   * Reactive signal for current user
   */
  readonly currentUser = signal<AuthUser | null>(this.getUser());

  /**
   * User login API
   */
  login(
    email: string,
    password: string,
    label: string = 'Leads CMS Admin'
  ): Observable<LoginResponse> {
    const body: LoginRequest = {
      email,
      password,
      label,
    };

    return this.api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, body);
  }

  /**
   * Fetch current authenticated user info from /auth/me
   * Side effect: Updates token last_used_at on backend
   */
  me(): Observable<CurrentUserResponse> {
    return this.api.get<CurrentUserResponse>(API_ENDPOINTS.AUTH.ME);
  }

  /**
   * Loads safe profile into application state.
   * Call after login and on admin panel reload.
   */
  loadProfile(): Observable<AuthUser | null> {
    if (!this.isLoggedIn()) {
      return of(null);
    }

    return this.me().pipe(
      map((response) => {
        if (response.success && response.data) {
          this.setUser(response.data);
          return response.data;
        }
        return null;
      }),
      catchError((error) => {
        if (error.status === 401) {
          this.clearSession();
        }
        return of(null);
      })
    );
  }

  /**
   * Logout user session: revokes only the active token used for this request.
   * Side effect: Sets token revoked_at on the backend.
   */
  logout(): Observable<LogoutResponse> {
    return this.api.post<LogoutResponse>(API_ENDPOINTS.AUTH.LOGOUT, {});
  }

  /**
   * Save authentication session (token & user profile)
   */
  saveAuth(data: LoginData, rememberMe: boolean = true): void {
    this.clearSession();
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.tokenKey, data.token);

    if (data.user) {
      storage.setItem(this.userKey, JSON.stringify(data.user));
      this.currentUser.set(data.user);
    }
  }

  /**
   * Backward-compatible token saving
   */
  saveToken(token: string, rememberMe: boolean): void {
    this.saveAuth({ token }, rememberMe);
  }

  /**
   * Update active user in storage and signal
   */
  setUser(user: AuthUser | null): void {
    this.currentUser.set(user);
    if (user) {
      // Keep storage in sync (using whichever storage holds the token)
      const storage = localStorage.getItem(this.tokenKey) ? localStorage : sessionStorage;
      storage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  /**
   * Retrieve active authentication token
   */
  getToken(): string | null {
    return (
      localStorage.getItem(this.tokenKey) ??
      sessionStorage.getItem(this.tokenKey) ??
      localStorage.getItem('token') ??
      sessionStorage.getItem('token')
    );
  }

  /**
   * Retrieve cached user profile
   */
  getUser(): AuthUser | null {
    try {
      const raw =
        localStorage.getItem(this.userKey) ??
        sessionStorage.getItem(this.userKey) ??
        localStorage.getItem('user') ??
        sessionStorage.getItem('user');
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if user has an active token
   */
  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Clear authentication token and session from all storages
   */
  clearToken(): void {
    this.clearSession();
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    sessionStorage.removeItem(this.userKey);
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    this.currentUser.set(null);
  }
}