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
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { ForexService } from '../shared/forex/forex.service';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { ImportStatementDto } from './dtos/import-statenment.dto';
import { PatchTransactionDto } from './dtos/patch-transaction.dto';
import { TransactionsService } from './transactions.service';

@Controller()
export class TransactionsController {
  constructor(
    private transactionsService: TransactionsService,
    private forexService: ForexService
  ) {}

  @UseGuards(AuthGuard)
  @Get('v1/transactions')
  async findAll(@Req() req: Request, @Query('filter') filter: string) {
    const result = await this.transactionsService.findAll(
      req['context'],
      filter
    );

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

  @UseGuards(AuthGuard)
  @Post('v1/transactions')
  createTransaction(
    @Req() req: Request,
    @Body() createTransactionDto: CreateTransactionDto
  ) {
    return this.transactionsService.createTransaction(req['context'], {
      creditAmount: createTransactionDto.creditAmount,
      debitAmount: createTransactionDto.debitAmount,
      creditAccountId: createTransactionDto.creditAccountId,
      debitAccountId: createTransactionDto.debitAccountId,
      transactionDate: createTransactionDto.transactionDate,
      description: createTransactionDto.description,
    });
  }

  @UseGuards(AuthGuard)
  @Patch('v1/transactions/:id')
  patchTransaction(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() patchTransactionDto: PatchTransactionDto
  ) {
    return this.transactionsService.patchTransaction(req['context'], id, {
      creditAmount: patchTransactionDto.creditAmount,
      debitAmount: patchTransactionDto.debitAmount,
      creditAccountId: patchTransactionDto.creditAccountId,
      debitAccountId: patchTransactionDto.debitAccountId,
      draft: patchTransactionDto.draft,
      description: patchTransactionDto.description,
    });
  }

  @UseGuards(AuthGuard)
  @Delete('v1/transactions/:id')
  deleteTransaction(@Req() req: Request, @Param('id') id: string) {
    return this.transactionsService.deleteTransaction(req['context'], id);
  }

  @UseGuards(AuthGuard)
  @Post('v1/statements/import')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req: Request,
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
      req['context'],
      file.buffer.toString(),
      body.statementIssuer,
      body.accountId
    );
  }

  @UseGuards(AuthGuard)
  @Get('v1/currency/convert')
  convertAmount(
    @Req() req: Request,
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
