import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import type { OpenMovaApplicationConfiguration } from '../types.js';
import { synchronizeShellConfiguration } from './shell-configuration.js';
import { downloadShell, listShellVersions, type ShellVersion } from './shell-repository.js';
import { writeApplicationConfiguration } from './configuration.js';

const GENERATED_PATHS = new Set([
  'package.json',
  'package-lock.json',
  'capacitor.config.ts',
  'src/app/application.config.ts',
  'src/assets/federation.manifest.json',
]);

interface FileChange {
  readonly path: string;
  readonly content?: Buffer;
}

export interface ShellUpdatePlan {
  readonly currentVersion: string;
  readonly target: ShellVersion;
  readonly changes: readonly string[];
  readonly conflicts: readonly string[];
  readonly fileChanges: readonly FileChange[];
  readonly packageContent?: string;
  readonly capacitorContent?: string;
  readonly removePackageLock: boolean;
}

export function createShellUpdatePlan(
  applicationRoot: string,
  configuration: OpenMovaApplicationConfiguration,
  requestedVersion?: string,
): ShellUpdatePlan {
  if (!configuration.shell) {
    throw new Error('La aplicación no tiene registrada una versión de shell.');
  }

  const targetVersion = requestedVersion ?? listShellVersions()[0];
  if (!targetVersion) {
    throw new Error('No hay versiones estables disponibles para actualizar.');
  }
  if (compareVersions(targetVersion, configuration.shell.version) < 0) {
    throw new Error(
      `La versión ${targetVersion} es anterior a ${configuration.shell.version}. ` +
        'mova update no realiza downgrades.',
    );
  }

  const temporaryRoot = mkdtempSync(join(tmpdir(), 'open-mova-update-'));

  try {
    const currentDirectory = join(temporaryRoot, 'current');
    const targetDirectory = join(temporaryRoot, 'target');
    const current = downloadShell(currentDirectory, configuration.shell.version);
    const target = downloadShell(targetDirectory, targetVersion);

    if (current.commit !== configuration.shell.commit) {
      throw new Error(
        `El commit registrado para ${configuration.shell.version} no coincide con el tag remoto.`,
      );
    }

    const conflicts: string[] = [];
    const fileChanges = compareManagedFiles(
      applicationRoot,
      currentDirectory,
      targetDirectory,
      conflicts,
    );
    const packageUpdate = comparePackageConfiguration(
      applicationRoot,
      currentDirectory,
      targetDirectory,
      conflicts,
    );
    const capacitorUpdate = compareCapacitorConfiguration(
      applicationRoot,
      currentDirectory,
      targetDirectory,
      conflicts,
    );
    const changes = [
      ...fileChanges.map((change) =>
        `${change.content ? 'Actualizar' : 'Eliminar'} ${change.path}`,
      ),
      ...(packageUpdate ? ['Actualizar package.json', 'Regenerar package-lock.json'] : []),
      ...(capacitorUpdate ? ['Actualizar capacitor.config.ts'] : []),
      ...(target.version === configuration.shell.version
        ? []
        : [`Registrar shell ${target.version}`]),
    ];

    return {
      currentVersion: configuration.shell.version,
      target,
      changes,
      conflicts,
      fileChanges,
      ...(packageUpdate ? { packageContent: packageUpdate } : {}),
      ...(capacitorUpdate ? { capacitorContent: capacitorUpdate } : {}),
      removePackageLock: packageUpdate !== undefined,
    };
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

export function applyShellUpdate(
  applicationRoot: string,
  configuration: OpenMovaApplicationConfiguration,
  plan: ShellUpdatePlan,
): void {
  if (plan.conflicts.length > 0) {
    throw new Error('No se puede actualizar mientras existan conflictos.');
  }

  requireCleanGitRepository(applicationRoot);

  for (const change of plan.fileChanges) {
    const destination = join(applicationRoot, change.path);
    if (change.content) {
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, change.content);
    } else {
      rmSync(destination, { force: true });
    }
  }

  if (plan.packageContent) {
    writeFileSync(join(applicationRoot, 'package.json'), plan.packageContent, 'utf8');
  }
  if (plan.removePackageLock) {
    rmSync(join(applicationRoot, 'package-lock.json'), { force: true });
  }
  if (plan.capacitorContent) {
    writeFileSync(
      join(applicationRoot, 'capacitor.config.ts'),
      plan.capacitorContent,
      'utf8',
    );
  }

  const updatedConfiguration: OpenMovaApplicationConfiguration = {
    ...configuration,
    shell: plan.target,
  };
  writeApplicationConfiguration(applicationRoot, updatedConfiguration);
  synchronizeShellConfiguration(applicationRoot, updatedConfiguration);
}

function compareManagedFiles(
  applicationRoot: string,
  currentDirectory: string,
  targetDirectory: string,
  conflicts: string[],
): FileChange[] {
  const paths = new Set([
    ...listFiles(currentDirectory),
    ...listFiles(targetDirectory),
  ]);
  const changes: FileChange[] = [];

  for (const path of [...paths].sort()) {
    if (GENERATED_PATHS.has(path)) continue;

    const currentContent = readOptionalFile(join(currentDirectory, path));
    const targetContent = readOptionalFile(join(targetDirectory, path));
    const applicationContent = readOptionalFile(join(applicationRoot, path));

    if (buffersEqual(currentContent, targetContent)) continue;
    if (buffersEqual(applicationContent, currentContent)) {
      changes.push({ path, ...(targetContent ? { content: targetContent } : {}) });
      continue;
    }
    if (buffersEqual(applicationContent, targetContent)) continue;

    conflicts.push(path);
  }

  return changes;
}

function comparePackageConfiguration(
  applicationRoot: string,
  currentDirectory: string,
  targetDirectory: string,
  conflicts: string[],
): string | undefined {
  const application = readJson(join(applicationRoot, 'package.json'));
  const current = readJson(join(currentDirectory, 'package.json'));
  const target = readJson(join(targetDirectory, 'package.json'));
  let changed = false;

  for (const section of ['scripts', 'dependencies', 'devDependencies'] as const) {
    const applicationSection = readStringMap(application[section]);
    const currentSection = readStringMap(current[section]);
    const targetSection = readStringMap(target[section]);
    const keys = new Set([...Object.keys(currentSection), ...Object.keys(targetSection)]);

    for (const key of keys) {
      if (currentSection[key] === targetSection[key]) continue;
      if (applicationSection[key] === currentSection[key]) {
        if (targetSection[key] === undefined) {
          delete applicationSection[key];
        } else {
          applicationSection[key] = targetSection[key];
        }
        changed = true;
      } else if (applicationSection[key] !== targetSection[key]) {
        conflicts.push(`package.json#${section}.${key}`);
      }
    }

    application[section] = applicationSection;
  }

  return changed ? `${JSON.stringify(application, null, 2)}\n` : undefined;
}

function compareCapacitorConfiguration(
  applicationRoot: string,
  currentDirectory: string,
  targetDirectory: string,
  conflicts: string[],
): string | undefined {
  const applicationPath = join(applicationRoot, 'capacitor.config.ts');
  const currentPath = join(currentDirectory, 'capacitor.config.ts');
  const targetPath = join(targetDirectory, 'capacitor.config.ts');
  if (!existsSync(applicationPath) || !existsSync(currentPath) || !existsSync(targetPath)) {
    return undefined;
  }

  const application = readFileSync(applicationPath, 'utf8');
  const identity = readCapacitorIdentity(application);
  const current = applyCapacitorIdentity(readFileSync(currentPath, 'utf8'), identity);
  const target = applyCapacitorIdentity(readFileSync(targetPath, 'utf8'), identity);

  if (current === target || application === target) return undefined;
  if (application === current) return target;

  conflicts.push('capacitor.config.ts');
  return undefined;
}

function requireCleanGitRepository(applicationRoot: string): void {
  const repository = spawnSync(
    'git',
    ['-C', applicationRoot, 'rev-parse', '--is-inside-work-tree'],
    { encoding: 'utf8' },
  );
  if (repository.status !== 0) {
    throw new Error('Inicializa Git y crea un commit antes de ejecutar mova update.');
  }

  const status = spawnSync(
    'git',
    ['-C', applicationRoot, 'status', '--porcelain', '--untracked-files=all'],
    { encoding: 'utf8' },
  );
  if (status.status !== 0 || status.stdout.trim() !== '') {
    throw new Error('El repositorio debe estar limpio antes de ejecutar mova update.');
  }
}

function listFiles(directory: string): string[] {
  const files: string[] = [];

  const visit = (currentDirectory: string): void => {
    for (const entry of readdirSync(currentDirectory, { withFileTypes: true })) {
      const absolutePath = join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (entry.isFile()) {
        files.push(relative(directory, absolutePath));
      }
    }
  };

  visit(directory);
  return files;
}

function readOptionalFile(path: string): Buffer | undefined {
  return existsSync(path) ? readFileSync(path) : undefined;
}

function buffersEqual(first?: Buffer, second?: Buffer): boolean {
  return first === undefined ? second === undefined : second !== undefined && first.equals(second);
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}

function readStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return { ...(value as Record<string, string>) };
}

function readCapacitorIdentity(content: string): { appId: string; appName: string } {
  const appId = content.match(/\bappId:\s*['"]([^'"]+)['"]/)?.[1];
  const appName = content.match(/\bappName:\s*['"]([^'"]+)['"]/)?.[1];
  if (!appId || !appName) {
    throw new Error('No se puede leer appId o appName de capacitor.config.ts.');
  }
  return { appId, appName };
}

function applyCapacitorIdentity(
  content: string,
  identity: { readonly appId: string; readonly appName: string },
): string {
  return content
    .replace(/(\bappId:\s*)['"][^'"]+['"]/, `$1'${identity.appId}'`)
    .replace(/(\bappName:\s*)['"][^'"]+['"]/, `$1'${identity.appName}'`);
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
