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
import {
  applyMicrofrontendUpdate,
  createMicrofrontendUpdatePlan,
} from '../application/microfrontend-update.js';

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
  readonly coreVersion?: string;
}

interface UpdateMicrofrontendCommandOptions {
  readonly check?: boolean;
  readonly to?: string;
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
      const templateVersion =
        options.templateVersion ??
        (options.demo ? configuration.shell?.version : undefined) ??
        listShellVersions()[0];
      if (!templateVersion) {
        throw new Error('No hay tags estables disponibles para crear el microfrontal.');
      }
      if (options.demo && configuration.shell?.version !== templateVersion) {
        throw new Error(
          'El perfil demo debe usar el mismo tag que la shell para mantener compatible el contrato nativo.',
        );
      }
      const microfrontendConfiguration = createMicrofrontend(applicationRoot, configuration, {
        name: normalizedName,
        directory: options.directory ?? join('mfs', normalizedName),
        route: options.route,
        port: options.port,
        productionRemoteEntry: options.productionRemoteEntry,
        templateVersion,
        profile: options.demo ? 'demo' : 'minimal',
      });
      const updatedConfiguration = addMicrofrontend(configuration, microfrontendConfiguration);

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
    .option('--core-version <range>', 'rango requerido de @open-mova/core')
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
        coreVersion: options.coreVersion,
      });
      const updatedConfiguration = addMicrofrontend(configuration, microfrontendConfiguration);

      writeApplicationConfiguration(applicationRoot, updatedConfiguration);
      synchronizeShellConfiguration(applicationRoot, updatedConfiguration);

      console.log(`Microfrontal "${microfrontendConfiguration.name}" registrado.`);
      console.log(`Ruta pública: /${microfrontendConfiguration.route}`);
    });

  microfrontend
    .command('update <name>')
    .description('Actualiza un microfrontal creado desde la plantilla de Open Mova')
    .option('--check', 'mostrar los cambios sin modificar archivos')
    .option('--to <tag>', 'versión de destino, por ejemplo v0.2.1')
    .action((name: string, options: UpdateMicrofrontendCommandOptions) => {
      const applicationRoot = requireApplicationRoot(process.cwd());
      const configuration = readApplicationConfiguration(applicationRoot);
      const normalizedName = normalizeName(name, 'El nombre del microfrontal');
      const plan = createMicrofrontendUpdatePlan(
        applicationRoot,
        configuration,
        normalizedName,
        options.to,
      );

      console.log(`Plantilla actual: ${plan.currentVersion}`);
      console.log(`Plantilla destino: ${plan.target.version}`);
      for (const change of plan.changes) console.log(`- ${change}`);
      if (plan.conflicts.length > 0) {
        console.log('Conflictos que no se sobrescribirán:');
        for (const conflict of plan.conflicts) console.log(`- ${conflict}`);
      }
      if (options.check) return;
      if (plan.conflicts.length > 0) {
        throw new Error('Resuelve los conflictos antes de actualizar el microfrontal.');
      }
      if (plan.changes.length === 0) {
        console.log('El microfrontal ya está actualizado.');
        return;
      }

      applyMicrofrontendUpdate(applicationRoot, configuration, plan);
      console.log(`Microfrontal "${normalizedName}" actualizado a ${plan.target.version}.`);
      if (plan.removePackageLock) {
        console.log(`Ejecuta npm install en ${plan.projectRoot}.`);
      }
    });
}

function parsePort(value: string): number {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('El puerto debe ser un número entero entre 1 y 65535.');
  }

  return port;
}
