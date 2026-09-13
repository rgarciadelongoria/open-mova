import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Command } from 'commander';
import { createMicrofrontend } from '../application/microfrontend.js';
import {
  addMicrofrontend,
  writeApplicationConfiguration,
} from '../application/configuration.js';
import { synchronizeShellConfiguration } from '../application/shell-configuration.js';
import type { OpenMovaApplicationConfiguration } from '../types.js';
import { normalizeName } from '../utils/names.js';
import { copyTemplate } from '../utils/templates.js';

interface CreateCommandOptions {
  readonly directory?: string;
  readonly empty?: boolean;
}

export function registerCreateCommand(program: Command): void {
  program
    .command('create <name>')
    .description('Crea una aplicación Open Mova con una shell y un microfrontal inicial')
    .option('-d, --directory <path>', 'directorio donde crear la aplicación')
    .option('--empty', 'no crear el microfrontal inicial')
    .action((name: string, options: CreateCommandOptions) => {
      const applicationName = normalizeName(name, 'El nombre de la aplicación');
      const applicationRoot = resolve(
        options.directory ?? join(process.cwd(), applicationName),
      );

      if (existsSync(applicationRoot)) {
        throw new Error(`Ya existe un directorio en ${applicationRoot}.`);
      }

      mkdirSync(dirname(applicationRoot), { recursive: true });
      copyTemplate('application', applicationRoot, {
        '__APPLICATION_NAME__': applicationName,
        '__APPLICATION_PACKAGE_NAME__': applicationName.replaceAll('-', ''),
      });

      let configuration: OpenMovaApplicationConfiguration = {
        schemaVersion: 1,
        name: applicationName,
        microfrontends: [],
      };

      if (!options.empty) {
        const starterMicrofrontend = createMicrofrontend(
          applicationRoot,
          configuration,
          {
            name: 'home',
            directory: join('mfs', 'home'),
          },
        );

        configuration = addMicrofrontend(configuration, starterMicrofrontend);
      }

      writeApplicationConfiguration(applicationRoot, configuration);
      synchronizeShellConfiguration(applicationRoot, configuration);

      console.log(`Aplicación creada en ${applicationRoot}`);
      console.log('Instala las dependencias antes de iniciar el desarrollo:');
      console.log(`  cd ${applicationRoot}`);
      console.log('  npm install');

      if (!options.empty) {
        console.log('  npm --prefix mfs/home install');
      }
    });
}
