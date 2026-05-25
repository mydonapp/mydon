import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { TransactionRecord } from './accounts.service';

export type FiscalYearState = 'OPEN' | 'CLOSING' | 'CLOSED';

export interface FiscalYear {
  id: string;
  startYear: number;
  startDate: string;
  endDate: string;
  state: FiscalYearState;
  closingTransactionId: string | null;
  closedAt: string | null;
}

export interface InitiateCloseResponse {
  fiscalYear: FiscalYear;
  draftTransaction: TransactionRecord;
}

@Injectable({ providedIn: 'root' })
export class FiscalYearsService {
  private http = inject(HttpClient);
  private appConfig = inject(AppConfigService);

  async list(): Promise<FiscalYear[]> {
    return firstValueFrom(this.http.get<FiscalYear[]>(`${this.appConfig.apiUrl}/v1/fiscal-years`));
  }

  async initiateClose(fiscalYearStartYear: number): Promise<InitiateCloseResponse> {
    return firstValueFrom(
      this.http.post<InitiateCloseResponse>(`${this.appConfig.apiUrl}/v1/fiscal-years/initiate-close`, {
        fiscalYearStartYear,
      }),
    );
  }

  async seal(id: string): Promise<FiscalYear> {
    return firstValueFrom(this.http.post<FiscalYear>(`${this.appConfig.apiUrl}/v1/fiscal-years/${id}/seal`, {}));
  }

  async cancel(id: string): Promise<FiscalYear> {
    return firstValueFrom(this.http.post<FiscalYear>(`${this.appConfig.apiUrl}/v1/fiscal-years/${id}/cancel`, {}));
  }
}
