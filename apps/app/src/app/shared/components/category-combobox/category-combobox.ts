import {
  Component,
  input,
  output,
  signal,
  inject,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CategoriesService, Category } from '../../../services/categories.service';

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

  searchText = '';
  showDropdown = signal(false);
  filtered = signal<Category[]>([]);
  creating = signal(false);

  get canCreate(): () => boolean {
    return () =>
      !!this.searchText &&
      !this.categoriesService
        .categories()
        .some(
          (c) => c.name.toLowerCase() === this.searchText.toLowerCase(),
        );
  }

  ngOnInit() {
    if (this.value()) {
      const cat = this.categoriesService
        .categories()
        .find((c) => c.id === this.value());
      if (cat) this.searchText = cat.name;
    }
    this.filtered.set(this.categoriesService.categories());
  }

  onSearch(text: string) {
    const lower = text.toLowerCase();
    this.filtered.set(
      this.categoriesService
        .categories()
        .filter((c) => c.name.toLowerCase().includes(lower)),
    );
    this.showDropdown.set(true);
  }

  selectCategory(cat: Category) {
    this.searchText = cat.name;
    this.showDropdown.set(false);
    this.valueChange.emit(cat.id);
  }

  async createCategory() {
    if (!this.searchText || this.creating()) return;
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
