import { Component, signal } from '@angular/core';
import { injectNativeCapabilities } from '@open-mova/core';

@Component({
  standalone: true,
  templateUrl: './camera-example.component.html',
})
export class CameraExampleComponent {
  private readonly native = injectNativeCapabilities();
  readonly result = signal('Pulsa el botón para usar la cámara.');
  readonly photoUrl = signal<string | undefined>(undefined);

  async takePhoto(): Promise<void> {
    try {
      const photo = await this.native.camera.takePhoto();
      this.photoUrl.set(photo.webPath);
      this.result.set(photo.webPath ? 'Foto obtenida.' : 'Foto obtenida sin URL web.');
    } catch (error) {
      this.result.set(error instanceof Error ? error.message : 'No se pudo abrir la cámara.');
    }
  }
}
