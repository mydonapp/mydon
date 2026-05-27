import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

/**
 * Token-lifecycle endpoints: they authenticate via the refresh cookie (not a bearer) and must NOT
 * trigger a pre-flight refresh — refreshing the refresh request itself would recurse.
 */
const AUTH_BYPASS = ['/v1/auth/refresh', '/v1/auth/login', '/v1/auth/signup'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const languageService = inject(LanguageService);
  const lang = languageService.currentLanguage();

  if (AUTH_BYPASS.some((path) => req.url.includes(path))) {
    return next(req.clone({ setHeaders: { 'X-Language': lang } }));
  }

  // Ensure the access token is still valid before attaching it — if it expired mid-session, refresh
  // first so the request doesn't go out with a stale token and 401.
  return from(authService.ensureValidToken()).pipe(
    switchMap((token) => {
      const setHeaders: Record<string, string> = { 'X-Language': lang };
      if (token) {
        setHeaders['Authorization'] = `Bearer ${token}`;
      }
      return next(req.clone({ setHeaders }));
    }),
  );
};
