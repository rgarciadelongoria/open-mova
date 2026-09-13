import type { Command } from 'commander';
import { listShellVersions } from '../application/shell-repository.js';

export function registerShellCommands(program: Command): void {
  program
    .command('shell')
    .description('Consulta las versiones publicadas de la shell')
    .command('versions')
    .description('Muestra los tags estables disponibles en el repositorio')
    .action(() => {
      const versions = listShellVersions();
      if (versions.length === 0) {
        console.log('No hay versiones estables disponibles.');
        return;
      }

      for (const [index, version] of versions.entries()) {
        console.log(index === 0 ? `${version} (última)` : version);
      }
    });
}
