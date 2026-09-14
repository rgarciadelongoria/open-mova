import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NATIVE_CAPABILITIES } from '@open-mova/core';
import { nativeCapabilities } from '../native-capabilities';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: NATIVE_CAPABILITIES, useValue: nativeCapabilities },
  ],
};
