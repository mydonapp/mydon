import { ChangeDetectionStrategy, Component, input, output, signal, ViewChild, ElementRef, inject } from '@angular/core';
import { IconComponent } from '../icon/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-file-upload',
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.css',
  imports: [IconComponent],
  host: {
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class FileUploadComponent {
  private elementRef = inject(ElementRef);

  accept = input('');
  value = input<File | null>(null);
  fileChange = output<File | null>();

  isDragging = signal(false);

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  openPicker() {
    this.fileInputRef.nativeElement.click();
  }

  onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.fileChange.emit(input.files?.[0] ?? null);
  }

  clear(event: MouseEvent) {
    event.stopPropagation();
    this.fileInputRef.nativeElement.value = '';
    this.fileChange.emit(null);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent) {
    if (!(this.elementRef.nativeElement as HTMLElement).contains(e.relatedTarget as Node)) {
      this.isDragging.set(false);
    }
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      this.fileChange.emit(file);
    }
  }
}
