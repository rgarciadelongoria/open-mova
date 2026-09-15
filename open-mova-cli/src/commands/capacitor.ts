import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import {
  readApplicationConfiguration,
  requireApplicationRoot,
} from '../application/configuration.js';
import type { OpenMovaApplicationConfiguration } from '../types.js';
import { localBinaryName, npmCommand, useCommandShell } from '../utils/platform.js';

type Platform = 'android' | 'ios';

export function registerCapacitorCommands(program: Command): void {
  const capacitor = program.command('cap').description('Prepara la shell para Android o iOS');

  capacitor.command('add <platform>')
    .description('Crea el proyecto nativo de la plataforma')
    .action((platform: string) => {
      const selectedPlatform = parsePlatform(platform);
      const root = requireApplicationRoot(process.cwd());
      buildMobileShell(root);
      runCapacitor(root, ['add', selectedPlatform]);
      configureNativePlatform(root, selectedPlatform);
    });

  capacitor.command('sync [platform]')
    .description('Compila la shell y sincroniza sus assets y plugins nativos')
    .action((platform?: string) => {
      const root = requireApplicationRoot(process.cwd());
      buildMobileShell(root);
      const selectedPlatform = platform ? parsePlatform(platform) : undefined;
      runCapacitor(root, ['sync', ...(selectedPlatform ? [selectedPlatform] : [])]);

      if (selectedPlatform) {
        configureNativePlatform(root, selectedPlatform);
      } else {
        configureExistingPlatforms(root);
      }
    });

  capacitor.command('open <platform>')
    .description('Abre el proyecto nativo en Android Studio o Xcode')
    .action((platform: string) => {
      const root = requireApplicationRoot(process.cwd());
      runCapacitor(root, ['open', parsePlatform(platform)]);
    });
}

function parsePlatform(value: string): Platform {
  if (value !== 'android' && value !== 'ios') {
    throw new Error('La plataforma debe ser android o ios.');
  }

  return value;
}

function buildMobileShell(root: string): void {
  if (!existsSync(join(root, 'capacitor.config.ts'))) {
    throw new Error('Esta versión de shell no incluye Capacitor. Usa una shell v0.1.2 o posterior.');
  }
  const configuration = readApplicationConfiguration(root);
  const manifest = createProductionManifest(configuration);
  run(root, npmCommand(), ['run', 'build']);

  const webDirectory = join(root, 'dist', 'browser');
  if (!existsSync(join(webDirectory, 'index.html'))) {
    throw new Error(`No se encuentra la shell compilada en ${webDirectory}.`);
  }

  // La compilación usa URLs locales para desarrollo; solo el artefacto móvil usa HTTPS.
  writeFileSync(
    join(webDirectory, 'assets', 'federation.manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
}

function createProductionManifest(
  configuration: OpenMovaApplicationConfiguration,
): Record<string, string> {
  return Object.fromEntries(configuration.microfrontends.map((microfrontend) => {
    const entry = microfrontend.productionRemoteEntry;
    if (!entry || !isHttpsUrl(entry)) {
      throw new Error(
        `Configura productionRemoteEntry con HTTPS para el microfrontal "${microfrontend.name}" en mova.config.json.`,
      );
    }
    return [microfrontend.remoteName, entry];
  }));
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function configureExistingPlatforms(root: string): void {
  if (existsSync(join(root, 'android'))) {
    configureNativePlatform(root, 'android');
  }
}

function configureNativePlatform(root: string, platform: Platform): void {
  if (platform === 'android') {
    configureBackgroundRunnerForAndroid(root);
  }
}

function configureBackgroundRunnerForAndroid(root: string): void {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
  };
  if (!packageJson.dependencies?.['@capacitor/background-runner']) return;

  const gradlePath = join(root, 'android', 'app', 'build.gradle');
  if (!existsSync(gradlePath)) {
    throw new Error('No se encuentra android/app/build.gradle para configurar Background Runner.');
  }

  const repositoryEntry =
    "dirs '../../node_modules/@capacitor/background-runner/android/src/main/libs', 'libs'";
  const gradle = readFileSync(gradlePath, 'utf8');
  if (gradle.includes(repositoryEntry)) return;

  const flatDirectory = /flatDir\s*\{/;
  if (!flatDirectory.test(gradle)) {
    throw new Error('No se ha encontrado el bloque flatDir en android/app/build.gradle.');
  }

  const configuredGradle = gradle.replace(
    flatDirectory,
    (match) => `${match}\n        ${repositoryEntry}`,
  );
  writeFileSync(gradlePath, configuredGradle, 'utf8');
}

function runCapacitor(root: string, args: string[]): void {
  if (!existsSync(join(root, 'capacitor.config.ts'))) {
    throw new Error('Esta versión de shell no incluye Capacitor. Usa una shell v0.1.2 o posterior.');
  }
  const binary = join(root, 'node_modules', '.bin', localBinaryName('cap'));
  if (!existsSync(binary)) {
    throw new Error('Instala las dependencias de la aplicación con npm install.');
  }
  run(root, binary, args);
}

function run(root: string, command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: useCommandShell(),
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} terminó con error.`);
  }
}
