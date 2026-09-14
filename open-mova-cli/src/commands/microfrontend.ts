import { join } from 'node:path';
import type { Command } from 'commander';
import { createMicrofrontend, inspectExistingMicrofrontend } from '../application/microfrontend.js';
import {
  addMicrofrontend,
  readApplicationConfiguration,
  requireApplicationRoot,
  writeApplicationConfiguration,
} from '../application/configuration.js';
import { synchronizeShellConfiguration } from '../application/shell-configuration.js';
import { normalizeName } from '../utils/names.js';
import { listShellVersions } from '../application/shell-repository.js';

interface CreateMicrofrontendCommandOptions {
  readonly directory?: string;
  readonly route?: string;
  readonly port?: number;
  readonly productionRemoteEntry?: string;
  readonly templateVersion?: string;
  readonly demo?: boolean;
}

interface AddMicrofrontendCommandOptions {
  readonly name?: string;
  readonly route?: string;
  readonly remote?: string;
  readonly remoteEntry?: string;
  readonly port?: number;
  readonly productionRemoteEntry?: string;
}

export function registerMicrofrontendCommands(program: Command): void {
  const microfrontend = program
    .command('mf')
    .description('Crea y registra microfrontales de una aplicación Open Mova');

  microfrontend
    .command('create <name>')
    .description('Crea un microfrontal local y lo registra en la aplicación')
    .option('-d, --directory <path>', 'ruta relativa a la raíz de la aplicación')
    .option('--route <path>', 'ruta pública en la shell')
    .option('--port <number>', 'puerto de desarrollo', parsePort)
    .option('--production-remote-entry <url>', 'URL HTTPS del remoto publicado')
    .option('--template-version <tag>', 'tag del proyecto de microfrontal')
    .option('--demo', 'usar el perfil con ejemplos en vez del mínimo')
    .action((name: string, options: CreateMicrofrontendCommandOptions) => {
      const applicationRoot = requireApplicationRoot(process.cwd());
      const configuration = readApplicationConfiguration(applicationRoot);
      const normalizedName = normalizeName(name, 'El nombre del microfrontal');
      const templateVersion = options.templateVersion ?? (
        options.demo ? configuration.shell?.version : undefined
      ) ?? listShellVersions()[0];
      if (!templateVersion) {
        throw new Error('No hay tags estables disponibles para crear el microfrontal.');
      }
      if (options.demo && configuration.shell?.version !== templateVersion) {
        throw new Error('El perfil demo debe usar el mismo tag que la shell para mantener compatible el contrato nativo.');
      }
      const microfrontendConfiguration = createMicrofrontend(
        applicationRoot,
        configuration,
        {
          name: normalizedName,
          directory: options.directory ?? join('mfs', normalizedName),
          route: options.route,
          port: options.port,
          productionRemoteEntry: options.productionRemoteEntry,
          templateVersion,
          profile: options.demo ? 'demo' : 'minimal',
        },
      );
      const updatedConfiguration = addMicrofrontend(
        configuration,
        microfrontendConfiguration,
      );

      writeApplicationConfiguration(applicationRoot, updatedConfiguration);
      synchronizeShellConfiguration(applicationRoot, updatedConfiguration);

      console.log(`Microfrontal "${microfrontendConfiguration.name}" creado.`);
      console.log(`Ruta pública: /${microfrontendConfiguration.route}`);
      console.log(`Directorio: ${microfrontendConfiguration.sourcePath}`);
    });

  microfrontend
    .command('add [source-path]')
    .description('Registra un microfrontal local o uno ya desplegado')
    .option('--name <name>', 'nombre del microfrontal')
    .option('--route <path>', 'ruta pública en la shell')
    .option('--remote <name>', 'nombre definido en federation.config.js')
    .option('--remote-entry <url>', 'URL del remoteEntry.json')
    .option('--port <number>', 'puerto de desarrollo para un proyecto local', parsePort)
    .option('--production-remote-entry <url>', 'URL HTTPS del remoto publicado')
    .action((sourcePath: string | undefined, options: AddMicrofrontendCommandOptions) => {
      const applicationRoot = requireApplicationRoot(process.cwd());
      const configuration = readApplicationConfiguration(applicationRoot);
      const microfrontendConfiguration = inspectExistingMicrofrontend(applicationRoot, {
        sourcePath,
        name: options.name,
        route: options.route,
        remoteName: options.remote,
        remoteEntry: options.remoteEntry,
        port: options.port,
        productionRemoteEntry: options.productionRemoteEntry,
      });
      const updatedConfiguration = addMicrofrontend(
        configuration,
        microfrontendConfiguration,
      );

      writeApplicationConfiguration(applicationRoot, updatedConfiguration);
      synchronizeShellConfiguration(applicationRoot, updatedConfiguration);

      console.log(`Microfrontal "${microfrontendConfiguration.name}" registrado.`);
      console.log(`Ruta pública: /${microfrontendConfiguration.route}`);
    });
}

function parsePort(value: string): number {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('El puerto debe ser un número entero entre 1 y 65535.');
  }

  return port;
}
