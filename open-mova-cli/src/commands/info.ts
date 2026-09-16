import { resolve } from 'node:path';
import type { Command } from 'commander';
import { findApplicationRoot, readApplicationConfiguration } from '../application/configuration.js';

export function registerInfoCommand(program: Command): void {
  program
    .command('info')
    .description('Muestra la aplicación Open Mova encontrada desde la carpeta actual')
    .action(() => {
      const currentDirectory = resolve(process.cwd());
      const applicationRoot = findApplicationRoot(currentDirectory);

      console.log(`Directorio actual: ${currentDirectory}`);

      if (!applicationRoot) {
        console.log('Aplicación Open Mova: no encontrada');
        return;
      }

      const configuration = readApplicationConfiguration(applicationRoot);

      console.log(`Aplicación Open Mova: ${configuration.name}`);
      console.log(`Raíz de la aplicación: ${applicationRoot}`);
      if (configuration.shell) {
        console.log(
          `Shell: ${configuration.shell.version} (${configuration.shell.commit.slice(0, 7)})`,
        );
      }
      console.log(`Microfrontales registrados: ${configuration.microfrontends.length}`);

      for (const microfrontend of configuration.microfrontends) {
        console.log(`- ${microfrontend.name} → /${microfrontend.route}`);
      }
    });
}
