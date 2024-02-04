import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { ImportStatementDto } from './dtos/import-statenment.dto';
import { PatchTransactionDto } from './dtos/patch-transaction.dto';
import { TransactionsService } from './transactions.service';
import { ForexService } from '../shared/forex/forex.service';

@Controller()
export class TransactionsController {
  constructor(
    private transactionsService: TransactionsService,
    private forexService: ForexService
  ) {}

  @Get('v1/transactions')
  async findAll(@Query('filter') filter: string) {
    const result = await this.transactionsService.findAll(filter);

    return result.map((transaction) => {
      return {
        id: transaction.id,
        creditAmount: transaction.creditAmount,
        debitAmount: transaction.debitAmount,
        description: transaction.description,
        creditAccountId: transaction.creditAccount,
        debitAccountId: transaction.debitAccount,
        transactionDate: transaction.transactionDate,
        draft: transaction.draft,
      };
    });
  }

  @Post('v1/transactions')
  createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.createTransaction({
      creditAmount: createTransactionDto.creditAmount,
      debitAmount: createTransactionDto.debitAmount,
      creditAccountId: createTransactionDto.creditAccountId,
      debitAccountId: createTransactionDto.debitAccountId,
      transactionDate: createTransactionDto.transactionDate,
      description: createTransactionDto.description,
    });
  }
  x;

  @Patch('v1/transactions/:id')
  patchTransaction(
    @Param('id') id: string,
    @Body() patchTransactionDto: PatchTransactionDto
  ) {
    return this.transactionsService.patchTransaction(id, {
      creditAmount: patchTransactionDto.creditAmount,
      debitAmount: patchTransactionDto.debitAmount,
      creditAccountId: patchTransactionDto.creditAccountId,
      debitAccountId: patchTransactionDto.debitAccountId,
      draft: patchTransactionDto.draft,
      description: patchTransactionDto.description,
    });
  }

  @Delete('v1/transactions/:id')
  deleteTransaction(@Param('id') id: string) {
    return this.transactionsService.deleteTransaction(id);
  }

  @Post('v1/statements/import')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'csv',
        })
        // .addMaxSizeValidator({
        //   maxSize: 1000,
        // })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        })
    )
    file: Express.Multer.File,
    @Body() body: ImportStatementDto
  ) {
    return this.transactionsService.importStatement(
      file.buffer.toString(),
      body.statementIssuer,
      body.accountId
    );
  }

  @Get('v1/currency/convert')
  convertAmount(
    @Query() query: { amount: number; from: string; to: string; date: string }
  ) {
    return this.forexService.convertCurrency(
      query.amount,
      query.from,
      query.to,
      new Date(query.date)
    );
  }
}
