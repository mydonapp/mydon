import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface ForexRate {
  from: string;
  to: string;
  date: string;
  rate: number;
}

@Injectable({ providedIn: 'root' })
export class ForexService {
  private http = inject(HttpClient);
  private appConfig = inject(AppConfigService);

  async getRate(from: string, to: string, date: string): Promise<number> {
    const params = new URLSearchParams({ from, to, date }).toString();
    const res = await firstValueFrom(
      this.http.get<ForexRate>(`${this.appConfig.apiUrl}/v1/forex/rate?${params}`),
    );
    return res.rate;
  }
}
