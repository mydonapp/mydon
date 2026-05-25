import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { Context } from '../shared/types/context';
import { UpdateLedgerDto } from './dtos/update-ledger.dto';
import { Ledger } from './ledger.entity';
import { LedgersService } from './ledgers.service';

function serialize(ledger: Ledger) {
  return {
    id: ledger.id,
    name: ledger.name,
    baseCurrency: ledger.baseCurrency,
    fiscalYearStartMonth: ledger.fiscalYearStartMonth,
    closingMode: ledger.closingMode,
    retainedEarningsAccountId: ledger.retainedEarningsAccountId,
  };
}

@ApiTags('ledgers')
@ApiBearerAuth()
@Controller('v1/ledger')
export class LedgersController {
  constructor(private ledgersService: LedgersService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: "Get the current user's default ledger" })
  @ApiResponse({ status: 200, description: 'The default ledger settings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDefault(@Req() req: Request) {
    const context = req['context'] as Context;
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    return serialize(ledger);
  }

  @UseGuards(AuthGuard)
  @Patch()
  @ApiOperation({ summary: "Update the current user's default ledger settings" })
  @ApiBody({ type: UpdateLedgerDto })
  @ApiResponse({ status: 200, description: 'The updated ledger' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(@Req() req: Request, @Body() dto: UpdateLedgerDto) {
    const context = req['context'] as Context;
    const ledger = await this.ledgersService.updateLedger(context.user.id, dto);
    return serialize(ledger);
  }
}
