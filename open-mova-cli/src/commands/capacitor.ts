import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import {
  readApplicationConfiguration,
  requireApplicationRoot,
} from '../application/configuration.js';
import { createProductionRemoteManifest } from '../application/remote-security.js';
import { configureAndroidProject } from '../application/android-configuration.js';
import {
  diagnoseNativeCapabilities,
  disableNativeCapabilities,
  enableNativeCapabilities,
  listNativeCapabilities,
} from '../application/native-capabilities.js';
import type { OpenMovaApplicationConfiguration } from '../types.js';
import { localBinaryName, npmCommand, useCommandShell } from '../utils/platform.js';
import { terminal } from '../ui/terminal.js';

type Platform = 'android' | 'ios';

export function registerCapacitorCommands(program: Command): void {
  const capacitor = program.command('cap').description('Prepara la shell para Android o iOS');

  capacitor
    .command('list')
    .description('Lista las capacidades nativas disponibles y habilitadas')
    .action(() => {
      const root = requireApplicationRoot(process.cwd());
      terminal.heading('Capacidades nativas');
      for (const { definition, enabled } of listNativeCapabilities(root)) {
        terminal.item(
          `${definition.name} (${definition.platforms.join(', ')})`,
          enabled ? 'success' : 'muted',
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
      terminal.success(`Capacidades habilitadas: ${capabilities.join(', ')}.`);
    });

  capacitor
    .command('disable <capabilities...>')
    .description('Deshabilita capacidades y elimina los plugins que ya no se usan')
    .action((capabilities: string[]) => {
      const root = requireApplicationRoot(process.cwd());
      disableNativeCapabilities(root, capabilities);
      synchronizeExistingNativeProjects(root);
      terminal.success(`Capacidades deshabilitadas: ${capabilities.join(', ')}.`);
    });

  capacitor
    .command('doctor [platform]')
    .description('Muestra requisitos y configuración pendiente de las capacidades')
    .action((platform?: string) => {
      const root = requireApplicationRoot(process.cwd());
      const selectedPlatform = platform ? parsePlatform(platform) : undefined;
      terminal.heading('Diagnóstico de capacidades');
      for (const message of diagnoseNativeCapabilities(root, selectedPlatform))
        terminal.item(message);
    });

  capacitor
    .command('permissions [platform]')
    .description('Muestra permisos, credenciales y requisitos de las capacidades habilitadas')
    .action((platform?: string) => {
      const root = requireApplicationRoot(process.cwd());
      const selectedPlatform = platform ? parsePlatform(platform) : undefined;
      printCapabilityRequirements(root, selectedPlatform);
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

function printCapabilityRequirements(root: string, platform?: Platform): void {
  const enabled = listNativeCapabilities(root).filter((status) => status.enabled);

  if (enabled.length === 0) {
    terminal.warning('No hay capacidades nativas habilitadas.');
    return;
  }

  terminal.heading('Permisos y requisitos nativos');
  for (const { definition } of enabled) {
    terminal.section(definition.name);
    terminal.keyValue('Plataformas', definition.platforms.join(', '));

    if (platform && !definition.platforms.includes(platform)) {
      terminal.warning(`No es compatible con ${platform}.`);
      continue;
    }

    if ((!platform || platform === 'android') && definition.minimumAndroidSdk) {
      terminal.keyValue('Android', `SDK mínimo ${definition.minimumAndroidSdk}`);
    }

    printPlatformValues('Permisos Android', definition.permissions?.android, platform, 'android');
    printPlatformValues('Permisos iOS', definition.permissions?.ios, platform, 'ios');
    printPlatformValues(
      'Credenciales Android',
      definition.credentials?.android,
      platform,
      'android',
    );
    printPlatformValues('Credenciales iOS', definition.credentials?.ios, platform, 'ios');
    printPlatformValues('Credenciales web', definition.credentials?.web, platform, undefined);

    for (const note of definition.notes ?? []) terminal.item(`Requisito: ${note}`);
  }
}

function printPlatformValues(
  label: string,
  values: readonly string[] | undefined,
  selectedPlatform: Platform | undefined,
  targetPlatform: Platform | undefined,
): void {
  if (!values || (targetPlatform && selectedPlatform && targetPlatform !== selectedPlatform))
    return;
  terminal.keyValue(label, values.join(', '));
}

function buildMobileShell(root: string): void {
  if (!existsSync(join(root, 'capacitor.config.ts'))) {
    throw new Error(
      'Esta versión de shell no incluye Capacitor. Usa una shell v0.1.2 o posterior.',
    );
  }
  const configuration = readApplicationConfiguration(root);
  const manifest = createProductionRemoteManifest(configuration);
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
