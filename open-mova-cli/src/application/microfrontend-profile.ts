import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeName, toDisplayName, toPascalCase, toRemoteName } from '../utils/names.js';
import { readRequiredCoreVersion, writeMicrofrontendManifest } from './microfrontend-manifest.js';

export type MicrofrontendProfile =
  'minimal' | 'demo' | 'calculator' | 'starter-both' | 'starter-routes' | 'starter-component';

interface StarterComponent {
  readonly alias: string;
  readonly module: string;
  readonly source: string;
  readonly className: string;
}

export function configureDownloadedMicrofrontend(
  destination: string,
  name: string,
  port: number,
  profile: MicrofrontendProfile,
  componentName = 'main',
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

  const hasRoutes = profile !== 'calculator' && profile !== 'starter-component';
  const componentPath = join(destination, 'src/app/components/calculator');
  if (profile === 'starter-both' || profile === 'starter-component') {
    rmSync(componentPath, { recursive: true, force: true });
  }
  const starter =
    profile === 'starter-both' || profile === 'starter-component'
      ? configureStarterComponent(destination, componentName)
      : undefined;
  if (!starter) {
    rmSync(join(destination, 'src/app/components/starter'), { recursive: true, force: true });
  }

  if (profile === 'minimal' || profile === 'starter-routes' || profile === 'starter-both') {
    writeFileSync(join(destination, 'src/app/app.routes.ts'), minimalRoutes(name));
    writeFileSync(join(destination, 'src/app/app.config.ts'), minimalAppConfig());
  }
  const demoPagePath = join(destination, 'src/app/pages/remote-component');
  let components: Readonly<Record<string, string>> | undefined = starter
    ? { [starter.alias]: starter.module }
    : undefined;
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
    removeDemoPages(destination);
  } else if (profile === 'starter-component') {
    if (!starter) throw new Error('Falta el componente inicial del template.');
    writeFileSync(join(destination, 'src/app/app.ts'), componentPreviewApp(name, starter));
    writeFileSync(join(destination, 'src/app/app.config.ts'), emptyAppConfig());
    rmSync(join(destination, 'src/app/app.routes.ts'), { force: true });
    removeDemoPages(destination);
  } else {
    rmSync(componentPath, { recursive: true, force: true });
    if (profile === 'minimal' || profile === 'starter-routes' || profile === 'starter-both') {
      rmSync(demoPagePath, { recursive: true, force: true });
    }
    if (profile === 'starter-routes' || profile === 'starter-both') {
      removeDemoPages(destination);
    }
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
  const exposures = [
    ...(hasRoutes ? [`    '${routesModule}': './src/app/app.routes.ts',`] : []),
    ...(profile === 'calculator'
      ? [
          `    '${components?.['main']}': './src/app/components/calculator/calculator.component.ts',`,
        ]
      : []),
    ...(starter ? [`    '${starter.module}': '${starter.source}',`] : []),
  ].join('\n');
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
  if (hasRoutes) {
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
    hasRoutes ? routesModule : undefined,
    components,
  );

  // El lock heredado ya no representa el proyecto renombrado ni su dependencia local.
  rmSync(join(destination, 'package-lock.json'), { force: true });
  writeFileSync(
    join(destination, 'README.md'),
    `# ${projectName}\n\nMicrofrontal Open Mova (${profile}). Ejecuta \`npm install\` y \`npm start\`. La shell lo carga desde http://localhost:${port}/remoteEntry.json.${starter ? ` Componente expuesto: ${name}.${starter.alias} (${starter.module}).` : ''}\n`,
  );
  return components ? { components } : {};
}

function removeDemoPages(destination: string): void {
  for (const directory of ['layout', 'pages', 'capabilities']) {
    rmSync(join(destination, 'src/app', directory), { recursive: true, force: true });
  }
  rmSync(join(destination, 'src/app/standalone-native-capabilities.ts'), { force: true });
}

function configureStarterComponent(destination: string, componentName: string): StarterComponent {
  const alias = normalizeName(componentName, 'El nombre del componente');
  if (!/^[a-z]/.test(alias)) {
    throw new Error('El nombre del componente debe comenzar por una letra.');
  }
  if (alias === 'routes') {
    throw new Error('El nombre "routes" está reservado para las rutas del microfrontal.');
  }
  const componentDirectory = join(destination, 'src/app/components');
  const sourceDirectory = join(componentDirectory, 'starter');
  if (!existsSync(sourceDirectory)) {
    throw new Error(
      'La versión elegida del template no admite componentes mínimos. Usa un tag más reciente o --routes-only.',
    );
  }
  const targetDirectory = join(componentDirectory, alias);
  if (sourceDirectory !== targetDirectory) renameSync(sourceDirectory, targetDirectory);

  const sourceBase = join(targetDirectory, 'starter.component');
  const targetBase = join(targetDirectory, `${alias}.component`);
  if (sourceBase !== targetBase) {
    for (const extension of ['ts', 'html', 'css']) {
      renameSync(`${sourceBase}.${extension}`, `${targetBase}.${extension}`);
    }
  }
  const typeScriptPath = `${targetBase}.ts`;
  writeFileSync(
    typeScriptPath,
    readFileSync(typeScriptPath, 'utf8')
      .replaceAll('StarterComponent', `${toPascalCase(alias)}Component`)
      .replaceAll('mova-starter', `mova-${alias}`)
      .replaceAll('./starter.component', `./${alias}.component`),
  );

  return {
    alias,
    module: `./${toPascalCase(alias)}`,
    source: `./src/app/components/${alias}/${alias}.component.ts`,
    className: `${toPascalCase(alias)}Component`,
  };
}

function componentPreviewApp(name: string, starter: StarterComponent): string {
  return `import { Component } from '@angular/core';
import { ${starter.className} } from './components/${starter.alias}/${starter.alias}.component';

@Component({
  selector: 'mova-${name}-microfrontend',
  standalone: true,
  imports: [${starter.className}],
  template: '<mova-${starter.alias} />',
})
export class App {}
`;
}

function emptyAppConfig(): string {
  return `import type { ApplicationConfig } from '@angular/core';

export const appConfig: ApplicationConfig = { providers: [] };
`;
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
