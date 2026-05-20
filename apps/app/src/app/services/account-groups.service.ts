import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AccountsService } from './accounts.service';
import { AppConfigService } from './app-config.service';
import { BudgetsService } from './budgets.service';

export interface AccountGroup {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
}

@Injectable({ providedIn: 'root' })
export class AccountGroupsService {
  private http = inject(HttpClient);
  private appConfig = inject(AppConfigService);
  private accountsService = inject(AccountsService);
  private budgetsService = inject(BudgetsService);

  accountGroups = signal<AccountGroup[]>([]);
  private loaded = false;

  async fetchAccountGroups(force = false): Promise<void> {
    if (this.loaded && !force) {
      return;
    }
    const groups = await firstValueFrom(this.http.get<AccountGroup[]>(`${this.appConfig.apiUrl}/v1/account-groups`));
    this.accountGroups.set(groups);
    this.loaded = true;
  }

  async createAccountGroup(data: { name: string; code?: string; parentId?: string | null }): Promise<AccountGroup> {
    const group = await firstValueFrom(
      this.http.post<AccountGroup>(`${this.appConfig.apiUrl}/v1/account-groups`, data),
    );
    this.accountGroups.update((gs) => [...gs, group]);
    this.budgetsService.invalidate();
    return group;
  }

  async updateAccountGroup(
    id: string,
    data: { name?: string; code?: string; parentId?: string | null },
  ): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.appConfig.apiUrl}/v1/account-groups/${id}`, data));
    this.accountGroups.update((gs) =>
      gs.map((g) =>
        g.id === id ? { ...g, ...data, parentId: 'parentId' in data ? (data.parentId ?? null) : g.parentId } : g,
      ),
    );
    this.accountsService.invalidate();
    this.budgetsService.invalidate();
  }

  clearCache(): void {
    this.loaded = false;
    this.accountGroups.set([]);
  }
}
