import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface OrgLedger {
  id: string;
  name: string;
  baseCurrency: string;
}

export interface Organization {
  id: string;
  name: string;
  kind: 'PERSONAL' | 'BUSINESS';
  role: string;
  ledgers: OrgLedger[];
}

@Injectable({ providedIn: 'root' })
export class OrganizationsService {
  private http = inject(HttpClient);
  private appConfig = inject(AppConfigService);

  readonly organizations = signal<Organization[]>([]);
  private loaded = false;

  async fetch(force = false): Promise<Organization[]> {
    if (this.loaded && !force) {
      return this.organizations();
    }
    const orgs = await firstValueFrom(
      this.http.get<Organization[]>(`${this.appConfig.apiUrl}/v1/organizations`),
    );
    this.organizations.set(orgs);
    this.loaded = true;
    return orgs;
  }

  /**
   * Switch the active ledger, then hard-reload so the whole app re-bootstraps in the new context
   * (every cache re-fetches against the new active ledger — far simpler than invalidating each service).
   */
  async switchToLedger(ledgerId: string): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.appConfig.apiUrl}/v1/auth/me`, { activeLedgerId: ledgerId }));
    window.location.assign('/app');
  }

  clearCache(): void {
    this.loaded = false;
    this.organizations.set([]);
  }
}
