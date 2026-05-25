import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { Context } from '../shared/types/context';
import { ClosingsService } from './closings.service';
import { CloseFiscalYearDto } from './dtos/close-fiscal-year.dto';

@ApiTags('closings')
@ApiBearerAuth()
@Controller('v1/closings')
export class ClosingsController {
  constructor(private closingsService: ClosingsService) {}

  @UseGuards(AuthGuard)
  @Get('candidates')
  @ApiOperation({ summary: 'List completed fiscal years available to close (newest first)' })
  @ApiResponse({ status: 200, description: 'Closable fiscal years with their closed/state flags' })
  candidates(@Req() req: Request) {
    return this.closingsService.listClosableYears(req['context'] as Context);
  }

  @UseGuards(AuthGuard)
  @Post('preview')
  @ApiOperation({ summary: 'Preview the closing entries that would be posted for a fiscal year' })
  @ApiBody({ type: CloseFiscalYearDto })
  @ApiResponse({ status: 200, description: 'Closing preview' })
  preview(@Req() req: Request, @Body() dto: CloseFiscalYearDto) {
    return this.closingsService.preview(req['context'] as Context, dto.fiscalYearStartYear);
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiOperation({ summary: 'Run the year-end close: posts a single balanced transaction sweeping income/expense into retained earnings' })
  @ApiBody({ type: CloseFiscalYearDto })
  @ApiResponse({ status: 201, description: 'The posted closing transaction' })
  @ApiResponse({ status: 409, description: 'Fiscal year is already closed' })
  close(@Req() req: Request, @Body() dto: CloseFiscalYearDto) {
    return this.closingsService.closeFiscalYear(req['context'] as Context, dto.fiscalYearStartYear);
  }
}
