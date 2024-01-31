import {
  Body,
  Controller,
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
import { parse } from 'csv-parse/sync';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { ImportStatementDto } from './dtos/import-statenment.dto';
import { PatchTransactionDto } from './dtos/patch-transaction.dto';
import { TransactionsService } from './transactions.service';

@Controller()
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get('v1/transactions')
  async findAll(@Query('filter') filter: string) {
    const result = await this.transactionsService.findAll(filter);

    return result.map((transaction) => {
      return {
        id: transaction.id,
        amount: transaction.amount,
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
      amount: createTransactionDto.amount,
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
      amount: patchTransactionDto.amount,
      creditAccountId: patchTransactionDto.creditAccountId,
      debitAccountId: patchTransactionDto.debitAccountId,
      draft: patchTransactionDto.draft,
      description: patchTransactionDto.description,
    });
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
    const rawRecords = await parse(file.buffer.toString(), {
      cast: true,
      columns: true,
      skip_empty_lines: true,
      bom: true,
    });
    return this.transactionsService.importStatement(
      rawRecords,
      body.statementIssuer,
      body.accountId
    );
  }
}
