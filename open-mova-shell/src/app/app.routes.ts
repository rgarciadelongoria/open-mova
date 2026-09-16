import type { Routes } from '@angular/router';
import { microfrontends } from './application.config';
import { loadCompatibleRemoteRoutes } from './microfrontends/remote-loader';
import { RemoteLoadErrorComponent } from './microfrontends/remote-load-error.component';

const remoteRoutes: Routes = microfrontends.map((microfrontend) => ({
  path: microfrontend.path,
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
    redirectTo: microfrontends[0]?.path ?? '',
    pathMatch: 'full',
  },
  ...remoteRoutes,
];
