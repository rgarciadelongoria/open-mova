import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NATIVE_CAPABILITIES, type NativeCapabilities } from '@open-mova/core';
import { routes } from './app.routes';

// Solo se usa al abrir el MF directamente; dentro de la shell manda su provider.
const standaloneCapabilities = {
  version: 1,
  device: {
    getInfo: async () => {
      throw new Error('Abre este ejemplo desde la shell para usar Device.');
    },
  },
  camera: {
    takePhoto: async () => {
      throw new Error('Abre este ejemplo desde la shell para usar Camera.');
    },
    choosePhoto: async () => {
      throw new Error('Abre este ejemplo desde la shell para usar Camera.');
    },
  },
} as unknown as NativeCapabilities;

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: NATIVE_CAPABILITIES, useValue: standaloneCapabilities },
  ],
};
