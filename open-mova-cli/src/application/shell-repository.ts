import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';

export const SHELL_REPOSITORY = 'https://github.com/rgarciadelongoria/open-mova.git';

const VERSION_PATTERN = /^v(\d+)\.(\d+)\.(\d+)$/;
const EXCLUDED_ENTRIES = new Set([
  '.git',
  '.angular',
  'node_modules',
  'dist',
  'out-tsc',
  'android',
  'ios',
  'AGENTS.md',
  'README.md',
]);

export interface ShellVersion {
  readonly repository: string;
  readonly version: string;
  readonly commit: string;
}

export function listShellVersions(): string[] {
  const output = runGit(['ls-remote', '--tags', '--refs', SHELL_REPOSITORY]);

  return output
    .split('\n')
    .map((line) => line.match(/refs\/tags\/(v\d+\.\d+\.\d+)$/)?.[1])
    .filter((version): version is string => version !== undefined)
    .sort(compareVersionsDescending);
}

export function downloadShell(destination: string, requestedVersion?: string): ShellVersion {
  return downloadTaggedProject('open-mova-shell', destination, requestedVersion);
}

export function downloadTaggedProject(
  project: 'open-mova-shell' | 'open-mova-mf-template' | 'open-mova-core',
  destination: string,
  requestedVersion?: string,
): ShellVersion {
  const versions = listShellVersions();
  const version = requestedVersion ?? versions[0];

  if (!version) {
    throw new Error('El repositorio no tiene versiones estables con tags vX.Y.Z.');
  }

  if (!VERSION_PATTERN.test(version) || !versions.includes(version)) {
    throw new Error(`La versión ${version} no está disponible. Usa "mova shell versions".`);
  }

  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'open-mova-project-'));

  try {
    const checkout = join(temporaryDirectory, 'repository');
    runGit([
      '-c', 'advice.detachedHead=false',
      'clone', '--quiet', '--depth', '1', '--single-branch',
      '--branch', version, SHELL_REPOSITORY, checkout,
    ]);

    const source = join(checkout, project);
    const requiredFiles = project === 'open-mova-core'
      ? ['package.json', 'src/index.ts']
      : ['package.json', 'angular.json', 'src/main.ts'];
    for (const requiredFile of requiredFiles) {
      if (!existsSync(join(source, requiredFile))) {
        throw new Error(`El tag ${version} no contiene ${project}: falta ${requiredFile}.`);
      }
    }

    cpSync(source, destination, {
      recursive: true,
      filter: (entry) => !EXCLUDED_ENTRIES.has(basename(entry)),
    });

    return {
      repository: SHELL_REPOSITORY,
      version,
      commit: runGit(['-C', checkout, 'rev-parse', 'HEAD']).trim(),
    };
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

export function configureDownloadedShell(destination: string, applicationName: string): void {
  const packagePath = join(destination, 'package.json');
  const packageLockPath = join(destination, 'package-lock.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as {
    name: string;
    version: string;
    private?: boolean;
  };
  packageJson.name = applicationName;
  packageJson.version = '0.1.0';
  packageJson.private = true;
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  if (existsSync(packageLockPath)) {
    const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8')) as {
      name: string;
      version: string;
      packages: Record<string, { name?: string; version?: string }>;
    };
    packageLock.name = applicationName;
    packageLock.version = packageJson.version;
    packageLock.packages[''].name = applicationName;
    packageLock.packages[''].version = packageJson.version;
    writeFileSync(packageLockPath, `${JSON.stringify(packageLock, null, 2)}\n`);
  }

  const capacitorPath = join(destination, 'capacitor.config.ts');
  if (existsSync(capacitorPath)) {
    const originalConfig = readFileSync(capacitorPath, 'utf8');
    const appId = `dev.openmova.app${applicationName.replaceAll('-', '')}`;
    const customizedConfig = originalConfig
      .replace(/(\bappId:\s*)['"][^'"]+['"]/, `$1'${appId}'`)
      .replace(/(\bappName:\s*)['"][^'"]+['"]/, `$1'${applicationName}'`);

    if (
      customizedConfig === originalConfig ||
      !customizedConfig.includes(`appId: '${appId}'`) ||
      !customizedConfig.includes(`appName: '${applicationName}'`)
    ) {
      throw new Error('No se pudo personalizar capacitor.config.ts de la shell descargada.');
    }

    writeFileSync(capacitorPath, customizedConfig);
  }
  writeFileSync(join(destination, '.nvmrc'), '22\n');
  writeFileSync(
    join(destination, 'README.md'),
    `# ${applicationName}\n\nAplicación creada con Open Mova. \`mova.config.json\` registra la shell y los microfrontales remotos.\n\n` +
      `Si se creó el MF inicial, instala y compila primero \`packages/core\`:\n\n` +
      `\`\`\`bash\nnpm install\nnpm --prefix packages/core install\nnpm --prefix packages/core run build\nnpm --prefix mfs/home install\n\`\`\`\n\n` +
      `Inicia \`npm --prefix mfs/home start\` y \`npm start\` en dos terminales. ` +
      `Abre \`http://localhost:4200/home/inicio\`. Si creaste la app con \`--empty\`, ` +
      `registra primero un MF con \`mova mf create nombre\`.\n`,
  );
}

function compareVersionsDescending(first: string, second: string): number {
  const firstParts = VERSION_PATTERN.exec(first)?.slice(1).map(Number) ?? [];
  const secondParts = VERSION_PATTERN.exec(second)?.slice(1).map(Number) ?? [];

  for (let index = 0; index < 3; index += 1) {
    const difference = (secondParts[index] ?? 0) - (firstParts[index] ?? 0);
    if (difference !== 0) return difference;
  }

  return 0;
}

function runGit(args: string[]): string {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });

  if (result.error || result.status !== 0) {
    const detail = result.stderr?.trim() || result.error?.message || 'Error desconocido';
    throw new Error(`No se pudo consultar o descargar Open Mova: ${detail}`);
  }

  return result.stdout;
}
