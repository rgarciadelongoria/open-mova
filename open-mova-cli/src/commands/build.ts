import { existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import type { Command } from 'commander';
import {
  readApplicationConfiguration,
  requireApplicationRoot,
} from '../application/configuration.js';
import { createProductionRemoteManifest } from '../application/remote-security.js';
import { buildLocalMicrofrontend } from '../application/microfrontend-build.js';
import { npmCommand, useCommandShell } from '../utils/platform.js';
import { terminal } from '../ui/terminal.js';

interface BuildCommandOptions {
  readonly production?: boolean;
}

export function registerBuildCommand(program: Command): void {
  program
    .command('build')
    .description('Compila los microfrontales locales y después la shell')
    .option('--production', 'usar remotos HTTPS versionados y de confianza en el artefacto final')
    .action((options: BuildCommandOptions) => {
      const applicationRoot = requireApplicationRoot(process.cwd());
      const configuration = readApplicationConfiguration(applicationRoot);

      for (const microfrontend of configuration.microfrontends) {
        if (!microfrontend.sourcePath) {
          continue;
        }

        buildLocalMicrofrontend(applicationRoot, configuration, microfrontend.name);
      }

      runShellBuild(applicationRoot);

      if (options.production) {
        writeProductionManifest(applicationRoot, configuration);
      }
    });
}

function writeProductionManifest(
  applicationRoot: string,
  configuration: ReturnType<typeof readApplicationConfiguration>,
): void {
  const outputDirectory = join(applicationRoot, 'dist', 'browser');

  if (!existsSync(join(outputDirectory, 'index.html'))) {
    throw new Error(`No se encuentra la shell compilada en ${outputDirectory}.`);
  }

  const manifest = createProductionRemoteManifest(configuration);
  writeFileSync(
    join(outputDirectory, 'assets', 'federation.manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
  terminal.success('El artefacto de producción usa únicamente remotos HTTPS de confianza.');
}

function runShellBuild(applicationRoot: string): void {
  terminal.info('Compilando shell...');

  const result = spawnSync(npmCommand(), ['run', 'build'], {
    cwd: applicationRoot,
    stdio: 'inherit',
    shell: useCommandShell(),
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error('La compilación de la shell no ha finalizado correctamente.');
  }
}
