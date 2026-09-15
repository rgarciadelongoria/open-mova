import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toDisplayName, toRemoteName } from '../utils/names.js';

export type MicrofrontendProfile = 'minimal' | 'demo';

export function configureDownloadedMicrofrontend(
  destination: string,
  name: string,
  port: number,
  profile: MicrofrontendProfile,
): void {
  const projectName = `mova-mf-${name}`;
  const packagePath = join(destination, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as {
    name: string;
    scripts: Record<string, string>;
    dependencies: Record<string, string>;
  };
  packageJson.name = projectName;
  packageJson.scripts.start = `ng serve ${projectName}`;
  packageJson.scripts.build = `ng build ${projectName}`;

  if (profile === 'minimal') {
    delete packageJson.dependencies['@open-mova/core'];
    writeFileSync(join(destination, 'src/app/app.routes.ts'), minimalRoutes(name));
    writeFileSync(join(destination, 'src/app/app.config.ts'), minimalAppConfig());
  }
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const angularPath = join(destination, 'angular.json');
  const angular = readFileSync(angularPath, 'utf8')
    .replaceAll('open-mova-mf-template', projectName)
    .replace('"port": 4300', `"port": ${port}`);
  writeFileSync(angularPath, angular);

  const federationPath = join(destination, 'federation.config.js');
  writeFileSync(
    federationPath,
    readFileSync(federationPath, 'utf8').replace('demo-microfrontend', toRemoteName(name)),
  );
  const indexPath = join(destination, 'src/index.html');
  writeFileSync(
    indexPath,
    readFileSync(indexPath, 'utf8')
      .replaceAll('Demo microfrontend', toDisplayName(name))
      .replaceAll('mova-demo-microfrontend', `mova-${name}-microfrontend`),
  );
  const appPath = join(destination, 'src/app/app.ts');
  writeFileSync(
    appPath,
    readFileSync(appPath, 'utf8').replace('mova-demo-microfrontend', `mova-${name}-microfrontend`),
  );

  // El lock heredado ya no representa el proyecto renombrado ni su dependencia local.
  rmSync(join(destination, 'package-lock.json'), { force: true });
  writeFileSync(
    join(destination, 'README.md'),
    `# ${projectName}\n\nMicrofrontal Open Mova (${profile}). Ejecuta \`npm install\` y \`npm start\`. La shell lo carga en http://localhost:${port}/remoteEntry.json.\n`,
  );
}

function minimalRoutes(name: string): string {
  return `import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  standalone: true,
  template: '<h1>${toDisplayName(name)}</h1>',
})
export class HomeComponent {}

// Añade aquí las rutas y componentes propios de este microfrontal.
export const routes: Routes = [
  { path: '', component: HomeComponent },
];
`;
}

function minimalAppConfig(): string {
  return `import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};
`;
}
