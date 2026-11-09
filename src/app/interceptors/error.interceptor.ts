import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 Unauthorized handling: token expired or invalid
      if (error.status === 401) {
        const isLoginRequest = req.url.includes('/auth/login');
        if (!isLoginRequest) {
          // Clear authentication tokens and redirect to login
          localStorage.removeItem(environment.tokenStorageKey);
          sessionStorage.removeItem(environment.tokenStorageKey);
          localStorage.removeItem('auth_user');
          sessionStorage.removeItem('auth_user');
          router.navigate(['/']);
        }
      }

      // Propagate the original HttpErrorResponse untouched so components
      // retain full access to status codes, response headers, and error payload structures
      return throwError(() => error);
    })
  );
};
