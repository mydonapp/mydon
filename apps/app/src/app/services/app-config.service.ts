import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { load, Store } from '@tauri-apps/plugin-store';
import { firstValueFrom } from 'rxjs';

const STORE_FILE = 'settings.json';
const STORE_KEY = 'apiUrl';

interface AppConfig {
  apiUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly http = inject(HttpClient);
  private config: AppConfig = { apiUrl: '' };
  private store: Store | null = null;

  readonly customApiUrl = signal<string | null>(null);
  readonly isNativeApp = signal(false);

  async load(): Promise<void> {
    this.config = await firstValueFrom(this.http.get<AppConfig>('./assets/config.json'));

    if (isTauri()) {
      this.isNativeApp.set(true);
      this.store = await load(STORE_FILE);
      const saved = await this.store.get<string>(STORE_KEY);
      this.customApiUrl.set(saved ?? null);
    }
  }

  get apiUrl(): string {
    return this.customApiUrl() ?? this.config.apiUrl;
  }

  async setCustomApiUrl(url: string | null): Promise<void> {
    const cleaned = url ? url.replace(/\/$/, '') : null;
    this.customApiUrl.set(cleaned);

    if (this.store) {
      if (cleaned) {
        await this.store.set(STORE_KEY, cleaned);
      } else {
        await this.store.delete(STORE_KEY);
      }
      await this.store.save();
    }
  }
}
