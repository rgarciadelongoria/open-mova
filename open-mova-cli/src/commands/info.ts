import { resolve } from 'node:path';
import type { Command } from 'commander';
import { findApplicationRoot, readApplicationConfiguration } from '../application/configuration.js';
import { terminal } from '../ui/terminal.js';

export function registerInfoCommand(program: Command): void {
  program
    .command('info')
    .description('Muestra la aplicación Open Mova encontrada desde la carpeta actual')
    .action(() => {
      const currentDirectory = resolve(process.cwd());
      const applicationRoot = findApplicationRoot(currentDirectory);

      terminal.heading('Información de aplicación');
      terminal.keyValue('Directorio actual', currentDirectory);

      if (!applicationRoot) {
        terminal.warning('No se ha encontrado una aplicación Open Mova.');
        return;
      }

      const configuration = readApplicationConfiguration(applicationRoot);

      terminal.keyValue('Aplicación', configuration.name);
      terminal.keyValue('Raíz', applicationRoot);
      if (configuration.shell) {
        terminal.keyValue(
          'Shell',
          `${configuration.shell.version} (${configuration.shell.commit.slice(0, 7)})`,
        );
      }
      terminal.section(`Microfrontales (${configuration.microfrontends.length})`);

      for (const microfrontend of configuration.microfrontends) {
        terminal.item(`${microfrontend.name}  →  /${microfrontend.route}`, 'accent');
      }
    });
}
