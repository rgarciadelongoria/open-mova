import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

export interface FileChange {
  readonly path: string;
  readonly content?: Buffer;
}

export function compareManagedFiles(
  projectRoot: string,
  currentDirectory: string,
  targetDirectory: string,
  conflicts: string[],
  ignoredPaths: ReadonlySet<string>,
): FileChange[] {
  const paths = new Set([...listFiles(currentDirectory), ...listFiles(targetDirectory)]);
  const changes: FileChange[] = [];

  for (const path of [...paths].sort()) {
    if (ignoredPaths.has(path)) continue;

    const currentContent = readOptionalFile(join(currentDirectory, path));
    const targetContent = readOptionalFile(join(targetDirectory, path));
    const projectContent = readOptionalFile(join(projectRoot, path));

    if (buffersEqual(currentContent, targetContent)) continue;
    if (buffersEqual(projectContent, currentContent)) {
      changes.push({ path, ...(targetContent ? { content: targetContent } : {}) });
      continue;
    }
    if (buffersEqual(projectContent, targetContent)) continue;

    conflicts.push(path);
  }

  return changes;
}

export function comparePackageConfiguration(
  projectRoot: string,
  currentDirectory: string,
  targetDirectory: string,
  conflicts: string[],
): string | undefined {
  const project = readJson(join(projectRoot, 'package.json'));
  const current = readJson(join(currentDirectory, 'package.json'));
  const target = readJson(join(targetDirectory, 'package.json'));
  let changed = false;

  for (const section of ['scripts', 'dependencies', 'devDependencies'] as const) {
    const projectSection = readStringMap(project[section]);
    const currentSection = readStringMap(current[section]);
    const targetSection = readStringMap(target[section]);
    const keys = new Set([...Object.keys(currentSection), ...Object.keys(targetSection)]);

    for (const key of keys) {
      if (currentSection[key] === targetSection[key]) continue;
      if (projectSection[key] === currentSection[key]) {
        if (targetSection[key] === undefined) {
          delete projectSection[key];
        } else {
          projectSection[key] = targetSection[key];
        }
        changed = true;
      } else if (projectSection[key] !== targetSection[key]) {
        conflicts.push(`package.json#${section}.${key}`);
      }
    }

    project[section] = projectSection;
  }

  return changed ? `${JSON.stringify(project, null, 2)}\n` : undefined;
}

export function applyFileChanges(projectRoot: string, changes: readonly FileChange[]): void {
  for (const change of changes) {
    const destination = join(projectRoot, change.path);
    if (change.content) {
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, change.content);
    } else {
      rmSync(destination, { force: true });
    }
  }
}

export function requireCleanGitRepository(projectRoot: string): void {
  const repository = spawnSync('git', ['-C', projectRoot, 'rev-parse', '--is-inside-work-tree'], {
    encoding: 'utf8',
  });
  if (repository.status !== 0) {
    throw new Error('Inicializa Git y crea un commit antes de actualizar.');
  }

  const status = spawnSync(
    'git',
    ['-C', projectRoot, 'status', '--porcelain', '--untracked-files=all'],
    { encoding: 'utf8' },
  );
  if (status.status !== 0 || status.stdout.trim() !== '') {
    throw new Error('El repositorio debe estar limpio antes de actualizar.');
  }
}

function listFiles(directory: string): string[] {
  const files: string[] = [];

  const visit = (currentDirectory: string): void => {
    for (const entry of readdirSync(currentDirectory, { withFileTypes: true })) {
      const absolutePath = join(currentDirectory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else if (entry.isFile()) files.push(relative(directory, absolutePath));
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
