import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import type { Command } from 'commander';
import {
  readApplicationConfiguration,
  requireApplicationRoot,
} from '../application/configuration.js';
import { createProductionRemoteManifest } from '../application/remote-security.js';
import { npmCommand, useCommandShell } from '../utils/platform.js';

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

        const projectDirectory = resolve(applicationRoot, microfrontend.sourcePath);

        if (!existsSync(projectDirectory)) {
          throw new Error(
            `No se encuentra el microfrontal "${microfrontend.name}" en ${projectDirectory}.`,
          );
        }

        runBuild(projectDirectory, `microfrontal ${microfrontend.name}`);
      }

      runBuild(applicationRoot, 'shell');

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
  console.log('El artefacto de producción usa únicamente remotos HTTPS de confianza.');
}

function runBuild(directory: string, label: string): void {
  console.log(`Compilando ${label}...`);

  const result = spawnSync(npmCommand(), ['run', 'build'], {
    cwd: directory,
    stdio: 'inherit',
    shell: useCommandShell(),
  });

  if (result.status !== 0) {
    throw new Error(`La compilación de ${label} no ha finalizado correctamente.`);
  }
}
