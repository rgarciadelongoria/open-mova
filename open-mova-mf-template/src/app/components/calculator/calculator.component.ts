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
  private isEnabled = true;

  @Input()
  get enabled(): boolean {
    return this.isEnabled;
  }

  set enabled(value: boolean) {
    this.isEnabled = value;
    if (!value) this.clear();
  }

  @Output() readonly calculated = new EventEmitter<Calculation>();

  display = '0';
  expression = '';
  error = '';
  private storedOperand?: number;
  private pendingOperation?: Calculation['operation'];
  private replaceDisplay = true;

  pressDigit(digit: string): void {
    if (!this.enabled || !/^\d$/.test(digit)) return;
    this.error = '';
    if (this.replaceDisplay) {
      this.display = digit;
      this.replaceDisplay = false;
      this.expression = this.pendingOperation
        ? `${this.format(this.storedOperand ?? 0)} ${this.pendingOperation}`
        : '';
      return;
    }

    if (this.display.replace('-', '').replace(',', '').length >= 12) return;
    this.display = this.display === '0' ? digit : `${this.display}${digit}`;
  }

  pressDecimal(): void {
    if (!this.enabled || this.display.includes(',')) return;
    if (this.replaceDisplay) {
      this.display = '0,';
      this.replaceDisplay = false;
      this.expression = this.pendingOperation
        ? `${this.format(this.storedOperand ?? 0)} ${this.pendingOperation}`
        : '';
    } else {
      this.display += ',';
    }
    this.error = '';
  }

  toggleSign(): void {
    if (!this.enabled) return;
    this.display = this.display.startsWith('-') ? this.display.slice(1) : `-${this.display}`;
    this.replaceDisplay = false;
    this.error = '';
  }

  percent(): void {
    if (!this.enabled) return;
    this.display = this.format(this.value / 100);
    this.replaceDisplay = true;
    this.error = '';
  }

  clear(): void {
    this.display = '0';
    this.expression = '';
    this.error = '';
    this.storedOperand = undefined;
    this.pendingOperation = undefined;
    this.replaceDisplay = true;
  }

  chooseOperation(operation: Calculation['operation']): void {
    if (!this.enabled) return;
    this.error = '';

    if (this.pendingOperation && this.storedOperand !== undefined && !this.replaceDisplay) {
      const result = this.compute(this.storedOperand, this.value, this.pendingOperation);
      if (result === undefined) return;
      this.display = this.format(result);
      this.storedOperand = result;
    } else {
      this.storedOperand = this.value;
    }

    this.pendingOperation = operation;
    this.expression = `${this.format(this.storedOperand)} ${operation}`;
    this.replaceDisplay = true;
  }

  calculate(): void {
    if (!this.enabled || !this.pendingOperation || this.storedOperand === undefined) return;
    this.error = '';
    const first = this.storedOperand;
    const second = this.replaceDisplay ? first : this.value;
    const operation = this.pendingOperation;
    const result = this.compute(first, second, operation);
    if (result === undefined) return;

    this.expression = `${this.format(first)} ${operation} ${this.format(second)} =`;
    this.display = this.format(result);
    this.storedOperand = undefined;
    this.pendingOperation = undefined;
    this.replaceDisplay = true;
    this.calculated.emit({ first, second, operation, result });
  }

  private get value(): number {
    return Number(this.display.replace(',', '.'));
  }

  private compute(
    first: number,
    second: number,
    operation: Calculation['operation'],
  ): number | undefined {
    if (operation === '÷' && second === 0) {
      this.error = 'No se puede dividir entre cero.';
      return undefined;
    }

    const result =
      operation === '+'
        ? first + second
        : operation === '-'
          ? first - second
          : operation === '×'
            ? first * second
            : first / second;
    if (!Number.isFinite(result)) {
      this.error = 'El resultado está fuera del rango permitido.';
      return undefined;
    }
    return result;
  }

  private format(value: number): string {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 8, useGrouping: false }).format(
      Object.is(value, -0) ? 0 : value,
    );
  }
}
