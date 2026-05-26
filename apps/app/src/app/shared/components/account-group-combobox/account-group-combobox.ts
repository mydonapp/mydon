import { Combobox, ComboboxInput, ComboboxPopupContainer } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  afterRenderEffect,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AccountGroup, AccountGroupsService } from '../../../services/account-groups.service';

let counter = 0;

@Component({
  selector: 'app-account-group-combobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-group-combobox.html',
  styleUrl: './account-group-combobox.css',
  imports: [TranslateModule, Combobox, ComboboxInput, ComboboxPopupContainer, Listbox, Option, OverlayModule],
})
export class AccountGroupComboboxComponent {
  private readonly accountGroupsService = inject(AccountGroupsService);

  readonly value = input<string>('');
  readonly label = input<string>('');
  readonly placeholder = input<string>('');

  readonly valueChange = output<string>();
  readonly accountGroupCreated = output<AccountGroup>();

  readonly inputId = `agc-input-${++counter}`;

  private readonly groups = this.accountGroupsService.accountGroups;
  private readonly selectedName = computed(() => this.groups().find((g) => g.id === this.value())?.name ?? '');

  readonly query = linkedSignal(() => this.selectedName());
  readonly creating = signal(false);

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.groups().filter((g) => g.name.toLowerCase().includes(q)) : this.groups();
  });

  readonly selectedValues = computed(() => (this.value() ? [this.value()] : []));

  readonly canCreate = computed(() => {
    const q = this.query().trim();
    return !!q && !this.groups().some((g) => g.name.toLowerCase() === q.toLowerCase());
  });

  private readonly comboboxRef = viewChild(Combobox);
  private readonly listboxRef = viewChild(Listbox);
  private readonly optionRefs = viewChildren(Option);

  constructor() {
    afterRenderEffect(() => {
      const active = this.optionRefs().find((o) => o.active());
      active?.element.scrollIntoView({ block: 'nearest' });
    });
    afterRenderEffect(() => {
      if (!this.comboboxRef()?.expanded()) {
        this.listboxRef()?.element.scrollTo(0, 0);
      }
    });
  }

  onValuesChange(values: string[]): void {
    const next = values.at(-1) ?? '';
    if (next && next !== this.value()) {
      this.valueChange.emit(next);
    }
  }

  async createAccountGroup(): Promise<void> {
    const name = this.query().trim();
    if (!name || this.creating()) {
      return;
    }
    this.creating.set(true);
    try {
      const group = await this.accountGroupsService.createAccountGroup({ name });
      this.accountGroupCreated.emit(group);
      this.valueChange.emit(group.id);
    } finally {
      this.creating.set(false);
    }
  }
}
