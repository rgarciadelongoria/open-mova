import type { Command } from 'commander';
import { listShellVersions } from '../application/shell-repository.js';
import { terminal } from '../ui/terminal.js';

export function registerShellCommands(program: Command): void {
  program
    .command('shell')
    .description('Consulta las versiones publicadas de la shell')
    .command('versions')
    .description('Muestra los tags estables disponibles en el repositorio')
    .action(() => {
      const versions = listShellVersions();
      terminal.heading('Versiones de shell');
      if (versions.length === 0) {
        terminal.warning('No hay versiones estables disponibles.');
        return;
      }

      for (const [index, version] of versions.entries()) {
        terminal.item(
          index === 0 ? `${version} (última)` : version,
          index === 0 ? 'success' : 'muted',
        );
      }
    });
}
