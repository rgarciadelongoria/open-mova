import type { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNativeCapabilities } from '../native-capabilities/native-capabilities.provider';
import { REMOTE_COMPONENT_RESOLVER } from '@open-mova/core/remote-components';
import { loadCompatibleRemoteComponent } from './microfrontends/remote-loader';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideNativeCapabilities(),
    { provide: REMOTE_COMPONENT_RESOLVER, useValue: { load: loadCompatibleRemoteComponent } },
  ],
};
