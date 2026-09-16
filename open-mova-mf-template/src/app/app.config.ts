import type { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NATIVE_CAPABILITIES } from '@open-mova/core';
import { routes } from './app.routes';
import { createStandaloneNativeCapabilities } from './standalone-native-capabilities';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    {
      provide: NATIVE_CAPABILITIES,
      useFactory: createStandaloneNativeCapabilities,
    },
  ],
};
