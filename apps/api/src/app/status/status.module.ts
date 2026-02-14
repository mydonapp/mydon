import { Module } from '@nestjs/common';
import { StatusController } from './status.controller';

@Module({
  controllers: [StatusController],
  providers: [],
  imports: [],
})
export class StatusModule {}
