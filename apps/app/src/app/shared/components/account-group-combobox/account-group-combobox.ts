import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountGroup, AccountGroupsService } from '../../../services/account-groups.service';

let comboboxCounter = 0;

@Component({
  selector: 'app-account-group-combobox',
  templateUrl: './account-group-combobox.html',
  imports: [FormsModule, TranslateModule],
})
export class AccountGroupComboboxComponent implements OnInit {
  value = input<string>('');
  label = input<string>('');
  placeholder = input<string>('');

  valueChange = output<string>();
  accountGroupCreated = output<AccountGroup>();

  private accountGroupsService = inject(AccountGroupsService);

  readonly id = ++comboboxCounter;
  readonly inputId = `combobox-input-${this.id}`;
  readonly listboxId = `combobox-list-${this.id}`;

  searchText = '';
  showDropdown = signal(false);
  filtered = signal<AccountGroup[]>([]);
  creating = signal(false);
  activeIndex = signal(-1);

  get canCreate(): boolean {
    return (
      !!this.searchText &&
      !this.accountGroupsService.accountGroups().some((g) => g.name.toLowerCase() === this.searchText.toLowerCase())
    );
  }

  ngOnInit(): void {
    if (this.value()) {
      const group = this.accountGroupsService.accountGroups().find((g) => g.id === this.value());
      if (group) {
        this.searchText = group.name;
      }
    }
    this.filtered.set(this.accountGroupsService.accountGroups());
  }

  onSearch(text: string): void {
    const lower = text.toLowerCase();
    this.filtered.set(this.accountGroupsService.accountGroups().filter((g) => g.name.toLowerCase().includes(lower)));
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
    const groups = this.filtered();

    if (event.key === 'Escape') {
      this.showDropdown.set(false);
      event.preventDefault();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((i) => Math.min(i + 1, groups.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.activeIndex();
      if (idx >= 0 && idx < groups.length) {
        this.selectAccountGroup(groups[idx]);
      } else if (this.canCreate) {
        this.createAccountGroup();
      }
    }
  }

  selectAccountGroup(group: AccountGroup): void {
    this.searchText = group.name;
    this.showDropdown.set(false);
    this.valueChange.emit(group.id);
  }

  async createAccountGroup(): Promise<void> {
    if (!this.searchText || this.creating()) {
      return;
    }
    this.creating.set(true);
    try {
      const group = await this.accountGroupsService.createAccountGroup({ name: this.searchText });
      this.accountGroupCreated.emit(group);
      this.selectAccountGroup(group);
    } finally {
      this.creating.set(false);
    }
  }
}
