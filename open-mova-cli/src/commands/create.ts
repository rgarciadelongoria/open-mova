import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Command } from 'commander';
import { createMicrofrontend } from '../application/microfrontend.js';
import { addMicrofrontend, writeApplicationConfiguration } from '../application/configuration.js';
import { synchronizeShellConfiguration } from '../application/shell-configuration.js';
import {
  configureDownloadedShell,
  DEMO_MICROFRONTEND_REMOTE_ENTRY,
  downloadShell,
} from '../application/shell-repository.js';
import type { OpenMovaApplicationConfiguration } from '../types.js';
import { normalizeName } from '../utils/names.js';
import { changeDirectoryCommand } from '../utils/platform.js';

interface CreateCommandOptions {
  readonly directory?: string;
  readonly empty?: boolean;
  readonly shellVersion?: string;
}

export function registerCreateCommand(program: Command): void {
  program
    .command('create <name>')
    .description('Crea una aplicación Open Mova con una shell y un microfrontal inicial')
    .option('-d, --directory <path>', 'directorio donde crear la aplicación')
    .option('--empty', 'no crear el microfrontal inicial')
    .option('--shell-version <tag>', 'tag de la shell, por ejemplo v0.1.4')
    .action((name: string, options: CreateCommandOptions) => {
      const applicationName = normalizeName(name, 'El nombre de la aplicación');
      const applicationRoot = resolve(options.directory ?? join(process.cwd(), applicationName));

      if (existsSync(applicationRoot)) {
        throw new Error(`Ya existe un directorio en ${applicationRoot}.`);
      }

      mkdirSync(dirname(applicationRoot), { recursive: true });
      const temporaryApplication = mkdtempSync(join(dirname(applicationRoot), '.mova-create-'));

      let shellVersion: string;

      try {
        const shell = downloadShell(temporaryApplication, options.shellVersion);
        shellVersion = shell.version;
        configureDownloadedShell(temporaryApplication, applicationName, !options.empty);

        let configuration: OpenMovaApplicationConfiguration = {
          schemaVersion: 3,
          name: applicationName,
          shell,
          native: { capabilities: [] },
          microfrontends: [],
        };

        if (!options.empty) {
          const starterMicrofrontend = createMicrofrontend(temporaryApplication, configuration, {
            name: 'home',
            directory: join('mfs', 'home'),
            profile: 'demo',
            templateVersion: shell.version,
            productionRemoteEntry: DEMO_MICROFRONTEND_REMOTE_ENTRY,
          });

          configuration = addMicrofrontend(configuration, starterMicrofrontend);
        }

        writeApplicationConfiguration(temporaryApplication, configuration);
        synchronizeShellConfiguration(temporaryApplication, configuration);
        if (existsSync(applicationRoot)) {
          throw new Error(`Ya existe un directorio en ${applicationRoot}.`);
        }
        renameSync(temporaryApplication, applicationRoot);
      } finally {
        rmSync(temporaryApplication, { recursive: true, force: true });
      }

      console.log(`Aplicación creada en ${applicationRoot} con shell ${shellVersion}.`);
      console.log('Instala las dependencias antes de iniciar el desarrollo:');
      console.log(`  ${changeDirectoryCommand(applicationRoot)}`);
      console.log('  npm install');
      if (!options.empty) {
        console.log('  npm --prefix mfs/home install');
      }
    });
}
