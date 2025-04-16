import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ForexService {
  private async fetchCurrencyRate(from: string, date: Date) {
    const result = await axios.get(
      `https://api.frankfurter.app/${
        date.toISOString().split('T')[0]
      }?from=${from}`
    );
    return result.data;
  }

  public async convertCurrency(
    amount: number,
    from: string,
    to: string,
    date: Date
  ): Promise<number> {
    if (from === to) return amount;

    const exchangeRate = await this.fetchCurrencyRate(from, date);

    return exchangeRate.rates[to] * amount;
  }
}
