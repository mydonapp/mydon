import { Combobox, ComboboxInput, ComboboxPopupContainer } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  afterRenderEffect,
  computed,
  input,
  linkedSignal,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { IconComponent } from '../icon/icon';

export interface ComboboxOption {
  value: string;
  label: string;
  subtitle?: string;
}

@Component({
  selector: 'app-combobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './combobox.html',
  styleUrl: './combobox.css',
  imports: [Combobox, ComboboxInput, ComboboxPopupContainer, Listbox, Option, OverlayModule, IconComponent],
})
export class ComboboxComponent {
  readonly options = input<ComboboxOption[]>([]);
  readonly value = input<string>('');
  readonly placeholder = input<string>('Select…');
  readonly disabled = input<boolean>(false);

  readonly valueChange = output<string>();

  private readonly selectedLabel = computed(() => this.options().find((o) => o.value === this.value())?.label ?? '');

  /** Input text: tracks the selected label, but the user can overwrite it to filter — and it resets
   *  to the label whenever the selection changes (linkedSignal). */
  readonly query = linkedSignal(() => this.selectedLabel());

  /** Aria's listbox works in arrays; a single selection carries 0 or 1 value. */
  readonly selectedValues = computed(() => (this.value() ? [this.value()] : []));

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.options().filter((o) => o.label.toLowerCase().includes(q)) : this.options();
  });

  private readonly comboboxRef = viewChild(Combobox);
  private readonly listboxRef = viewChild(Listbox);
  private readonly optionRefs = viewChildren(Option);

  constructor() {
    // Keep the keyboard-active option scrolled into view, and reset the list to the top when it closes
    // (per the Angular Aria autocomplete guidance).
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

  onValuesChange(values: string[]) {
    const next = values.at(-1) ?? '';
    if (next && next !== this.value()) {
      this.valueChange.emit(next);
    }
  }
}
