import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dtos/create-budget.dto';
import { UpsertBudgetItemsDto } from './dtos/upsert-budget-items.dto';

@ApiTags('budgets')
@ApiBearerAuth()
@Controller('v1/budgets')
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: 'List all budgets' })
  findAll(@Req() req: Request) {
    return this.budgetsService.findAll(req['context']);
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a budget' })
  @ApiBody({ type: CreateBudgetDto })
  @ApiResponse({ status: 201 })
  create(@Req() req: Request, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(req['context'], dto.name, dto.year);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get a budget with its items' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.budgetsService.findOne(id, req['context']);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update budget name or year' })
  @ApiParam({ name: 'id', type: 'string' })
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: Partial<CreateBudgetDto>) {
    return this.budgetsService.update(id, req['context'], dto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a budget' })
  @ApiParam({ name: 'id', type: 'string' })
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.budgetsService.remove(id, req['context']);
  }

  @UseGuards(AuthGuard)
  @Put(':id/items')
  @ApiOperation({ summary: 'Replace all budget items' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpsertBudgetItemsDto })
  upsertItems(@Req() req: Request, @Param('id') id: string, @Body() dto: UpsertBudgetItemsDto) {
    return this.budgetsService.upsertItems(id, req['context'], dto.items);
  }

  @UseGuards(AuthGuard)
  @Get(':id/progress')
  @ApiOperation({ summary: 'Get budget progress with actuals vs targets' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'year', type: Number, required: true })
  @ApiQuery({ name: 'month', type: Number, required: false })
  getProgress(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('year') year: string,
    @Query('month') month?: string,
  ) {
    return this.budgetsService.getProgress(
      id,
      req['context'],
      parseInt(year, 10),
      month ? parseInt(month, 10) : undefined,
    );
  }
}
