import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { Currency } from '../currency';
import { BackfillForexDto } from './dtos/backfill-forex.dto';
import { ForexService } from './forex.service';

@ApiTags('forex')
@ApiBearerAuth()
@Controller('v1/forex')
export class ForexController {
  constructor(private forexService: ForexService) {}

  @UseGuards(AuthGuard)
  @Get('rate')
  @ApiOperation({
    summary: 'Look up an FX rate from the cache (or fetch + cache on miss)',
    description:
      'Returns the cached `from → to` rate for the given date. Intended for the UI to pre-fill the fxRate field on a multi-currency transaction entry; the user can still override the value before submitting.',
  })
  @ApiQuery({ name: 'from', enum: Currency })
  @ApiQuery({ name: 'to', enum: Currency })
  @ApiQuery({ name: 'date', type: String, required: false, description: 'ISO date (YYYY-MM-DD). Defaults to today.' })
  @ApiResponse({ status: 200, description: 'The looked-up rate.' })
  @ApiResponse({ status: 503, description: 'Rate is not cached and the upstream provider is unreachable.' })
  async getRate(
    @Query('from') from: Currency,
    @Query('to') to: Currency,
    @Query('date') date?: string,
  ): Promise<{ from: Currency; to: Currency; date: string; rate: number }> {
    if (!Object.values(Currency).includes(from) || !Object.values(Currency).includes(to)) {
      throw new BadRequestException('Unsupported currency');
    }
    const d = date ? new Date(date) : new Date();
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException('Invalid date');
    }
    const rate = await this.forexService.getRate(from, to, d);
    return { from, to, date: d.toISOString().split('T')[0], rate };
  }

  @UseGuards(AuthGuard)
  @Post('backfill')
  @ApiOperation({
    summary: 'Fill the FX rate cache for the configured lookback window',
    description:
      'For every ledger base currency, pre-fetches and persists rates against every account currency for the last `lookbackDays` days (default 365). Idempotent — already-cached dates are skipped. Useful after adding a new account in a new currency, or to seed a fresh deployment.',
  })
  @ApiBody({ type: BackfillForexDto, required: false })
  @ApiResponse({ status: 201, description: 'Backfill summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async backfill(@Body() body?: BackfillForexDto) {
    return this.forexService.backfillCache(body?.lookbackDays);
  }
}
