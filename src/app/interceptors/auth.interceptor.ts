import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Do not attach Authorization header to login request
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  const token =
    localStorage.getItem(environment.tokenStorageKey) ??
    sessionStorage.getItem(environment.tokenStorageKey) ??
    localStorage.getItem('token') ??
    sessionStorage.getItem('token');

  // If already has Authorization header or no token found, proceed as-is
  if (!token || req.headers.has('Authorization')) {
    return next(req);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  // Only set Accept if not already set (leave Content-Type untouched so FormData works)
  if (!req.headers.has('Accept')) {
    headers['Accept'] = 'application/json';
  }

  return next(req.clone({ setHeaders: headers }));
};