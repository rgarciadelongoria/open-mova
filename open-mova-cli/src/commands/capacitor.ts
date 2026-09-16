import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import {
  readApplicationConfiguration,
  requireApplicationRoot,
} from '../application/configuration.js';
import { configureAndroidProject } from '../application/android-configuration.js';
import {
  diagnoseNativeCapabilities,
  disableNativeCapabilities,
  enableNativeCapabilities,
  listNativeCapabilities,
} from '../application/native-capabilities.js';
import type { OpenMovaApplicationConfiguration } from '../types.js';
import { localBinaryName, npmCommand, useCommandShell } from '../utils/platform.js';

type Platform = 'android' | 'ios';

export function registerCapacitorCommands(program: Command): void {
  const capacitor = program.command('cap').description('Prepara la shell para Android o iOS');

  capacitor
    .command('list')
    .description('Lista las capacidades nativas disponibles y habilitadas')
    .action(() => {
      const root = requireApplicationRoot(process.cwd());
      for (const { definition, enabled } of listNativeCapabilities(root)) {
        console.log(
          `${enabled ? '✓' : '○'} ${definition.name} (${definition.platforms.join(', ')})`,
        );
      }
    });

  capacitor
    .command('enable <capabilities...>')
    .description('Instala y habilita capacidades nativas en la aplicación')
    .action((capabilities: string[]) => {
      const root = requireApplicationRoot(process.cwd());
      enableNativeCapabilities(root, capabilities);
      synchronizeExistingNativeProjects(root);
      console.log(`Capacidades habilitadas: ${capabilities.join(', ')}.`);
    });

  capacitor
    .command('disable <capabilities...>')
    .description('Deshabilita capacidades y elimina los plugins que ya no se usan')
    .action((capabilities: string[]) => {
      const root = requireApplicationRoot(process.cwd());
      disableNativeCapabilities(root, capabilities);
      synchronizeExistingNativeProjects(root);
      console.log(`Capacidades deshabilitadas: ${capabilities.join(', ')}.`);
    });

  capacitor
    .command('doctor [platform]')
    .description('Muestra requisitos y configuración pendiente de las capacidades')
    .action((platform?: string) => {
      const root = requireApplicationRoot(process.cwd());
      const selectedPlatform = platform ? parsePlatform(platform) : undefined;
      for (const message of diagnoseNativeCapabilities(root, selectedPlatform)) {
        console.log(message);
      }
    });

  capacitor
    .command('add <platform>')
    .description('Crea el proyecto nativo de la plataforma')
    .action((platform: string) => {
      const selectedPlatform = parsePlatform(platform);
      const root = requireApplicationRoot(process.cwd());
      buildMobileShell(root);
      runCapacitor(root, ['add', selectedPlatform]);
      configureNativePlatform(root, selectedPlatform, readApplicationConfiguration(root));
    });

  capacitor
    .command('sync [platform]')
    .description('Compila la shell y sincroniza sus assets y plugins nativos')
    .action((platform?: string) => {
      const root = requireApplicationRoot(process.cwd());
      buildMobileShell(root);
      const selectedPlatform = platform ? parsePlatform(platform) : undefined;
      runCapacitor(root, ['sync', ...(selectedPlatform ? [selectedPlatform] : [])]);

      if (selectedPlatform) {
        configureNativePlatform(root, selectedPlatform, readApplicationConfiguration(root));
      } else {
        configureExistingPlatforms(root, readApplicationConfiguration(root));
      }
    });

  capacitor
    .command('open <platform>')
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
    throw new Error(
      'Esta versión de shell no incluye Capacitor. Usa una shell v0.1.2 o posterior.',
    );
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
  return Object.fromEntries(
    configuration.microfrontends.map((microfrontend) => {
      const entry = microfrontend.productionRemoteEntry;
      if (!entry || !isHttpsUrl(entry)) {
        throw new Error(
          `Configura productionRemoteEntry con HTTPS para el microfrontal "${microfrontend.name}" en mova.config.json.`,
        );
      }
      return [microfrontend.remoteName, entry];
    }),
  );
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function configureExistingPlatforms(
  root: string,
  configuration: OpenMovaApplicationConfiguration,
): void {
  if (existsSync(join(root, 'android'))) {
    configureNativePlatform(root, 'android', configuration);
  }
}

function synchronizeExistingNativeProjects(root: string): void {
  const platforms: Platform[] = ['android', 'ios'];

  for (const platform of platforms) {
    if (existsSync(join(root, platform))) {
      runCapacitor(root, ['sync', platform]);
      configureNativePlatform(root, platform, readApplicationConfiguration(root));
    }
  }
}

function configureNativePlatform(
  root: string,
  platform: Platform,
  configuration: OpenMovaApplicationConfiguration,
): void {
  if (platform === 'android') {
    configureAndroidProject(root, configuration);
  }
}

function runCapacitor(root: string, args: string[]): void {
  if (!existsSync(join(root, 'capacitor.config.ts'))) {
    throw new Error(
      'Esta versión de shell no incluye Capacitor. Usa una shell v0.1.2 o posterior.',
    );
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
