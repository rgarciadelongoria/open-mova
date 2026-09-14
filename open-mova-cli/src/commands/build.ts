import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import type { Command } from 'commander';
import {
  readApplicationConfiguration,
  requireApplicationRoot,
} from '../application/configuration.js';
import { npmCommand } from '../utils/platform.js';

export function registerBuildCommand(program: Command): void {
  program
    .command('build')
    .description('Compila los microfrontales locales y después la shell')
    .action(() => {
      const applicationRoot = requireApplicationRoot(process.cwd());
      const configuration = readApplicationConfiguration(applicationRoot);

      for (const microfrontend of configuration.microfrontends) {
        if (!microfrontend.sourcePath) {
          continue;
        }

        const projectDirectory = resolve(applicationRoot, microfrontend.sourcePath);

        if (!existsSync(projectDirectory)) {
          throw new Error(
            `No se encuentra el microfrontal "${microfrontend.name}" en ${projectDirectory}.`,
          );
        }

        runBuild(projectDirectory, `microfrontal ${microfrontend.name}`);
      }

      runBuild(applicationRoot, 'shell');
    });
}

function runBuild(directory: string, label: string): void {
  console.log(`Compilando ${label}...`);

  const result = spawnSync(npmCommand(), ['run', 'build'], {
    cwd: directory,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`La compilación de ${label} no ha finalizado correctamente.`);
  }
}
