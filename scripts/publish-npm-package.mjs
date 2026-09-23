import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout } from 'node:timers/promises';
import { packagesMatch, planNpmRelease } from './npm-release-plan.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projects = {
  'open-mova-core': '@open-mova/core',
  'open-mova-cli': '@open-mova/cli',
};
const project = process.argv[2];

if (!Object.hasOwn(projects, project)) {
  throw new Error('Indica open-mova-core u open-mova-cli.');
}

const packageDirectory = join(repositoryRoot, project);
const manifest = JSON.parse(readFileSync(join(packageDirectory, 'package.json'), 'utf8'));
const packageName = projects[project];

if (manifest.name !== packageName) throw new Error(`Nombre npm inesperado en ${project}.`);

function run(command, args, cwd = packageDirectory) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} falló (${result.status}):\n${result.stderr.trim()}`,
    );
  }
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.stdout.trim();
}

function npm(args, cwd) {
  return run('npm', args, cwd);
}

function summary(message) {
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
}

function publishedVersions() {
  const result = spawnSync('npm', ['view', packageName, 'versions', '--json'], {
    cwd: packageDirectory,
    encoding: 'utf8',
    env: process.env,
  });
  if (result.status !== 0) {
    if (/E404|404 Not Found/.test(result.stderr)) return [];
    throw new Error(
      `No se pudieron consultar las versiones de ${packageName}: ${result.stderr.trim()}`,
    );
  }
  const versions = JSON.parse(result.stdout);
  return Array.isArray(versions) ? versions : [versions];
}

function pack(specifier, destination, cwd = packageDirectory) {
  const result = JSON.parse(
    npm(['pack', specifier, '--json', '--pack-destination', destination], cwd),
  );
  if (result.length !== 1 || !result[0].filename)
    throw new Error(`npm pack no devolvió un tarball para ${specifier}.`);
  return join(destination, result[0].filename);
}

function extract(tarball, destination) {
  mkdirSync(destination);
  run('tar', ['-xzf', tarball, '-C', destination], repositoryRoot);
  return join(destination, 'package');
}

async function verifyRegistryPublication() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const result = spawnSync(
      'npm',
      ['view', `${packageName}@${manifest.version}`, 'version', '--json'],
      {
        cwd: packageDirectory,
        encoding: 'utf8',
        env: process.env,
      },
    );
    if (result.status === 0 && JSON.parse(result.stdout) === manifest.version) return;
    if (attempt < 5) await setTimeout(3000);
  }
  throw new Error(
    `npm publish terminó, pero no se pudo verificar ${packageName}@${manifest.version} en el registro.`,
  );
}

async function verifyPublishedArtifact(localTarball, registryDirectory, temporaryRoot) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const registryTarball = pack(`${packageName}@${manifest.version}`, registryDirectory);
      if (
        !packagesMatch(
          extract(localTarball, join(temporaryRoot, 'local-files')),
          extract(registryTarball, join(temporaryRoot, 'registry-files')),
        )
      ) {
        throw new Error(
          `El paquete publicado ${packageName}@${manifest.version} no coincide con el artefacto local.`,
        );
      }
      return;
    } catch (error) {
      if (attempt === 5 || /no coincide/.test(String(error))) throw error;
      await setTimeout(3000);
    }
  }
}

function verifyInstalledVersion(temporaryRoot) {
  const consumer = join(temporaryRoot, 'consumer');
  mkdirSync(consumer);
  npm(
    [
      'install',
      '--prefix',
      consumer,
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      `${packageName}@${manifest.version}`,
    ],
    repositoryRoot,
  );
  const installed = JSON.parse(
    readFileSync(join(consumer, 'node_modules', ...packageName.split('/'), 'package.json'), 'utf8'),
  );
  if (installed.version !== manifest.version) {
    throw new Error(
      `Se instaló ${packageName}@${installed.version} en lugar de ${manifest.version}.`,
    );
  }
}

async function main() {
  if (
    process.env.GITHUB_ACTIONS !== 'true' ||
    process.env.GITHUB_REPOSITORY !== 'rgarciadelongoria/open-mova' ||
    process.env.GITHUB_EVENT_NAME !== 'workflow_run' ||
    process.env.GITHUB_REF !== 'refs/heads/main'
  ) {
    throw new Error('La publicación solo puede ejecutarse tras la CI de main en Open Mova.');
  }
  const npmVersion = npm(['--version']);
  const [major, minor, patch] = npmVersion.split('.').map(Number);
  if (major < 11 || (major === 11 && (minor < 5 || (minor === 5 && patch < 1)))) {
    throw new Error(`npm ${npmVersion} no soporta Trusted Publishing; se necesita >=11.5.1.`);
  }

  npm(['ci']);
  npm(['run', 'typecheck']);
  npm(['test']);

  const temporaryRoot = mkdtempSync(join(tmpdir(), 'open-mova-npm-release-'));
  try {
    const localDirectory = join(temporaryRoot, 'local');
    const registryDirectory = join(temporaryRoot, 'registry');
    mkdirSync(localDirectory);
    mkdirSync(registryDirectory);
    const localTarball = pack('.', localDirectory);
    const plan = planNpmRelease(manifest.version, publishedVersions());
    if (plan === 'compare') {
      const registryTarball = pack(`${packageName}@${manifest.version}`, registryDirectory);
      if (
        !packagesMatch(
          extract(localTarball, join(temporaryRoot, 'local-files')),
          extract(registryTarball, join(temporaryRoot, 'registry-files')),
        )
      ) {
        throw new Error(
          `${packageName}@${manifest.version} ya existe con contenido distinto. Incrementa su versión antes de publicar cambios.`,
        );
      }
      summary(
        `⏭️ ${packageName}@${manifest.version}: ya publicado con el mismo contenido; no se republica.`,
      );
      return;
    }

    npm(['publish', '--access', 'public', '--provenance']);
    await verifyRegistryPublication();
    await verifyPublishedArtifact(localTarball, registryDirectory, temporaryRoot);
    verifyInstalledVersion(temporaryRoot);
    summary(`✅ ${packageName}@${manifest.version}: publicado y verificado en npm.`);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

try {
  await main();
} catch (error) {
  summary(
    `❌ ${packageName}@${manifest.version}: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
