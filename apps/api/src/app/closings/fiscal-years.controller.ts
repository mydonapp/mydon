import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { Context } from '../shared/types/context';
import { CloseFiscalYearDto } from './dtos/close-fiscal-year.dto';
import { FiscalYearsService } from './fiscal-years.service';

@ApiTags('fiscal-years')
@ApiBearerAuth()
@Controller('v1/fiscal-years')
export class FiscalYearsController {
  constructor(private fiscalYearsService: FiscalYearsService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: 'List fiscal years for the current ledger with their close state' })
  list(@Req() req: Request) {
    return this.fiscalYearsService.listForCurrentLedger(req['context'] as Context);
  }

  @UseGuards(AuthGuard)
  @Post('initiate-close')
  @ApiOperation({ summary: 'Start the advanced close workflow: generates a draft closing transaction for review' })
  @ApiBody({ type: CloseFiscalYearDto })
  @ApiResponse({ status: 201, description: 'The fiscal year (now in CLOSING) + the draft closing transaction' })
  initiateClose(@Req() req: Request, @Body() dto: CloseFiscalYearDto) {
    return this.fiscalYearsService.initiateClose(req['context'] as Context, dto.fiscalYearStartYear);
  }

  @UseGuards(AuthGuard)
  @Post(':id/seal')
  @ApiOperation({ summary: 'Post the draft and lock the period' })
  @ApiParam({ name: 'id', type: 'string' })
  seal(@Req() req: Request, @Param('id') id: string) {
    return this.fiscalYearsService.seal(req['context'] as Context, id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Abandon the close: delete the draft and return the fiscal year to OPEN' })
  @ApiParam({ name: 'id', type: 'string' })
  cancel(@Req() req: Request, @Param('id') id: string) {
    return this.fiscalYearsService.cancelClose(req['context'] as Context, id);
  }
}
