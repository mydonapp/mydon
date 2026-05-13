import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';

interface TokenResponse {
  accessToken: string;
  expiry: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly appConfig = inject(AppConfigService);

  private accessToken: string | null = null;
  private accessTokenExpiry: Date | null = null;
  private initialized = false;

  private get apiUrl() {
    return this.appConfig.apiUrl;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isTokenValid(): boolean {
    if (!this.accessToken || !this.accessTokenExpiry) return false;
    return new Date() < this.accessTokenExpiry;
  }

  isAuthenticated(): boolean {
    return this.isTokenValid();
  }

  private setToken(token: string, expiresIn: number) {
    this.accessToken = token;
    this.accessTokenExpiry = new Date(Date.now() + expiresIn * 1000);
  }

  async fetchAccessToken(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.post<TokenResponse>(`${this.apiUrl}/v1/auth/refresh`, {}, { withCredentials: true }),
      );
      this.setToken(res.accessToken, res.expiry);
    } catch {
      this.accessToken = null;
      this.accessTokenExpiry = null;
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    await this.fetchAccessToken();
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<TokenResponse>(
        `${this.apiUrl}/v1/auth/login/password`,
        { email, password },
        { withCredentials: true },
      ),
    );
    this.setToken(res.accessToken, res.expiry);
  }

  async signup(name: string, email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<TokenResponse>(
        `${this.apiUrl}/v1/auth/signup`,
        { name, email, password },
        { withCredentials: true },
      ),
    );
    this.setToken(res.accessToken, res.expiry);
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/v1/auth/logout`, {}, { withCredentials: true }));
    } finally {
      this.accessToken = null;
      this.accessTokenExpiry = null;
      this.router.navigate(['/auth/login']);
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await firstValueFrom(
      this.http.put(
        `${this.apiUrl}/v1/auth/account/password`,
        { currentPassword, newPassword },
        { withCredentials: true },
      ),
    );
  }
}
