import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { Context } from '../shared/types/context';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('v1/organizations')
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: "List the user's organizations with their ledgers (org/ledger switcher data)" })
  @ApiResponse({ status: 200, description: 'Organizations with ledgers' })
  list(@Req() req: Request) {
    return this.organizationsService.listForUser((req['context'] as Context).user.id);
  }
}
