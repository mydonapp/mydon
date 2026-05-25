import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const languageService = inject(LanguageService);

  // Send the active UI language on every request (e.g. so signup seeds the chart in that language).
  const setHeaders: Record<string, string> = { 'X-Language': languageService.currentLanguage() };
  const token = authService.getAccessToken();
  if (token) {
    setHeaders['Authorization'] = `Bearer ${token}`;
  }

  return next(req.clone({ setHeaders }));
};
