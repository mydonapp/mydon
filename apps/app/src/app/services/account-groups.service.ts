import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';

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

  accountGroups = signal<AccountGroup[]>([]);

  async fetchAccountGroups(): Promise<void> {
    const groups = await firstValueFrom(this.http.get<AccountGroup[]>(`${this.appConfig.apiUrl}/v1/account-groups`));
    this.accountGroups.set(groups);
  }

  async createAccountGroup(data: { name: string; code?: string; parentId?: string | null }): Promise<AccountGroup> {
    const group = await firstValueFrom(
      this.http.post<AccountGroup>(`${this.appConfig.apiUrl}/v1/account-groups`, data),
    );
    this.accountGroups.update((gs) => [...gs, group]);
    return group;
  }

  async updateAccountGroup(
    id: string,
    data: { name?: string; code?: string; parentId?: string | null },
  ): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.appConfig.apiUrl}/v1/account-groups/${id}`, data));
    this.accountGroups.update((gs) =>
      gs.map((g) => (g.id === id ? { ...g, ...data, parentId: data.parentId ?? g.parentId } : g)),
    );
  }
}
