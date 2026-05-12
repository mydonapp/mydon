import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface AppConfig {
  apiUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private http = inject(HttpClient);
  private config: AppConfig = { apiUrl: '' };

  async load(): Promise<void> {
    this.config = await firstValueFrom(this.http.get<AppConfig>('./assets/config.json'));
  }

  get apiUrl(): string {
    return this.config.apiUrl;
  }
}
