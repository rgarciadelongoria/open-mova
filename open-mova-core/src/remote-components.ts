import {
  ChangeDetectorRef,
  Component,
  EnvironmentInjector,
  EventEmitter,
  inject,
  InjectionToken,
  Input,
  Output,
  reflectComponentType,
  ViewChild,
  ViewContainerRef,
  type AfterViewInit,
  type ComponentRef,
  type OnChanges,
  type OnDestroy,
  type Type,
} from '@angular/core';

export interface RemoteComponentResolver {
  load(name: string): Promise<Type<unknown>>;
}

export interface RemoteComponentEvent {
  readonly name: string;
  readonly value: unknown;
}

export const REMOTE_COMPONENT_RESOLVER = new InjectionToken<RemoteComponentResolver>(
  'Open Mova remote component resolver',
);

type RemoteOutput = { subscribe(callback: (value: unknown) => void): { unsubscribe(): void } };

@Component({
  selector: 'mova-remote-component',
  standalone: true,
  template: `
    <ng-template #outlet />
    @if (loading) {
      <p role="status">Cargando componente remoto…</p>
    }
    @if (error) {
      <div role="alert">
        <p>{{ error }}</p>
        <ng-content />
      </div>
    }
  `,
})
export class MovaRemoteComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) name = '';
  @Input() inputs: Readonly<Record<string, unknown>> = {};
  @Output() readonly remoteEvent = new EventEmitter<RemoteComponentEvent>();
  @ViewChild('outlet', { read: ViewContainerRef }) private outlet?: ViewContainerRef;

  loading = false;
  error = '';

  private readonly resolver = inject(REMOTE_COMPONENT_RESOLVER, { optional: true });
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly changes = inject(ChangeDetectorRef);
  private component?: ComponentRef<unknown>;
  private subscriptions: Array<{ unsubscribe(): void }> = [];
  private generation = 0;
  private loadScheduled = false;
  private destroyed = false;
  private loadedName = '';

  ngAfterViewInit(): void {
    this.scheduleLoad();
  }

  ngOnChanges(): void {
    if (!this.outlet) return;
    if (this.name !== this.loadedName) {
      this.scheduleLoad();
    } else {
      this.applyInputs();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.generation += 1;
    this.clear();
    this.remoteEvent.complete();
  }

  private scheduleLoad(): void {
    if (this.loadScheduled || this.destroyed) return;
    this.loadScheduled = true;
    this.generation += 1;
    queueMicrotask(() => {
      this.loadScheduled = false;
      if (!this.destroyed) void this.load();
    });
  }

  private async load(): Promise<void> {
    const generation = ++this.generation;
    this.clear();
    this.loadedName = this.name;
    this.error = '';
    this.loading = true;
    this.changes.markForCheck();

    try {
      if (!this.resolver) {
        throw new Error('La shell no proporciona el cargador de componentes remotos.');
      }
      const type = await this.resolver.load(this.name);
      if (this.destroyed || generation !== this.generation || !this.outlet) return;
      const metadata = reflectComponentType(type);
      if (!metadata) throw new Error(`El remoto ${this.name} no expone un componente Angular.`);

      this.component = this.outlet.createComponent(type, {
        environmentInjector: this.environmentInjector,
      });
      this.applyInputs();
      for (const output of metadata.outputs) {
        const source = (this.component.instance as Record<string, unknown>)[output.propName];
        if (!isRemoteOutput(source)) continue;
        this.subscriptions.push(
          source.subscribe((value) => {
            this.remoteEvent.emit({ name: output.templateName, value });
          }),
        );
      }
      this.loading = false;
      this.changes.markForCheck();
    } catch (error) {
      if (this.destroyed || generation !== this.generation) return;
      this.loading = false;
      this.error = error instanceof Error ? error.message : 'No se pudo cargar el componente.';
      this.changes.markForCheck();
    }
  }

  private applyInputs(): void {
    if (!this.component) return;
    for (const [name, value] of Object.entries(this.inputs)) {
      this.component.setInput(name, value);
    }
  }

  private clear(): void {
    for (const subscription of this.subscriptions) subscription.unsubscribe();
    this.subscriptions = [];
    this.component?.destroy();
    this.component = undefined;
    this.outlet?.clear();
  }
}

function isRemoteOutput(value: unknown): value is RemoteOutput {
  return (
    typeof value === 'object' &&
    value !== null &&
    'subscribe' in value &&
    typeof value.subscribe === 'function'
  );
}
