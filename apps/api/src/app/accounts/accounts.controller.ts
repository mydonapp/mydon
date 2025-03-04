import {
  Body,
  Controller,
  Get,
  Param,
  ParseDatePipe,
  Post,
  Query,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dtos/create-account.dto';

@Controller('v1/accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get('')
  async findAll(
    @Query('from', new ParseDatePipe({ optional: true })) from?: Date,
    @Query('to', new ParseDatePipe({ optional: true })) to?: Date
  ) {
    const result = await this.accountsService.findAllGroupedByAccountType({
      filter: { from, to },
    });
    return result;
  }

  @Post()
  createAccount(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.createAccount({
      name: createAccountDto.name,
      type: createAccountDto.type,
      openingBalance: createAccountDto.openingBalance,
    });
  }

  @Get(':accountId')
  getAccountTransactions(@Param('accountId') accountId: string) {
    return this.accountsService.getAccount(accountId);
  }
}
