import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface Calculation {
  readonly first: number;
  readonly second: number;
  readonly operation: '+' | '-' | '×' | '÷';
  readonly result: number;
}

@Component({
  selector: 'mova-calculator',
  standalone: true,
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.css',
})
export class CalculatorComponent {
  @Input() enabled = true;
  @Output() readonly calculated = new EventEmitter<Calculation>();

  first = 0;
  second = 0;
  error = '';

  setFirst(event: Event): void {
    this.first = Number((event.target as HTMLInputElement).value);
  }

  setSecond(event: Event): void {
    this.second = Number((event.target as HTMLInputElement).value);
  }

  calculate(operation: Calculation['operation']): void {
    if (!this.enabled) return;
    this.error = '';
    if (!Number.isFinite(this.first) || !Number.isFinite(this.second)) {
      this.error = 'Introduce dos números válidos.';
      return;
    }
    if (operation === '÷' && this.second === 0) {
      this.error = 'No se puede dividir entre cero.';
      return;
    }

    const result =
      operation === '+'
        ? this.first + this.second
        : operation === '-'
          ? this.first - this.second
          : operation === '×'
            ? this.first * this.second
            : this.first / this.second;
    this.calculated.emit({ first: this.first, second: this.second, operation, result });
  }
}
