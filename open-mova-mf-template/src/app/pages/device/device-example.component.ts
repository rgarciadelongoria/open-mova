import { Component, signal } from '@angular/core';
import { injectNativeCapabilities } from '@open-mova/core';

@Component({
  standalone: true,
  templateUrl: './device-example.component.html',
})
export class DeviceExampleComponent {
  private readonly native = injectNativeCapabilities();
  readonly result = signal('Pulsa el botón para consultar el dispositivo.');

  async readDevice(): Promise<void> {
    try {
      const info = await this.native.device.getInfo();
      this.result.set(`${info.model} · ${info.platform} · ${info.osVersion}`);
    } catch (error) {
      this.result.set(error instanceof Error ? error.message : 'No se pudo leer el dispositivo.');
    }
  }
}
