import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('v1/status')
export class StatusController {
  @Get()
  @HttpCode(HttpStatus.OK)
  async sendOK() {
    return;
  }
}
