import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Context } from '../shared/types/context';
import { Category } from './categories.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  findAll(context: Context): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { user: { id: context.user.id } },
      order: { name: 'ASC' },
    });
  }

  create(context: Context, name: string): Promise<Category> {
    const category = new Category();
    category.name = name;
    category.user = { id: context.user.id } as any;
    return this.categoriesRepository.save(category);
  }
}
