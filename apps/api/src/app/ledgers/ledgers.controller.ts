import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { Context } from '../shared/types/context';
import { LedgersService } from './ledgers.service';

@ApiTags('ledgers')
@ApiBearerAuth()
@Controller('v1/ledger')
export class LedgersController {
  constructor(private ledgersService: LedgersService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: "Get the current user's default ledger" })
  @ApiResponse({ status: 200, description: 'The default ledger (id, name, base currency)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDefault(@Req() req: Request) {
    const context = req['context'] as Context;
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    return { id: ledger.id, name: ledger.name, baseCurrency: ledger.baseCurrency };
  }
}
