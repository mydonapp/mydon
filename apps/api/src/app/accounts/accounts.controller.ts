import {
  Body,
  Controller,
  Get,
  Param,
  ParseDatePipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dtos/create-account.dto';
import { UpdateAccountDto } from './dtos/update-account.dto';

@ApiTags('accounts')
@ApiBearerAuth()
@Controller('v1/accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @UseGuards(AuthGuard)
  @Get('')
  @ApiOperation({ summary: 'Get all accounts for the authenticated user' })
  @ApiQuery({ name: 'from', type: Date, required: false })
  @ApiQuery({ name: 'to', type: Date, required: false })
  @ApiQuery({ name: 'list', type: Boolean, required: false, description: 'Return flat list including inactive accounts' })
  @ApiResponse({ status: 200, description: 'List of accounts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Req() req: Request,
    @Query('from', new ParseDatePipe({ optional: true })) from?: Date,
    @Query('to', new ParseDatePipe({ optional: true })) to?: Date,
    @Query('list') list?: string,
  ) {
    if (list === 'true') {
      return this.accountsService.findAllSimple(req['context']);
    }
    return this.accountsService.findAllGroupedByAccountType(req['context'], {
      filter: { from, to },
    });
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createAccount(
    @Req() req: Request,
    @Body() createAccountDto: CreateAccountDto,
  ) {
    return this.accountsService.createAccount(req['context'], {
      name: createAccountDto.name,
      type: createAccountDto.type,
      openingBalance: createAccountDto.openingBalance,
      currency: createAccountDto.currency,
      categoryId: createAccountDto.categoryId,
    });
  }

  @UseGuards(AuthGuard)
  @Patch(':accountId')
  @ApiOperation({ summary: 'Update an account' })
  @ApiParam({ name: 'accountId', type: 'string' })
  @ApiBody({ type: UpdateAccountDto })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  updateAccount(
    @Req() req: Request,
    @Param('accountId') accountId: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.updateAccount(req['context'], accountId, {
      name: dto.name,
      categoryId: dto.categoryId,
      isActive: dto.isActive,
    });
  }

  @UseGuards(AuthGuard)
  @Get(':accountId')
  @ApiOperation({ summary: 'Get account details by ID' })
  @ApiParam({ name: 'accountId', description: 'Account ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Account details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAccountTransactions(
    @Req() req: Request,
    @Param('accountId') accountId: string,
  ) {
    return this.accountsService.getAccount(req['context'], accountId);
  }
}
