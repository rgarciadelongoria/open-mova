import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import type { MicrofrontendConfiguration, OpenMovaApplicationConfiguration } from '../types.js';
import { writeApplicationConfiguration } from './configuration.js';
import { readRequiredCoreVersion } from './microfrontend-manifest.js';
import { configureDownloadedMicrofrontend } from './microfrontend-profile.js';
import {
  applyFileChanges,
  compareManagedFiles,
  comparePackageConfiguration,
  type FileChange,
  requireCleanGitRepository,
} from './project-update.js';
import { downloadTaggedProject, listShellVersions, type ShellVersion } from './shell-repository.js';
import { synchronizeShellConfiguration } from './shell-configuration.js';

const GENERATED_PATHS = new Set(['package.json', 'package-lock.json']);

export interface MicrofrontendUpdatePlan {
  readonly microfrontend: MicrofrontendConfiguration;
  readonly projectRoot: string;
  readonly currentVersion: string;
  readonly target: ShellVersion;
  readonly targetCoreVersion: string;
  readonly targetComponents?: Readonly<Record<string, string>>;
  readonly changes: readonly string[];
  readonly conflicts: readonly string[];
  readonly fileChanges: readonly FileChange[];
  readonly packageContent?: string;
  readonly removePackageLock: boolean;
}

export function createMicrofrontendUpdatePlan(
  applicationRoot: string,
  configuration: OpenMovaApplicationConfiguration,
  name: string,
  requestedVersion?: string,
): MicrofrontendUpdatePlan {
  const microfrontend = configuration.microfrontends.find((entry) => entry.name === name);
  if (!microfrontend) throw new Error(`No existe un microfrontal llamado "${name}".`);
  if (!microfrontend.sourcePath || !microfrontend.template) {
    throw new Error(
      `El MF ${name} no fue creado desde una plantilla gestionada por Open Mova y no se puede actualizar automáticamente.`,
    );
  }

  const targetVersion = requestedVersion ?? listShellVersions()[0];
  if (!targetVersion) throw new Error('No hay versiones estables disponibles para actualizar.');
  if (compareVersions(targetVersion, microfrontend.template.version) < 0) {
    throw new Error('mova mf update no realiza downgrades de plantillas.');
  }

  const projectRoot = resolve(applicationRoot, microfrontend.sourcePath);
  const port = readPort(microfrontend.developmentRemoteEntry);
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'open-mova-mf-update-'));

  try {
    const currentDirectory = join(temporaryRoot, 'current');
    const targetDirectory = join(temporaryRoot, 'target');
    const current = downloadTaggedProject(
      'open-mova-mf-template',
      currentDirectory,
      microfrontend.template.version,
    );
    const target = downloadTaggedProject('open-mova-mf-template', targetDirectory, targetVersion);

    if (current.commit !== microfrontend.template.commit) {
      throw new Error(
        `El commit registrado para la plantilla ${microfrontend.template.version} no coincide con su tag.`,
      );
    }

    configureDownloadedMicrofrontend(
      currentDirectory,
      microfrontend.name,
      port,
      microfrontend.template.profile,
    );
    const targetExposures = configureDownloadedMicrofrontend(
      targetDirectory,
      microfrontend.name,
      port,
      microfrontend.template.profile,
    );

    const conflicts: string[] = [];
    const fileChanges = compareManagedFiles(
      projectRoot,
      currentDirectory,
      targetDirectory,
      conflicts,
      GENERATED_PATHS,
    );
    const packageContent = comparePackageConfiguration(
      projectRoot,
      currentDirectory,
      targetDirectory,
      conflicts,
    );
    const targetCoreVersion = readRequiredCoreVersion(targetDirectory);
    const targetComponents = targetExposures.components;
    const changes = [
      ...fileChanges.map(
        (change) => `${change.content ? 'Actualizar' : 'Eliminar'} ${change.path}`,
      ),
      ...(packageContent ? ['Actualizar package.json', 'Regenerar package-lock.json'] : []),
      ...(target.version === microfrontend.template.version
        ? []
        : [`Registrar plantilla ${target.version}`]),
      ...(targetCoreVersion === microfrontend.compatibility.requiredCoreVersion
        ? []
        : [`Actualizar compatibilidad de Core a ${targetCoreVersion}`]),
      ...(microfrontend.template.profile === 'calculator' &&
      JSON.stringify(targetComponents) !== JSON.stringify(microfrontend.components)
        ? ['Actualizar exposiciones de componentes']
        : []),
    ];

    return {
      microfrontend,
      projectRoot,
      currentVersion: microfrontend.template.version,
      target,
      targetCoreVersion,
      ...(targetComponents ? { targetComponents } : {}),
      changes,
      conflicts,
      fileChanges,
      ...(packageContent ? { packageContent } : {}),
      removePackageLock: packageContent !== undefined,
    };
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

export function applyMicrofrontendUpdate(
  applicationRoot: string,
  configuration: OpenMovaApplicationConfiguration,
  plan: MicrofrontendUpdatePlan,
): void {
  if (plan.conflicts.length > 0) {
    throw new Error('No se puede actualizar el microfrontal mientras existan conflictos.');
  }

  requireCleanGitRepository(applicationRoot);
  const projectPath = relative(applicationRoot, plan.projectRoot);
  if (isAbsolute(projectPath) || projectPath.startsWith('..')) {
    requireCleanGitRepository(plan.projectRoot);
  }

  applyFileChanges(plan.projectRoot, plan.fileChanges);
  if (plan.packageContent) {
    writeFileSync(join(plan.projectRoot, 'package.json'), plan.packageContent, 'utf8');
  }
  if (plan.removePackageLock) {
    rmSync(join(plan.projectRoot, 'package-lock.json'), { force: true });
  }

  const updatedConfiguration: OpenMovaApplicationConfiguration = {
    ...configuration,
    microfrontends: configuration.microfrontends.map((entry) =>
      entry.name === plan.microfrontend.name
        ? {
            ...entry,
            ...(plan.microfrontend.template?.profile === 'calculator'
              ? { components: plan.targetComponents }
              : {}),
            compatibility: { requiredCoreVersion: plan.targetCoreVersion },
            template: {
              ...plan.target,
              project: 'open-mova-mf-template',
              profile: plan.microfrontend.template!.profile,
            },
          }
        : entry,
    ),
  };
  writeApplicationConfiguration(applicationRoot, updatedConfiguration);
  synchronizeShellConfiguration(applicationRoot, updatedConfiguration);
}

function readPort(remoteEntry: string): number {
  const port = Number(new URL(remoteEntry).port);
  if (!Number.isInteger(port) || port < 1) {
    throw new Error(`No se puede obtener el puerto de desarrollo desde ${remoteEntry}.`);
  }
  return port;
}

function compareVersions(first: string, second: string): number {
  const firstParts = first.slice(1).split('.').map(Number);
  const secondParts = second.slice(1).split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (firstParts[index] ?? 0) - (secondParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
