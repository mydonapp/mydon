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
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dtos/create-account.dto';

@Controller('v1/accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @UseGuards(AuthGuard)
  @Get('')
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
  getAccountTransactions(
    @Req() req: Request,
    @Param('accountId') accountId: string
  ) {
    return this.accountsService.getAccount(req['context'], accountId);
  }
}
