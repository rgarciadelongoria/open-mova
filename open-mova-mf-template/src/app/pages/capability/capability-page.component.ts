import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { injectNativeCapabilities } from '@open-mova/core';
import type { CapabilityExample, DemoCapability } from '../../capabilities/capability-catalog';

type CapabilityRegistry = Record<string, {
  isAvailable(): boolean;
  invoke<TResult>(
    operation: string,
    options?: Readonly<Record<string, unknown>>,
  ): Promise<TResult>;
}>;

@Component({
  standalone: true,
  templateUrl: './capability-page.component.html',
  styleUrl: './capability-page.component.css',
})
export class CapabilityPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly native = injectNativeCapabilities() as unknown as CapabilityRegistry & {
    device: { getInfo(): Promise<unknown> };
    camera: { takePhoto(): Promise<{ webPath?: string; uri?: string }> };
  };

  readonly capability = this.route.snapshot.data['capability'] as DemoCapability;
  readonly result = signal('Selecciona un ejemplo para ejecutarlo desde la shell.');
  readonly photoUrl = signal<string | undefined>(undefined);
  readonly isAvailable = computed(() => this.native[this.capability.property]?.isAvailable() ?? false);

  async run(example: CapabilityExample): Promise<void> {
    if (!example.runnable) {
      this.result.set(example.note ?? 'Este ejemplo requiere configuración adicional antes de ejecutarse.');
      return;
    }

    try {
      let value: unknown;
      this.photoUrl.set(undefined);

      if (example.action === 'device-info') {
        value = await this.native.device.getInfo();
      } else if (example.action === 'camera-photo') {
        const photo = await this.native.camera.takePhoto();
        value = photo;
        this.photoUrl.set(photo.webPath);
      } else {
        value = await this.native[this.capability.property].invoke(example.operation!, example.options);
      }
      this.result.set(
        value === undefined ? 'Operación completada.' : JSON.stringify(value, null, 2),
      );
    } catch (error) {
      this.result.set(error instanceof Error ? error.message : 'La operación no se pudo completar.');
    }
  }
}
