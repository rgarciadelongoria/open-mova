import { existsSync } from 'node:fs';
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import type { Command } from 'commander';
import {
  readApplicationConfiguration,
  requireApplicationRoot,
} from '../application/configuration.js';
import { npmCommand, useCommandShell } from '../utils/platform.js';

interface StartCommandOptions {
  readonly shellOnly?: boolean;
}

export function registerStartCommand(program: Command): void {
  program
    .command('start')
    .description('Inicia la shell y los microfrontales locales registrados')
    .option('--shell-only', 'inicia solo la shell')
    .action(async (options: StartCommandOptions) => {
      const applicationRoot = requireApplicationRoot(process.cwd());
      const configuration = readApplicationConfiguration(applicationRoot);
      const projects: Array<{ readonly directory: string; readonly label: string }> = [];

      if (!options.shellOnly) {
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

          projects.push({
            directory: projectDirectory,
            label: `MF ${microfrontend.name}`,
          });
        }
      }

      projects.push({ directory: applicationRoot, label: 'Shell' });

      console.log('Iniciando proyectos. Pulsa Ctrl+C para detenerlos.');
      await startProjects(projects);
    });
}

async function startProjects(
  projects: readonly { readonly directory: string; readonly label: string }[],
): Promise<void> {
  const children = projects.map(({ directory, label }) => {
    console.log(`- ${label}: ${directory}`);
    return spawn(npmCommand(), ['run', 'start'], {
      cwd: directory,
      stdio: 'inherit',
      shell: useCommandShell(),
    });
  });

  const stopChildren = (): void => {
    for (const child of children) {
      child.kill('SIGTERM');
    }
  };

  const stopOnSignal = (): void => {
    stopChildren();
  };

  process.once('SIGINT', stopOnSignal);
  process.once('SIGTERM', stopOnSignal);

  try {
    const result = await Promise.race(children.map(waitForExit));

    if (result.code !== 0 && result.signal === null) {
      throw new Error('Uno de los servidores de desarrollo ha terminado con error.');
    }
  } finally {
    process.removeListener('SIGINT', stopOnSignal);
    process.removeListener('SIGTERM', stopOnSignal);
    stopChildren();
  }
}

function waitForExit(
  child: ChildProcess,
): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
}
