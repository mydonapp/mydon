import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AccountGroupsService } from './account-groups.service';
import { AccountsService } from './accounts.service';
import { AppConfigService } from './app-config.service';
import { BudgetsService } from './budgets.service';
import { LedgerService } from './ledger.service';
import { ReportsService } from './reports.service';
import { UserService } from './user.service';

interface TokenResponse {
  accessToken: string;
  expiry: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly appConfig = inject(AppConfigService);
  private readonly accountsService = inject(AccountsService);
  private readonly accountGroupsService = inject(AccountGroupsService);
  private readonly budgetsService = inject(BudgetsService);
  private readonly reportsService = inject(ReportsService);
  private readonly ledgerService = inject(LedgerService);
  private readonly userService = inject(UserService);

  private accessToken: string | null = null;
  private accessTokenExpiry: Date | null = null;
  private initialized = false;
  private refreshInFlight: Promise<void> | null = null;

  private get apiUrl() {
    return this.appConfig.apiUrl;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isTokenValid(): boolean {
    if (!this.accessToken || !this.accessTokenExpiry) {
      return false;
    }
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

  /** Refresh the token, sharing one in-flight request so concurrent callers don't each fire a refresh. */
  private refresh(): Promise<void> {
    this.refreshInFlight ??= this.fetchAccessToken().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  /**
   * Returns an access token to attach to an outgoing request, refreshing first if it's missing,
   * expired, or about to expire (a small skew covers in-flight latency). Returns null when no session
   * can be re-established — the caller then proceeds unauthenticated / redirects to login.
   */
  async ensureValidToken(): Promise<string | null> {
    const skewMs = 10_000;
    const stillValid =
      !!this.accessToken && !!this.accessTokenExpiry && Date.now() + skewMs < this.accessTokenExpiry.getTime();
    if (!stillValid) {
      await this.refresh();
    }
    return this.accessToken;
  }

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    await this.refresh();
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

  async signup(
    name: string,
    email: string,
    password: string,
    opts?: { kind?: 'BUSINESS'; organizationName?: string },
  ): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<TokenResponse>(
        `${this.apiUrl}/v1/auth/signup`,
        { name, email, password, kind: opts?.kind, organizationName: opts?.organizationName },
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
      this.accountsService.clearCache();
      this.accountGroupsService.clearCache();
      this.budgetsService.clearCache();
      this.reportsService.clearCache();
      this.ledgerService.clearCache();
      this.userService.clearCache();
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
