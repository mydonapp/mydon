import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CategoriesController } from './categories.controller';
import { Category } from './categories.entity';
import { CategoriesService } from './categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), AuthModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService, TypeOrmModule],
})
export class CategoriesModule {}
