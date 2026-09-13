import { loadRemoteModule } from '@angular-architects/native-federation';
import { Routes } from '@angular/router';
import { microfrontends } from './application.config';

const remoteRoutes: Routes = microfrontends.map(
  ({ path, remote, exposedModule }) => ({
    path,
    loadChildren: () =>
      loadRemoteModule(remote, exposedModule).then((module) => module.routes),
  }),
);

export const routes: Routes = [
  {
    path: '',
    redirectTo: microfrontends[0]?.path ?? '',
    pathMatch: 'full',
  },
  ...remoteRoutes,
];
