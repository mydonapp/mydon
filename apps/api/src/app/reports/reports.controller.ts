import { Controller, Get, ParseDatePipe, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('v1/reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @UseGuards(AuthGuard)
  @Get('trial-balance')
  @ApiOperation({ summary: 'Trial balance for the period (all amounts in the ledger base currency)' })
  @ApiQuery({ name: 'from', type: Date, required: false })
  @ApiQuery({ name: 'to', type: Date, required: false })
  @ApiResponse({ status: 200, description: 'Trial balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  trialBalance(
    @Req() req: Request,
    @Query('from', new ParseDatePipe({ optional: true })) from?: Date,
    @Query('to', new ParseDatePipe({ optional: true })) to?: Date,
  ) {
    return this.reportsService.getTrialBalance(req['context'], { from, to });
  }

  @UseGuards(AuthGuard)
  @Get('balance-sheet')
  @ApiOperation({ summary: 'Balance sheet as of the period end (ledger base currency)' })
  @ApiQuery({ name: 'from', type: Date, required: false })
  @ApiQuery({ name: 'to', type: Date, required: false })
  @ApiResponse({ status: 200, description: 'Balance sheet' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  balanceSheet(
    @Req() req: Request,
    @Query('from', new ParseDatePipe({ optional: true })) from?: Date,
    @Query('to', new ParseDatePipe({ optional: true })) to?: Date,
  ) {
    return this.reportsService.getBalanceSheet(req['context'], { from, to });
  }

  @UseGuards(AuthGuard)
  @Get('income-statement')
  @ApiOperation({ summary: 'Income statement (P&L) for the period with a year-over-year comparison' })
  @ApiQuery({ name: 'from', type: Date, required: false })
  @ApiQuery({ name: 'to', type: Date, required: false })
  @ApiResponse({ status: 200, description: 'Income statement' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  incomeStatement(
    @Req() req: Request,
    @Query('from', new ParseDatePipe({ optional: true })) from?: Date,
    @Query('to', new ParseDatePipe({ optional: true })) to?: Date,
  ) {
    return this.reportsService.getIncomeStatement(req['context'], { from, to });
  }

  @UseGuards(AuthGuard)
  @Get('income-statement/pdf')
  @ApiOperation({ summary: 'Income statement as a formatted PDF report' })
  @ApiQuery({ name: 'from', type: Date, required: false })
  @ApiQuery({ name: 'to', type: Date, required: false })
  @ApiResponse({ status: 200, description: 'PDF document' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async incomeStatementPdf(
    @Req() req: Request,
    @Res() res: Response,
    @Query('from', new ParseDatePipe({ optional: true })) from?: Date,
    @Query('to', new ParseDatePipe({ optional: true })) to?: Date,
  ) {
    const pdf = await this.reportsService.buildIncomeStatementPdf(req['context'], { from, to });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${this.filename('income-statement', from)}"`);
    res.send(pdf);
  }

  @UseGuards(AuthGuard)
  @Get('trial-balance/pdf')
  @ApiOperation({ summary: 'Trial balance as a formatted PDF report' })
  @ApiQuery({ name: 'from', type: Date, required: false })
  @ApiQuery({ name: 'to', type: Date, required: false })
  @ApiResponse({ status: 200, description: 'PDF document' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async trialBalancePdf(
    @Req() req: Request,
    @Res() res: Response,
    @Query('from', new ParseDatePipe({ optional: true })) from?: Date,
    @Query('to', new ParseDatePipe({ optional: true })) to?: Date,
  ) {
    const pdf = await this.reportsService.buildTrialBalancePdf(req['context'], { from, to });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${this.filename('trial-balance', from)}"`);
    res.send(pdf);
  }

  @UseGuards(AuthGuard)
  @Get('balance-sheet/pdf')
  @ApiOperation({ summary: 'Balance sheet as a formatted PDF report' })
  @ApiQuery({ name: 'from', type: Date, required: false })
  @ApiQuery({ name: 'to', type: Date, required: false })
  @ApiResponse({ status: 200, description: 'PDF document' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async balanceSheetPdf(
    @Req() req: Request,
    @Res() res: Response,
    @Query('from', new ParseDatePipe({ optional: true })) from?: Date,
    @Query('to', new ParseDatePipe({ optional: true })) to?: Date,
  ) {
    const pdf = await this.reportsService.buildBalanceSheetPdf(req['context'], { from, to });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${this.filename('balance-sheet', from)}"`);
    res.send(pdf);
  }

  private filename(report: string, from?: Date): string {
    return `${report}-${from ? from.getFullYear() : 'all-time'}.pdf`;
  }
}
