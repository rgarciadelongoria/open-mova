import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toDisplayName, toRemoteName } from '../utils/names.js';
import { readRequiredCoreVersion, writeMicrofrontendManifest } from './microfrontend-manifest.js';

export type MicrofrontendProfile = 'minimal' | 'demo' | 'calculator';

export function configureDownloadedMicrofrontend(
  destination: string,
  name: string,
  port: number,
  profile: MicrofrontendProfile,
): { readonly components?: Readonly<Record<string, string>> } {
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

  const sourceManifest = JSON.parse(
    readFileSync(join(destination, 'src/assets/open-mova.manifest.json'), 'utf8'),
  ) as { routes?: string; components?: Record<string, string> };
  const routesModule = sourceManifest.routes ?? './Routes';
  if (routesModule !== './Routes') {
    throw new Error('El template no declara la exposición de rutas esperada.');
  }

  if (profile === 'minimal') {
    writeFileSync(join(destination, 'src/app/app.routes.ts'), minimalRoutes(name));
    writeFileSync(join(destination, 'src/app/app.config.ts'), minimalAppConfig());
  }
  const componentPath = join(destination, 'src/app/components/calculator');
  const demoPagePath = join(destination, 'src/app/pages/remote-component');
  let components: Readonly<Record<string, string>> | undefined;
  if (profile === 'calculator') {
    components = sourceManifest.components;
    if (components?.['main'] !== './Calculator') {
      throw new Error('El template no declara la exposición de la calculadora.');
    }
    writeFileSync(
      join(destination, 'src/app/app.ts'),
      `import { Component } from '@angular/core';
import { CalculatorComponent } from './components/calculator/calculator.component';

@Component({
  selector: 'mova-${name}-microfrontend',
  standalone: true,
  imports: [CalculatorComponent],
  template: '<mova-calculator />',
})
export class App {}
`,
    );
    writeFileSync(
      join(destination, 'src/app/app.config.ts'),
      `import type { ApplicationConfig } from '@angular/core';

export const appConfig: ApplicationConfig = { providers: [] };
`,
    );
    rmSync(join(destination, 'src/app/app.routes.ts'), { force: true });
    rmSync(join(destination, 'src/app/layout'), { recursive: true, force: true });
    rmSync(join(destination, 'src/app/pages'), { recursive: true, force: true });
    rmSync(join(destination, 'src/app/capabilities'), { recursive: true, force: true });
    rmSync(join(destination, 'src/app/standalone-native-capabilities.ts'), { force: true });
  } else {
    rmSync(componentPath, { recursive: true, force: true });
    if (profile === 'minimal') rmSync(demoPagePath, { recursive: true, force: true });
  }
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const angularPath = join(destination, 'angular.json');
  const angular = readFileSync(angularPath, 'utf8')
    .replaceAll('open-mova-mf-template', projectName)
    .replace('"port": 4300', `"port": ${port}`);
  writeFileSync(angularPath, angular);

  const federationPath = join(destination, 'federation.config.js');
  const federationSource = readFileSync(federationPath, 'utf8');
  for (const exposedModule of [routesModule, ...Object.values(sourceManifest.components ?? {})]) {
    if (!federationSource.includes(`'${exposedModule}':`)) {
      throw new Error(`El template declara ${exposedModule}, pero Native Federation no lo expone.`);
    }
  }
  const exposures =
    profile === 'calculator'
      ? `    '${components?.['main']}': './src/app/components/calculator/calculator.component.ts',`
      : `    '${routesModule}': './src/app/app.routes.ts',`;
  const federation = federationSource
    .replace('demo-microfrontend', toRemoteName(name))
    .replace(/ {2}exposes: \{[\s\S]*?\n {2}\},/, `  exposes: {\n${exposures}\n  },`);
  if (federation === federationSource) throw new Error('No se pudo configurar Native Federation.');
  writeFileSync(federationPath, federation);
  const indexPath = join(destination, 'src/index.html');
  writeFileSync(
    indexPath,
    readFileSync(indexPath, 'utf8')
      .replaceAll('Demo microfrontend', toDisplayName(name))
      .replaceAll('mova-demo-microfrontend', `mova-${name}-microfrontend`),
  );
  const appPath = join(destination, 'src/app/app.ts');
  if (profile !== 'calculator') {
    writeFileSync(
      appPath,
      readFileSync(appPath, 'utf8').replace(
        'mova-demo-microfrontend',
        `mova-${name}-microfrontend`,
      ),
    );
  }
  writeMicrofrontendManifest(
    destination,
    name,
    toRemoteName(name),
    readRequiredCoreVersion(destination),
    profile === 'calculator' ? undefined : routesModule,
    components,
  );

  // El lock heredado ya no representa el proyecto renombrado ni su dependencia local.
  rmSync(join(destination, 'package-lock.json'), { force: true });
  writeFileSync(
    join(destination, 'README.md'),
    `# ${projectName}\n\nMicrofrontal Open Mova (${profile}). Ejecuta \`npm install\` y \`npm start\`. La shell lo carga en http://localhost:${port}/remoteEntry.json.\n`,
  );
  return components ? { components } : {};
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
