import {
  Body,
  Controller,
  Get,
  Param,
  ParseDatePipe,
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

@ApiTags('accounts')
@ApiBearerAuth()
@Controller('v1/accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @UseGuards(AuthGuard)
  @Get('')
  @ApiOperation({ summary: 'Get all accounts for the authenticated user' })
  @ApiQuery({ name: 'from', type: Date, required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'to', type: Date, required: false, description: 'Filter to date' })
  @ApiResponse({ status: 200, description: 'List of accounts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Req() req: Request,
    @Query('from', new ParseDatePipe({ optional: true })) from?: Date,
    @Query('to', new ParseDatePipe({ optional: true })) to?: Date
  ) {
    const result = await this.accountsService.findAllGroupedByAccountType(
      req['context'],
      {
        filter: { from, to },
      }
    );
    return result;
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
    @Body() createAccountDto: CreateAccountDto
  ) {
    return this.accountsService.createAccount(req['context'], {
      name: createAccountDto.name,
      type: createAccountDto.type,
      openingBalance: createAccountDto.openingBalance,
    });
  }

  @UseGuards(AuthGuard)
  @Get(':accountId')
  @ApiOperation({ summary: 'Get account details by ID' })
  @ApiParam({ name: 'accountId', description: 'Account ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Account details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAccountTransactions(
    @Req() req: Request,
    @Param('accountId') accountId: string
  ) {
    return this.accountsService.getAccount(req['context'], accountId);
  }
}
