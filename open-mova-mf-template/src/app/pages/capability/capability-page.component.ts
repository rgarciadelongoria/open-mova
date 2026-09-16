import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { injectNativeCapabilities } from '@open-mova/core';
import type { CapabilityExample, DemoCapability } from '../../capabilities/capability-catalog';

type CapabilityRegistry = Record<
  string,
  {
    isAvailable(): boolean;
    invoke<TResult>(
      operation: string,
      options?: Readonly<Record<string, unknown>>,
    ): Promise<TResult>;
  }
>;

@Component({
  standalone: true,
  templateUrl: './capability-page.component.html',
  styleUrl: './capability-page.component.css',
})
export class CapabilityPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly native = injectNativeCapabilities() as unknown as CapabilityRegistry & {
    device: { getInfo(): Promise<unknown> };
    camera: {
      takePhoto(): Promise<{ webPath?: string; uri?: string }>;
      choosePhoto(): Promise<{ webPath?: string; uri?: string } | undefined>;
    };
  };

  readonly capability = this.route.snapshot.data['capability'] as DemoCapability;
  readonly results = signal<Record<string, string>>({});
  readonly photoUrls = signal<Record<string, string | undefined>>({});
  readonly isAvailable = computed(() => this.capabilityApi().isAvailable());

  private capabilityApi(): CapabilityRegistry[string] {
    return (this.native as CapabilityRegistry)[this.capability.property];
  }

  async run(example: CapabilityExample): Promise<void> {
    this.setResult(example.id, 'Ejecutando…');
    this.setPhotoUrl(example.id, undefined);

    try {
      let value: unknown;

      if (example.action === 'device-info') {
        value = await this.native.device.getInfo();
      } else if (example.action === 'camera-photo') {
        const photo = await this.native.camera.takePhoto();
        value = photo;
        this.setPhotoUrl(example.id, photo.webPath);
      } else if (example.action === 'camera-gallery') {
        const photo = await this.native.camera.choosePhoto();
        value = photo;
        this.setPhotoUrl(example.id, photo?.webPath);
      } else {
        value = await this.capabilityApi().invoke(example.operation!, example.options);
      }
      this.setResult(
        example.id,
        value === undefined ? 'Operación completada.' : JSON.stringify(value, null, 2),
      );
    } catch (error) {
      this.setResult(
        example.id,
        error instanceof Error ? error.message : 'La operación no se pudo completar.',
      );
    }
  }

  resultFor(example: CapabilityExample): string {
    return this.results()[example.id] ?? 'Aún no se ha ejecutado esta prueba.';
  }

  photoUrlFor(example: CapabilityExample): string | undefined {
    return this.photoUrls()[example.id];
  }

  private setResult(exampleId: string, value: string): void {
    this.results.update((results) => ({ ...results, [exampleId]: value }));
  }

  private setPhotoUrl(exampleId: string, value: string | undefined): void {
    this.photoUrls.update((photoUrls) => ({ ...photoUrls, [exampleId]: value }));
  }
}
