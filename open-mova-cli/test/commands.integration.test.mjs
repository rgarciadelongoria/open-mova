import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const cliPath = join(repositoryRoot, 'open-mova-cli', 'dist', 'cli.js');
const excludedEntries = new Set(['node_modules', 'dist', '.angular']);

test('crea una aplicación, registra MFs y calcula una actualización', (context) => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'open-mova-cli-integration-'));
  context.after(() => rmSync(temporaryRoot, { recursive: true, force: true }));

  const frameworkRepository = createFrameworkRepository(temporaryRoot);
  const applicationRoot = join(temporaryRoot, 'demo-app');
  const environment = {
    ...process.env,
    OPEN_MOVA_SHELL_REPOSITORY: frameworkRepository,
  };

  const create = runCli(
    ['create', 'demo-app', '--directory', applicationRoot, '--shell-version', 'v1.0.0'],
    temporaryRoot,
    environment,
  );
  assert.equal(create.status, 0, create.stderr);
  assert.equal(existsSync(join(applicationRoot, 'mfs', 'home')), true);

  const initialConfiguration = readJson(join(applicationRoot, 'mova.config.json'));
  assert.equal(initialConfiguration.shell.version, 'v1.0.0');
  assert.equal(initialConfiguration.microfrontends.length, 1);

  const createMicrofrontend = runCli(
    ['mf', 'create', 'catalog', '--template-version', 'v1.0.0'],
    applicationRoot,
    environment,
  );
  assert.equal(createMicrofrontend.status, 0, createMicrofrontend.stderr);

  const addRemote = runCli(
    [
      'mf',
      'add',
      '--name',
      'account',
      '--remote',
      'account-microfrontend',
      '--remote-entry',
      'https://cdn.example.com/account/remoteEntry.json',
      '--production-remote-entry',
      'https://cdn.example.com/account/remoteEntry.json',
    ],
    applicationRoot,
    environment,
  );
  assert.equal(addRemote.status, 0, addRemote.stderr);

  const configuration = readJson(join(applicationRoot, 'mova.config.json'));
  assert.deepEqual(
    configuration.microfrontends.map((microfrontend) => microfrontend.name),
    ['home', 'catalog', 'account'],
  );

  const manifest = readJson(join(applicationRoot, 'src', 'assets', 'federation.manifest.json'));
  assert.equal(manifest['catalog-microfrontend'], 'http://localhost:4400/remoteEntry.json');
  assert.equal(
    manifest['account-microfrontend'],
    'https://cdn.example.com/account/remoteEntry.json',
  );

  const routes = readFileSync(join(applicationRoot, 'src', 'app', 'application.config.ts'), 'utf8');
  assert.match(routes, /path: "catalog"/);
  assert.match(routes, /remote: "account-microfrontend"/);

  const update = runCli(['update', '--check', '--to', 'v1.1.0'], applicationRoot, environment);
  assert.equal(update.status, 0, update.stderr);
  assert.match(update.stdout, /Shell destino: v1\.1\.0/);
  assert.match(update.stdout, /Actualizar src\/framework-update\.txt/);
});

function createFrameworkRepository(temporaryRoot) {
  const repository = join(temporaryRoot, 'framework');
  copyProject('open-mova-shell', repository);
  copyProject('open-mova-mf-template', repository);

  runGit(repository, ['init', '--initial-branch=main']);
  runGit(repository, ['add', '.']);
  runGit(repository, [
    '-c',
    'user.name=Open Mova Test',
    '-c',
    'user.email=test@open-mova.local',
    'commit',
    '--quiet',
    '-m',
    'Initial framework',
  ]);
  runGit(repository, ['tag', 'v1.0.0']);

  writeFileSync(
    join(repository, 'open-mova-shell', 'src', 'framework-update.txt'),
    'Framework v1.1.0\n',
  );
  runGit(repository, ['add', '.']);
  runGit(repository, [
    '-c',
    'user.name=Open Mova Test',
    '-c',
    'user.email=test@open-mova.local',
    'commit',
    '--quiet',
    '-m',
    'Update framework',
  ]);
  runGit(repository, ['tag', 'v1.1.0']);

  return repository;
}

function copyProject(projectName, destinationRoot) {
  cpSync(join(repositoryRoot, projectName), join(destinationRoot, projectName), {
    recursive: true,
    filter: (source) => !excludedEntries.has(basename(source)),
  });
}

function runCli(args, cwd, environment) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    env: environment,
    encoding: 'utf8',
  });
}

function runGit(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
