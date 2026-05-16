import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AccountGroupsService } from './account-groups.service';
import { CreateAccountGroupDto } from './dtos/create-account-group.dto';

@ApiTags('account-groups')
@ApiBearerAuth()
@Controller('v1/account-groups')
export class AccountGroupsController {
  constructor(private accountGroupsService: AccountGroupsService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all account groups for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of account groups' })
  findAll(@Req() req: Request) {
    return this.accountGroupsService.findAll(req['context']);
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new account group' })
  @ApiBody({ type: CreateAccountGroupDto })
  @ApiResponse({ status: 201, description: 'Account group created' })
  create(@Req() req: Request, @Body() dto: CreateAccountGroupDto) {
    return this.accountGroupsService.create(req['context'], dto);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an account group' })
  @ApiBody({ type: CreateAccountGroupDto })
  @ApiResponse({ status: 200, description: 'Account group updated' })
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: CreateAccountGroupDto) {
    return this.accountGroupsService.update(req['context'], id, dto);
  }
}
