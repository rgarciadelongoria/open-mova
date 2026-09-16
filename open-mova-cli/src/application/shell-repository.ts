import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';

export const SHELL_REPOSITORY =
  process.env['OPEN_MOVA_SHELL_REPOSITORY'] ?? 'https://github.com/rgarciadelongoria/open-mova.git';

// El demo publicado permite probar una aplicación recién creada sin desplegar un MF propio.
export const DEMO_MICROFRONTEND_REMOTE_ENTRY =
  'https://rgarciadelongoria.github.io/open-mova/remoteEntry.json';

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
  project: 'open-mova-shell' | 'open-mova-mf-template',
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
      '-c',
      'advice.detachedHead=false',
      'clone',
      '--quiet',
      '--depth',
      '1',
      '--single-branch',
      '--branch',
      version,
      SHELL_REPOSITORY,
      checkout,
    ]);

    const source = join(checkout, project);
    const requiredFiles = ['package.json', 'angular.json', 'src/main.ts'];
    if (project === 'open-mova-shell') {
      requiredFiles.push('native-capabilities.catalog.json');
    }
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

export function configureDownloadedShell(
  destination: string,
  applicationName: string,
  includesStarterMicrofrontend: boolean,
): void {
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

  // A lockfile from the framework checkout may contain local development links.
  // The generated application must resolve every dependency from its own package.json.
  rmSync(packageLockPath, { force: true });

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
  const installSteps =
    'npm install\n' + (includesStarterMicrofrontend ? 'npm --prefix mfs/home install\n' : '');
  const runSteps = includesStarterMicrofrontend
    ? 'Inicia `npm --prefix mfs/home start` y `npm start` en dos terminales. Abre `http://localhost:4200/home/inicio`.\n'
    : 'Registra primero un MF con `mova mf create nombre` y después ejecuta `mova start`.\n';
  writeFileSync(
    join(destination, 'README.md'),
    `# ${applicationName}\n\nAplicación creada con Open Mova. \`mova.config.json\` registra la shell y los microfrontales remotos.\n\n` +
      `Instala las dependencias de cada proyecto:\n\n` +
      `\`\`\`bash\n${installSteps}\`\`\`\n\n${runSteps}`,
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
