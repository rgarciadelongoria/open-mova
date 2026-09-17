import type { Command } from 'commander';
import { writeMicrofrontendDeploymentDescriptor } from '../application/deployment-artifact.js';
import { buildLocalMicrofrontend } from '../application/microfrontend-build.js';
import {
  readApplicationConfiguration,
  requireApplicationRoot,
} from '../application/configuration.js';
import { normalizeName } from '../utils/names.js';
import { terminal } from '../ui/terminal.js';

export function registerDeployCommand(program: Command): void {
  program
    .command('deploy <microfrontend>')
    .description('Genera un artefacto de MF para el CI del proveedor, sin publicarlo')
    .action((microfrontend: string) => {
      const applicationRoot = requireApplicationRoot(process.cwd());
      const configuration = readApplicationConfiguration(applicationRoot);
      const name = normalizeName(microfrontend, 'El nombre del microfrontal');
      const build = buildLocalMicrofrontend(applicationRoot, configuration, name);
      const descriptor = writeMicrofrontendDeploymentDescriptor(build);

      terminal.heading('Artefacto de microfrontal');
      terminal.success(`Listo en ${build.outputDirectory}.`);
      terminal.info(
        `Publica todo ese directorio y conserva ${descriptor.remoteEntry} y sus assets.`,
      );
      terminal.item('El CLI no realiza el despliegue ni selecciona el proveedor de hosting.');
    });
}
