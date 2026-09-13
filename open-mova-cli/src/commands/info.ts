import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Command } from 'commander';

export function registerInfoCommand(program: Command): void {
  program
    .command('info')
    .description('Comprueba si la carpeta actual contiene una aplicación Open Mova')
    .action(() => {
      const currentDirectory = resolve(process.cwd());
      const angularWorkspace = existsSync(resolve(currentDirectory, 'angular.json'));

      console.log(`Directorio: ${currentDirectory}`);
      console.log(`Workspace Angular: ${angularWorkspace ? 'sí' : 'no'}`);
    });
}
