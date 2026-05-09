import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Category {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private http = inject(HttpClient);

  categories = signal<Category[]>([]);

  async fetchCategories(): Promise<void> {
    const cats = await firstValueFrom(
      this.http.get<Category[]>(`${environment.apiUrl}/v1/categories`),
    );
    this.categories.set(cats);
  }

  async createCategory(name: string): Promise<Category> {
    const cat = await firstValueFrom(
      this.http.post<Category>(`${environment.apiUrl}/v1/categories`, { name }),
    );
    this.categories.update((cats) => [...cats, cat]);
    return cat;
  }

  async updateCategory(id: string, name: string): Promise<void> {
    await firstValueFrom(
      this.http.patch(`${environment.apiUrl}/v1/categories/${id}`, { name }),
    );
    this.categories.update((cats) =>
      cats.map((c) => (c.id === id ? { ...c, name } : c)),
    );
  }
}
