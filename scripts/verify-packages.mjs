import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'open-mova-pack-check-'));
const packagesDirectory = join(temporaryRoot, 'packages');
const consumerDirectory = join(temporaryRoot, 'consumer');
const npmCacheDirectory = join(temporaryRoot, 'npm-cache');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

mkdirSync(packagesDirectory);
mkdirSync(consumerDirectory);

try {
  const coreTarball = packProject('open-mova-core');
  const cliTarball = packProject('open-mova-cli');
  const corePackage = readPackage('open-mova-core');

  writeFileSync(
    join(consumerDirectory, 'package.json'),
    `${JSON.stringify(
      {
        name: 'open-mova-package-consumer',
        private: true,
        type: 'module',
        dependencies: {
          '@angular/core': corePackage.devDependencies['@angular/core'],
          '@open-mova/cli': `file:${cliTarball}`,
          '@open-mova/core': `file:${coreTarball}`,
        },
      },
      null,
      2,
    )}\n`,
  );

  run(npm, ['install', '--ignore-scripts', '--no-audit', '--no-fund'], consumerDirectory);
  run(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      "const core = await import('@open-mova/core'); " +
        'if (!core.NATIVE_CAPABILITY_API || !core.NATIVE_CAPABILITIES) process.exit(1);',
    ],
    consumerDirectory,
  );
  run(
    process.execPath,
    [join(consumerDirectory, 'node_modules', '@open-mova', 'cli', 'dist', 'cli.js'), '--help'],
    consumerDirectory,
  );

  console.log('Core y CLI se empaquetan, instalan y cargan correctamente.');
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function packProject(projectName) {
  const result = execute(
    npm,
    ['pack', join(repositoryRoot, projectName), '--pack-destination', packagesDirectory],
    repositoryRoot,
  );
  const filename = result.stdout.trim().split(/\r?\n/).at(-1);

  assert.ok(filename?.endsWith('.tgz'), `npm pack no devolvió un tarball para ${projectName}`);
  return join(packagesDirectory, filename);
}

function readPackage(projectName) {
  return JSON.parse(readFileSync(join(repositoryRoot, projectName, 'package.json'), 'utf8'));
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, npm_config_cache: npmCacheDirectory },
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} terminó con error.`);
  }
}

function execute(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: npmCacheDirectory },
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `${command} ${args.join(' ')} terminó con error.`);
  }

  return result;
}
