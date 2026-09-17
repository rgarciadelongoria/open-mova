import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { MicrofrontendConfiguration, OpenMovaApplicationConfiguration } from '../types.js';
import { npmCommand, useCommandShell } from '../utils/platform.js';

export interface BuiltMicrofrontend {
  readonly configuration: MicrofrontendConfiguration;
  readonly projectRoot: string;
  readonly outputDirectory: string;
}

/** Compila un MF local y comprueba que Native Federation generó su entrada remota. */
export function buildLocalMicrofrontend(
  applicationRoot: string,
  configuration: OpenMovaApplicationConfiguration,
  name: string,
): BuiltMicrofrontend {
  const microfrontend = configuration.microfrontends.find((entry) => entry.name === name);

  if (!microfrontend) {
    throw new Error(`No existe un microfrontal llamado "${name}".`);
  }

  if (!microfrontend.sourcePath) {
    throw new Error(
      `El MF ${name} solo está registrado como remoto y no se puede compilar desde esta aplicación.`,
    );
  }

  const projectRoot = resolve(applicationRoot, microfrontend.sourcePath);
  if (!existsSync(projectRoot)) {
    throw new Error(`No se encuentra el microfrontal "${name}" en ${projectRoot}.`);
  }

  runBuild(projectRoot, `microfrontal ${name}`);

  const outputDirectory = join(projectRoot, 'dist', 'browser');
  if (!existsSync(join(outputDirectory, 'remoteEntry.json'))) {
    throw new Error(
      `La compilación de ${name} no generó dist/browser/remoteEntry.json. Revisa su configuración de Native Federation.`,
    );
  }

  return { configuration: microfrontend, projectRoot, outputDirectory };
}

function runBuild(directory: string, label: string): void {
  console.log(`Compilando ${label}...`);

  const result = spawnSync(npmCommand(), ['run', 'build'], {
    cwd: directory,
    stdio: 'inherit',
    shell: useCommandShell(),
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`La compilación de ${label} no ha finalizado correctamente.`);
  }
}
