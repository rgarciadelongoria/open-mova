import { Component, computed, signal } from '@angular/core';
import { MovaRemoteComponent, type RemoteComponentEvent } from '@open-mova/core/remote-components';

interface Calculation {
  readonly first: number;
  readonly second: number;
  readonly operation: '+' | '-' | '×' | '÷';
  readonly result: number;
}

@Component({
  standalone: true,
  imports: [MovaRemoteComponent],
  templateUrl: './remote-component-page.component.html',
  styleUrl: './remote-component-page.component.css',
})
export class RemoteComponentPageComponent {
  readonly enabled = signal(true);
  readonly remoteInputs = computed(() => ({ enabled: this.enabled() }));
  readonly lastCalculation = signal('Todavía no se ha realizado ninguna operación.');

  toggle(): void {
    this.enabled.update((value) => !value);
  }

  onRemoteEvent(event: RemoteComponentEvent): void {
    if (event.name !== 'calculated' || !isCalculation(event.value)) return;
    const { first, second, operation, result } = event.value;
    this.lastCalculation.set(`${first} ${operation} ${second} = ${result}`);
  }
}

function isCalculation(value: unknown): value is Calculation {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item['first'] === 'number' &&
    typeof item['second'] === 'number' &&
    typeof item['result'] === 'number' &&
    Number.isFinite(item['result']) &&
    ['+', '-', '×', '÷'].includes(String(item['operation']))
  );
}
