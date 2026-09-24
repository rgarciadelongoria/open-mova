import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import type { Command } from 'commander';
import { createMicrofrontend } from '../application/microfrontend.js';
import { downloadTaggedProject } from '../application/shell-repository.js';
import { addMicrofrontend, writeApplicationConfiguration } from '../application/configuration.js';
import { synchronizeShellConfiguration } from '../application/shell-configuration.js';
import {
  configureDownloadedShell,
  DEMO_MICROFRONTEND_REMOTE_ENTRY,
  DEMO_CALCULATOR_REMOTE_ENTRY,
  downloadShell,
} from '../application/shell-repository.js';
import type { OpenMovaApplicationConfiguration } from '../types.js';
import { normalizeName } from '../utils/names.js';
import { changeDirectoryCommand, npmCommand, useCommandShell } from '../utils/platform.js';
import { confirm, terminal } from '../ui/terminal.js';

interface CreateCommandOptions {
  readonly directory?: string;
  readonly empty?: boolean;
  readonly shellVersion?: string;
}

export function registerCreateCommand(program: Command): void {
  program
    .command('create <name>')
    .description('Crea una aplicación Open Mova con shell y dos microfrontales demo')
    .option('-d, --directory <path>', 'directorio donde crear la aplicación')
    .option('--empty', 'crear solo la shell, sin microfrontales demo')
    .option('--shell-version <tag>', 'tag de la shell, por ejemplo v0.1.4')
    .action(async (name: string, options: CreateCommandOptions) => {
      const applicationName = normalizeName(name, 'El nombre de la aplicación');
      const applicationRoot = resolve(options.directory ?? join(process.cwd(), applicationName));

      if (existsSync(applicationRoot)) {
        throw new Error(`Ya existe un directorio en ${applicationRoot}.`);
      }

      mkdirSync(dirname(applicationRoot), { recursive: true });
      const temporaryApplication = mkdtempSync(join(dirname(applicationRoot), '.mova-create-'));

      let shellVersion: string;

      try {
        const shell = downloadShell(temporaryApplication, options.shellVersion);
        shellVersion = shell.version;
        configureDownloadedShell(temporaryApplication, applicationName, !options.empty);

        let configuration: OpenMovaApplicationConfiguration = {
          schemaVersion: 5,
          name: applicationName,
          shell,
          native: { capabilities: [] },
          security: {
            trustedRemoteOrigins: options.empty
              ? []
              : [new URL(DEMO_MICROFRONTEND_REMOTE_ENTRY).origin],
          },
          microfrontends: [],
        };

        if (!options.empty) {
          const sourcePath = join(temporaryApplication, '.mova-template-source');
          const template = downloadTaggedProject(
            'open-mova-mf-template',
            sourcePath,
            shell.version,
          );
          const templateSource = { path: sourcePath, version: template };
          const starterMicrofrontend = createMicrofrontend(temporaryApplication, configuration, {
            name: 'home',
            directory: join('mfs', 'home'),
            profile: 'demo',
            templateVersion: shell.version,
            productionRemoteEntry: DEMO_MICROFRONTEND_REMOTE_ENTRY,
            templateSource,
          });

          configuration = addMicrofrontend(configuration, starterMicrofrontend);
          const calculator = createMicrofrontend(temporaryApplication, configuration, {
            name: 'calculator',
            directory: join('mfs', 'calculator'),
            profile: 'calculator',
            templateSource,
            productionRemoteEntry: DEMO_CALCULATOR_REMOTE_ENTRY,
          });
          configuration = addMicrofrontend(configuration, calculator);
          rmSync(sourcePath, { recursive: true, force: true });
        }

        writeApplicationConfiguration(temporaryApplication, configuration);
        synchronizeShellConfiguration(temporaryApplication, configuration);
        if (existsSync(applicationRoot)) {
          throw new Error(`Ya existe un directorio en ${applicationRoot}.`);
        }
        renameSync(temporaryApplication, applicationRoot);
      } finally {
        rmSync(temporaryApplication, { recursive: true, force: true });
      }

      terminal.heading(
        'Aplicación creada',
        options.empty
          ? 'La shell está preparada.'
          : 'La shell y los microfrontales home y calculator están preparados.',
      );
      terminal.success(`Creada en ${applicationRoot} con shell ${shellVersion}.`);
      terminal.section('Siguientes pasos');
      terminal.command(changeDirectoryCommand(applicationRoot));
      terminal.command('npm install');
      if (!options.empty) {
        terminal.command('npm --prefix mfs/home install');
        terminal.command('npm --prefix mfs/calculator install');
      }

      await offerDependencyInstallation(applicationRoot, !options.empty);
    });
}

/** Se ejecuta después del rename: una instalación fallida nunca elimina el proyecto creado. */
export async function offerDependencyInstallation(
  applicationRoot: string,
  includesMicrofrontend: boolean,
  ask: (message: string) => Promise<boolean> = confirm,
  install: (directory: string, label: string) => void = installDependencies,
): Promise<void> {
  if (!(await ask('¿Quieres instalar ahora las dependencias?'))) return;

  const projects = [
    { directory: applicationRoot, label: 'la aplicación', command: 'npm install' },
    ...(includesMicrofrontend
      ? [
          {
            directory: join(applicationRoot, 'mfs', 'home'),
            label: 'el MF home',
            command: 'npm --prefix mfs/home install',
          },
          {
            directory: join(applicationRoot, 'mfs', 'calculator'),
            label: 'el MF calculator',
            command: 'npm --prefix mfs/calculator install',
          },
        ]
      : []),
  ];

  for (const project of projects) {
    terminal.info(`Instalando dependencias para ${project.label}...`);
    try {
      install(project.directory, project.label);
    } catch (error) {
      terminal.warning(`La aplicación se conserva en ${applicationRoot}.`);
      terminal.section('Para reanudar la instalación');
      terminal.command(changeDirectoryCommand(applicationRoot));
      terminal.command(project.command);
      throw error;
    }
    terminal.success(`Dependencias instaladas para ${project.label}.`);
  }
}

function installDependencies(directory: string, label: string): void {
  const result = spawnSync(npmCommand(), ['install'], {
    cwd: directory,
    stdio: 'inherit',
    shell: useCommandShell(),
  });

  if (result.error) {
    throw new Error(
      `No se pudieron instalar las dependencias para ${label}: ${result.error.message}`,
    );
  }
  if (result.status !== 0) {
    throw new Error(
      `La instalación para ${label} terminó con código ${result.status ?? 'desconocido'}.`,
    );
  }
}
