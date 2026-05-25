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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { Currency } from '../shared/currency';
import { ForexService } from '../shared/forex/forex.service';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { ImportStatementDto } from './dtos/import-statenment.dto';
import { PatchTransactionDto } from './dtos/patch-transaction.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller()
export class TransactionsController {
  constructor(
    private transactionsService: TransactionsService,
    private forexService: ForexService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('v1/transactions/issuers')
  getIssuers() {
    return [
      { id: 'POSTFINANCE', name: 'PostFinance' },
      { id: 'SWISSCARD', name: 'Swisscard' },
      { id: 'WISE', name: 'Wise' },
      { id: 'YUH', name: 'Yuh' },
    ];
  }

  @UseGuards(AuthGuard)
  @Get('v1/transactions')
  async findAll(@Req() req: Request, @Query('filter') filter: string) {
    return this.transactionsService.findAll(req['context'], filter);
  }

  @UseGuards(AuthGuard)
  @Post('v1/transactions')
  createTransaction(@Req() req: Request, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.createTransaction(req['context'], {
      description: dto.description,
      reference: dto.reference,
      transactionDate: dto.transactionDate,
      entries: dto.entries,
      post: dto.post,
    });
  }

  @UseGuards(AuthGuard)
  @Patch('v1/transactions/:id')
  patchTransaction(@Req() req: Request, @Param('id') id: string, @Body() dto: PatchTransactionDto) {
    return this.transactionsService.patchTransaction(req['context'], id, {
      description: dto.description,
      reference: dto.reference,
      transactionDate: dto.transactionDate,
      entries: dto.entries,
    });
  }

  @UseGuards(AuthGuard)
  @Post('v1/transactions/:id/post')
  postTransaction(@Req() req: Request, @Param('id') id: string) {
    return this.transactionsService.postTransaction(req['context'], id);
  }

  @UseGuards(AuthGuard)
  @Post('v1/transactions/:id/reverse')
  reverseTransaction(@Req() req: Request, @Param('id') id: string) {
    return this.transactionsService.reverseTransaction(req['context'], id);
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
          skipMagicNumbersValidation: true,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @Body() body: ImportStatementDto,
  ) {
    return this.transactionsService.importStatement(
      req['context'],
      file.buffer.toString(),
      body.statementIssuer,
      body.accountId,
    );
  }

  @UseGuards(AuthGuard)
  @Get('v1/currency/convert')
  convertAmount(@Req() req: Request, @Query() query: { amount: number; from: Currency; to: Currency; date: string }) {
    return this.forexService.convertCurrency(query.amount, query.from, query.to, new Date(query.date));
  }
}
