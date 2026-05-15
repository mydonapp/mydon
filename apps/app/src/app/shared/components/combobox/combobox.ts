import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon';

export interface ComboboxOption {
  value: string;
  label: string;
  subtitle?: string;
}

let counter = 0;

@Component({
  selector: 'app-combobox',
  templateUrl: './combobox.html',
  styleUrl: './combobox.css',
  imports: [FormsModule, IconComponent],
})
export class ComboboxComponent {
  private el = inject(ElementRef);

  options     = input<ComboboxOption[]>([]);
  value       = input<string>('');
  placeholder = input<string>('Select…');
  disabled    = input<boolean>(false);

  valueChange = output<string>();

  readonly listboxId = `combobox-list-${++counter}`;

  isOpen      = signal(false);
  query       = signal('');
  activeIndex = signal(-1);
  dropdownPos = signal<{ top: number; left: number; width: number } | null>(null);

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('trigger')     triggerRef!: ElementRef<HTMLButtonElement>;

  selectedLabel = computed(() =>
    this.options().find(o => o.value === this.value())?.label ?? '',
  );

  filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    return q
      ? this.options().filter(o => o.label.toLowerCase().includes(q))
      : this.options();
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!this.el.nativeElement.contains(e.target)) {
      this.close();
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onScrollOrResize() {
    if (this.isOpen()) this.close();
  }

  toggle() {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    const rect = this.triggerRef.nativeElement.getBoundingClientRect();
    this.dropdownPos.set({ top: rect.bottom + 5, left: rect.left, width: rect.width });
    this.isOpen.set(true);
    this.query.set('');
    this.activeIndex.set(-1);
    setTimeout(() => this.searchInputRef?.nativeElement.focus(), 0);
  }

  close() {
    this.isOpen.set(false);
    this.dropdownPos.set(null);
    this.query.set('');
    this.activeIndex.set(-1);
  }

  onKeydown(e: KeyboardEvent) {
    const opts = this.filtered();
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.activeIndex.update(i => Math.min(i + 1, opts.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.activeIndex.update(i => Math.max(i - 1, 0));
        break;
      case 'Enter': {
        e.preventDefault();
        const idx = this.activeIndex();
        if (idx >= 0 && idx < opts.length) this.select(opts[idx]);
        break;
      }
    }
  }

  onTriggerKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this.isOpen()) this.open();
    }
  }

  select(opt: ComboboxOption) {
    this.valueChange.emit(opt.value);
    this.close();
  }
}
