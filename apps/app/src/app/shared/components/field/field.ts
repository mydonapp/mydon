import { Component, AfterContentInit, input, computed, contentChild } from '@angular/core';
import { FIELD_TOKEN } from '../../directives/field.token';
import { InputDirective } from '../../directives/input.directive';
import { SelectDirective } from '../../directives/select.directive';

let fieldCounter = 0;

@Component({
  selector: 'app-field',
  templateUrl: './field.html',
  providers: [{ provide: FIELD_TOKEN, useExisting: FieldComponent }],
})
export class FieldComponent implements AfterContentInit {
  readonly fieldId = `field-${++fieldCounter}`;

  label = input('');
  error = input('');
  helpText = input('');
  required = input(false);

  readonly hasError = computed(() => !!this.error());

  private readonly inputDir = contentChild(InputDirective);
  private readonly selectDir = contentChild(SelectDirective);

  ngAfterContentInit(): void {
    const el = this.inputDir()?.el.nativeElement ?? this.selectDir()?.el.nativeElement;
    if (el && !el.id) {
      el.id = this.fieldId;
    }
  }
}
