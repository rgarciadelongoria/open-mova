import type { Routes } from '@angular/router';
import { microfrontends } from './application.config';
import { loadCompatibleRemoteRoutes } from './microfrontends/remote-loader';
import { RemoteLoadErrorComponent } from './microfrontends/remote-load-error.component';

const remoteRoutes: Routes = microfrontends
  .filter((microfrontend) => microfrontend.path !== undefined)
  .map((microfrontend) => ({
    path: microfrontend.path!,
    loadChildren: () =>
      loadCompatibleRemoteRoutes(microfrontend).catch((error: unknown) => [
        {
          path: '',
          component: RemoteLoadErrorComponent,
          data: {
            message: error instanceof Error ? error.message : 'Error desconocido.',
          },
        },
      ]),
  }));

export const routes: Routes = [
  {
    path: '',
    redirectTo: microfrontends.find((microfrontend) => microfrontend.path)?.path ?? '',
    pathMatch: 'full',
  },
  ...remoteRoutes,
];
