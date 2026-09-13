import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet, Routes } from '@angular/router';
import { getNativeCapabilities } from '@open-mova/core';

@Component({
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <h1>Open Mova · demostración</h1>
    <nav>
      <a routerLink="inicio">Inicio</a> ·
      <a routerLink="device">Device</a> ·
      <a routerLink="camera">Camera</a>
    </nav>
    <router-outlet />
  `,
})
export class DemoLayoutComponent {}

@Component({
  standalone: true,
  template: `
    <p>Este microfrontal remoto muestra ejemplos mínimos del framework.</p>
  `,
})
export class HomeComponent {}

@Component({
  standalone: true,
  template: '<h2>Device</h2><button type="button" (click)="readDevice()">Leer dispositivo</button><p>{{ result() }}</p>',
})
export class DeviceExampleComponent {
  readonly result = signal('Pulsa el botón para consultar el dispositivo.');

  async readDevice(): Promise<void> {
    try {
      const info = await getNativeCapabilities().device.getInfo();
      this.result.set(`${info.model} · ${info.platform} · ${info.osVersion}`);
    } catch (error) {
      this.result.set(error instanceof Error ? error.message : 'No se pudo leer el dispositivo.');
    }
  }
}

@Component({
  standalone: true,
  template: `
    <h2>Camera</h2>
    <button type="button" (click)="takePhoto()">Tomar foto</button>
    <p>{{ result() }}</p>
    @if (photoUrl()) {
      <img [src]="photoUrl()" alt="Fotografía tomada" style="max-width: 100%" />
    }
  `,
})
export class CameraExampleComponent {
  readonly result = signal('Pulsa el botón para usar la cámara.');
  readonly photoUrl = signal<string | undefined>(undefined);

  async takePhoto(): Promise<void> {
    try {
      const photo = await getNativeCapabilities().camera.takePhoto();
      this.photoUrl.set(photo.webPath);
      this.result.set(photo.webPath ? 'Foto obtenida.' : 'Foto obtenida sin URL web.');
    } catch (error) {
      this.result.set(error instanceof Error ? error.message : 'No se pudo abrir la cámara.');
    }
  }
}

// La shell monta estas rutas bajo la ruta pública configurada para el remoto.
export const routes: Routes = [
  {
    path: '',
    component: DemoLayoutComponent,
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: HomeComponent },
      { path: 'device', component: DeviceExampleComponent },
      { path: 'camera', component: CameraExampleComponent },
    ],
  },
];
