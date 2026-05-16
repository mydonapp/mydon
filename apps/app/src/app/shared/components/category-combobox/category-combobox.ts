import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CategoriesService, Category } from '../../../services/categories.service';

let comboboxCounter = 0;

@Component({
  selector: 'app-category-combobox',
  templateUrl: './category-combobox.html',
  imports: [FormsModule, TranslateModule],
})
export class CategoryComboboxComponent implements OnInit {
  value = input<string>('');
  label = input<string>('');
  placeholder = input<string>('');

  valueChange = output<string>();
  categoryCreated = output<Category>();

  private categoriesService = inject(CategoriesService);

  readonly id = ++comboboxCounter;
  readonly inputId = `combobox-input-${this.id}`;
  readonly listboxId = `combobox-list-${this.id}`;

  searchText = '';
  showDropdown = signal(false);
  filtered = signal<Category[]>([]);
  creating = signal(false);
  activeIndex = signal(-1);

  get canCreate(): boolean {
    return (
      !!this.searchText &&
      !this.categoriesService.categories().some((c) => c.name.toLowerCase() === this.searchText.toLowerCase())
    );
  }

  ngOnInit(): void {
    if (this.value()) {
      const cat = this.categoriesService.categories().find((c) => c.id === this.value());
      if (cat) {
        this.searchText = cat.name;
      }
    }
    this.filtered.set(this.categoriesService.categories());
  }

  onSearch(text: string): void {
    const lower = text.toLowerCase();
    this.filtered.set(this.categoriesService.categories().filter((c) => c.name.toLowerCase().includes(lower)));
    this.activeIndex.set(-1);
    this.showDropdown.set(true);
  }

  open(): void {
    this.showDropdown.set(true);
  }

  close(): void {
    setTimeout(() => this.showDropdown.set(false), 150);
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.showDropdown()) {
      return;
    }
    const cats = this.filtered();

    if (event.key === 'Escape') {
      this.showDropdown.set(false);
      event.preventDefault();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((i) => Math.min(i + 1, cats.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.activeIndex();
      if (idx >= 0 && idx < cats.length) {
        this.selectCategory(cats[idx]);
      } else if (this.canCreate) {
        this.createCategory();
      }
    }
  }

  selectCategory(cat: Category): void {
    this.searchText = cat.name;
    this.showDropdown.set(false);
    this.valueChange.emit(cat.id);
  }

  async createCategory(): Promise<void> {
    if (!this.searchText || this.creating()) {
      return;
    }
    this.creating.set(true);
    try {
      const cat = await this.categoriesService.createCategory(this.searchText);
      this.categoryCreated.emit(cat);
      this.selectCategory(cat);
    } finally {
      this.creating.set(false);
    }
  }
}
