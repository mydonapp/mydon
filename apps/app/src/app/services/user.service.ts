import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { LanguageService } from './language.service';
import { ListStyle, ListStyleService } from './list-style.service';
import { PrivacyService } from './privacy.service';
import { Theme, ThemeService } from './theme.service';

export interface User {
  id: string;
  name: string;
  email: string;
  language: string;
  theme: string;
  listStyle: string;
  privacyMode: boolean;
}

export interface UserPreferences {
  language?: string;
  theme?: string;
  listStyle?: string;
  privacyMode?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly languageService = inject(LanguageService);
  private readonly themeService = inject(ThemeService);
  private readonly listStyleService = inject(ListStyleService);
  private readonly privacyService = inject(PrivacyService);
  private readonly appConfig = inject(AppConfigService);

  user = signal<User | null>(null);

  async fetchUser(): Promise<void> {
    try {
      const user = await firstValueFrom(this.http.get<User>(`${this.appConfig.apiUrl}/v1/auth/me`));
      this.user.set(user);
      this.applyPreferences(user);
    } catch {
      this.user.set(null);
    }
  }

  private applyPreferences(user: User): void {
    this.languageService.setLanguage(user.language ?? 'en');
    this.themeService.setTheme((user.theme ?? 'system') as Theme);
    this.listStyleService.set((user.listStyle ?? 'normal') as ListStyle);
    this.privacyService.setFromBackend(user.privacyMode ?? false);
  }

  async updateUser(name: string, email: string): Promise<void> {
    const updated = await firstValueFrom(this.http.patch<User>(`${this.appConfig.apiUrl}/v1/auth/me`, { name, email }));
    this.user.set(updated);
  }

  async updatePreferences(prefs: UserPreferences): Promise<void> {
    const updated = await firstValueFrom(this.http.patch<User>(`${this.appConfig.apiUrl}/v1/auth/me`, prefs));
    this.user.set(updated);
    this.applyPreferences(updated);
  }
}
