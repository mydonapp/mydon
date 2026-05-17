import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ForexService } from './forex.service';

@Injectable()
export class ForexScheduler {
  private readonly logger = new Logger(ForexScheduler.name);

  constructor(private forexService: ForexService) {}

  /**
   * Daily at 02:00 server-time: top up the FX cache for the last 365 days for every base
   * currency in use, ensuring today's rate is always available so transaction creation
   * never needs to hit the upstream provider.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async refreshCache(): Promise<void> {
    try {
      const result = await this.forexService.backfillCache();
      this.logger.log(`Scheduled FX backfill: inserted ${result.rowsInserted} rates`);
    } catch (err) {
      this.logger.error(`Scheduled FX backfill failed: ${(err as Error).message}`);
    }
  }
}
