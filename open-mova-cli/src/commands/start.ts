import { existsSync } from 'node:fs';
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import type { Command } from 'commander';
import {
  readApplicationConfiguration,
  requireApplicationRoot,
} from '../application/configuration.js';
import { npmCommand, useCommandShell } from '../utils/platform.js';
import { terminal } from '../ui/terminal.js';

interface StartCommandOptions {
  readonly shellOnly?: boolean;
}

interface DevelopmentProject {
  readonly directory: string;
  readonly label: string;
  readonly url: string;
}

export function registerStartCommand(program: Command): void {
  program
    .command('start')
    .description('Inicia la shell y los microfrontales locales registrados')
    .option('--shell-only', 'inicia solo la shell')
    .action(async (options: StartCommandOptions) => {
      const applicationRoot = requireApplicationRoot(process.cwd());
      const configuration = readApplicationConfiguration(applicationRoot);
      const projects: DevelopmentProject[] = [];

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
            url: new URL(microfrontend.developmentRemoteEntry).origin,
          });
        }
      }

      projects.push({ directory: applicationRoot, label: 'Shell', url: 'http://localhost:4200' });

      terminal.heading('Servidores de desarrollo');
      await startProjects(projects);
    });
}

async function startProjects(projects: readonly DevelopmentProject[]): Promise<void> {
  const children = projects.map(({ directory }) => {
    const child = spawn(npmCommand(), ['run', 'start'], {
      cwd: directory,
      stdio: 'inherit',
      shell: useCommandShell(),
    });
    return { child, exit: waitForExit(child) };
  });

  terminal.section('Direcciones locales');
  terminal.table(
    ['Proyecto', 'URL'],
    projects.map(({ label, url }) => [label, url]),
  );
  terminal.info('Pulsa Ctrl+C para detener todos los servidores.');

  const stopChildren = (): void => {
    for (const { child } of children) {
      child.kill('SIGTERM');
    }
  };

  const stopOnSignal = (): void => {
    stopChildren();
  };

  process.once('SIGINT', stopOnSignal);
  process.once('SIGTERM', stopOnSignal);

  try {
    const result = await Promise.race(children.map(({ exit }) => exit));

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
