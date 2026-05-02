import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dtos/create-category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('v1/categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all categories for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  findAll(@Req() req: Request) {
    return this.categoriesService.findAll(req['context']);
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, description: 'Category created' })
  create(@Req() req: Request, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(req['context'], dto.name);
  }
}
