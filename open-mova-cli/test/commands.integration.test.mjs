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
  assert.equal(existsSync(join(applicationRoot, 'mfs', 'calculator')), true);
  assert.match(create.stdout, /npm --prefix mfs\/home install/);
  assert.match(create.stdout, /npm --prefix mfs\/calculator install/);
  assert.doesNotMatch(create.stdout, /Instalando dependencias/);
  assert.equal(existsSync(join(applicationRoot, 'node_modules')), false);
  assert.equal(existsSync(join(applicationRoot, 'mfs', 'home', 'node_modules')), false);

  const initialConfiguration = readJson(join(applicationRoot, 'mova.config.json'));
  assert.equal(initialConfiguration.shell.version, 'v1.0.0');
  assert.equal(initialConfiguration.microfrontends.length, 2);
  assert.deepEqual(initialConfiguration.microfrontends[1].components, { main: './Calculator' });
  assert.equal(initialConfiguration.microfrontends[1].route, undefined);
  assert.deepEqual(initialConfiguration.native.capabilities, []);

  const unattendedUpdate = runCli(['update', '--to', 'v1.1.0'], applicationRoot, environment);
  assert.equal(unattendedUpdate.status, 0, unattendedUpdate.stderr);
  assert.match(unattendedUpdate.stdout, /Actualización cancelada/);

  const validateConfiguration = runCli(['config', 'validate'], applicationRoot, environment);
  assert.equal(validateConfiguration.status, 0, validateConfiguration.stderr);
  assert.match(validateConfiguration.stdout, /mova\.config\.json es válido/);

  const showConfiguration = runCli(['config', 'show'], applicationRoot, environment);
  assert.equal(showConfiguration.status, 0, showConfiguration.stderr);
  assert.equal(JSON.parse(showConfiguration.stdout).schemaVersion, 5);

  const enableCapability = runCli(['cap', 'enable', 'cookies'], applicationRoot, environment);
  assert.equal(enableCapability.status, 0, enableCapability.stderr);
  assert.deepEqual(readJson(join(applicationRoot, 'mova.config.json')).native.capabilities, [
    'cookies',
  ]);

  const permissions = runCli(['cap', 'permissions'], applicationRoot, environment);
  assert.equal(permissions.status, 0, permissions.stderr);
  assert.match(permissions.stdout, /cookies/);
  assert.match(
    readFileSync(
      join(applicationRoot, 'src', 'native-capabilities', 'native-capabilities.provider.ts'),
      'utf8',
    ),
    /import \{ cookiesCapability \}/,
  );

  const disableCapability = runCli(['cap', 'disable', 'cookies'], applicationRoot, environment);
  assert.equal(disableCapability.status, 0, disableCapability.stderr);
  assert.deepEqual(readJson(join(applicationRoot, 'mova.config.json')).native.capabilities, []);

  const createMicrofrontend = runCli(
    ['mf', 'create', 'catalog', '--template-version', 'v1.0.0'],
    applicationRoot,
    environment,
  );
  assert.equal(createMicrofrontend.status, 0, createMicrofrontend.stderr);
  assert.match(createMicrofrontend.stdout, /catalog\.main/);
  const catalogRoot = join(applicationRoot, 'mfs', 'catalog');
  const catalogFederation = readFileSync(join(catalogRoot, 'federation.config.js'), 'utf8');
  assert.match(catalogFederation, /'\.\/Routes'/);
  assert.match(catalogFederation, /'\.\/Main'/);
  assert.deepEqual(readJson(join(catalogRoot, 'src/assets/open-mova.manifest.json')).components, {
    main: './Main',
  });
  assert.match(
    readFileSync(join(catalogRoot, 'src/app/components/main/main.component.ts'), 'utf8'),
    /export class MainComponent/,
  );

  const routesOnly = runCli(
    [
      'mf',
      'create',
      'reports',
      '--routes-only',
      '--route',
      'informes',
      '--template-version',
      'v1.0.0',
    ],
    applicationRoot,
    environment,
  );
  assert.equal(routesOnly.status, 0, routesOnly.stderr);
  const reportsRoot = join(applicationRoot, 'mfs', 'reports');
  assert.equal(existsSync(join(reportsRoot, 'src/app/components/starter')), false);
  assert.equal(existsSync(join(reportsRoot, 'src/app/layout')), false);
  assert.equal(existsSync(join(reportsRoot, 'src/app/pages')), false);
  assert.deepEqual(
    readJson(join(reportsRoot, 'src/assets/open-mova.manifest.json')).routes,
    './Routes',
  );
  assert.doesNotMatch(
    readFileSync(join(reportsRoot, 'federation.config.js'), 'utf8'),
    /'\.\/Main'/,
  );

  const componentOnly = runCli(
    [
      'mf',
      'create',
      'widget',
      '--component-only',
      '--component-name',
      'status-card',
      '--template-version',
      'v1.0.0',
    ],
    applicationRoot,
    environment,
  );
  assert.equal(componentOnly.status, 0, componentOnly.stderr);
  assert.doesNotMatch(componentOnly.stdout, /Ruta pública/);
  const widgetRoot = join(applicationRoot, 'mfs', 'widget');
  assert.equal(existsSync(join(widgetRoot, 'src/app/app.routes.ts')), false);
  const widgetManifest = readJson(join(widgetRoot, 'src/assets/open-mova.manifest.json'));
  assert.equal(widgetManifest.routes, undefined);
  assert.deepEqual(widgetManifest.components, { 'status-card': './StatusCard' });
  assert.match(readFileSync(join(widgetRoot, 'src/app/app.ts'), 'utf8'), /StatusCardComponent/);
  assert.doesNotMatch(
    readFileSync(join(widgetRoot, 'federation.config.js'), 'utf8'),
    /'\.\/Routes'/,
  );

  const bothNamed = runCli(
    [
      'mf',
      'create',
      'combo',
      '--route',
      'productos',
      '--component-name',
      'product-card',
      '--template-version',
      'v1.0.0',
    ],
    applicationRoot,
    environment,
  );
  assert.equal(bothNamed.status, 0, bothNamed.stderr);
  const comboManifest = readJson(
    join(applicationRoot, 'mfs/combo/src/assets/open-mova.manifest.json'),
  );
  assert.equal(comboManifest.routes, './Routes');
  assert.deepEqual(comboManifest.components, { 'product-card': './ProductCard' });

  for (const invalidOptions of [
    ['--routes-only', '--component-only'],
    ['--component-only', '--route', 'widget'],
    ['--routes-only', '--component-name', 'widget'],
    ['--component-name', 'routes'],
    ['--component-name', '123'],
    ['--demo', '--component-only'],
  ]) {
    const invalid = runCli(
      ['mf', 'create', 'invalid', ...invalidOptions, '--template-version', 'v1.0.0'],
      applicationRoot,
      environment,
    );
    assert.notEqual(invalid.status, 0, invalidOptions.join(' '));
    assert.equal(existsSync(join(applicationRoot, 'mfs', 'invalid')), false);
  }

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

  const addComponent = runCli(
    ['mf', 'component', 'add', 'account', 'widget', '--module', './Widget'],
    applicationRoot,
    environment,
  );
  assert.equal(addComponent.status, 0, addComponent.stderr);

  const addComponentOnly = runCli(
    [
      'mf',
      'add',
      '--name',
      'utility',
      '--remote',
      'utility-microfrontend',
      '--remote-entry',
      'https://cdn.example.com/utility/remoteEntry.json',
      '--core-version',
      '^0.2.5',
      '--component',
      'main=./Widget',
    ],
    applicationRoot,
    environment,
  );
  assert.equal(addComponentOnly.status, 0, addComponentOnly.stderr);

  const configuration = readJson(join(applicationRoot, 'mova.config.json'));
  assert.deepEqual(
    configuration.microfrontends.map((microfrontend) => microfrontend.name),
    ['home', 'calculator', 'catalog', 'reports', 'widget', 'combo', 'account', 'utility'],
  );
  const byName = Object.fromEntries(
    configuration.microfrontends.map((entry) => [entry.name, entry]),
  );
  assert.deepEqual(byName.catalog.components, { main: './Main' });
  assert.equal(byName.catalog.template.profile, 'starter-both');
  assert.equal(byName.catalog.template.componentName, 'main');
  assert.equal(byName.reports.route, 'informes');
  assert.equal(byName.reports.template.profile, 'starter-routes');
  assert.equal(byName.reports.components, undefined);
  assert.equal(byName.widget.route, undefined);
  assert.deepEqual(byName.widget.components, { 'status-card': './StatusCard' });
  assert.equal(byName.widget.template.componentName, 'status-card');
  assert.equal(byName.combo.route, 'productos');
  assert.deepEqual(byName.combo.components, { 'product-card': './ProductCard' });
  assert.deepEqual(byName.account.components, { widget: './Widget' });
  assert.equal(byName.utility.route, undefined);

  const manifest = readJson(join(applicationRoot, 'src', 'assets', 'federation.manifest.json'));
  assert.equal(manifest['calculator-microfrontend'], 'http://localhost:4400/remoteEntry.json');
  assert.equal(manifest['catalog-microfrontend'], 'http://localhost:4500/remoteEntry.json');
  assert.equal(manifest['widget-microfrontend'], 'http://localhost:4700/remoteEntry.json');
  assert.equal(
    manifest['account-microfrontend'],
    'https://cdn.example.com/account/remoteEntry.json',
  );

  const routes = readFileSync(join(applicationRoot, 'src', 'app', 'application.config.ts'), 'utf8');
  assert.match(routes, /path: "catalog"/);
  assert.match(routes, /path: "informes"/);
  assert.match(routes, /components: \{"status-card":"\.\/StatusCard"\}/);
  assert.equal((routes.match(/remote: "widget-microfrontend"/g) ?? []).length, 1);
  assert.match(routes, /remote: "account-microfrontend"/);

  const update = runCli(['update', '--check', '--to', 'v1.1.0'], applicationRoot, environment);
  assert.equal(update.status, 0, update.stderr);
  assert.match(update.stdout, /Shell destino: v1\.1\.0/);
  assert.match(update.stdout, /Actualizar src[\\/]framework-update\.txt/);

  const updateMicrofrontend = runCli(
    ['mf', 'update', 'home', '--check', '--to', 'v1.1.0'],
    applicationRoot,
    environment,
  );
  assert.equal(updateMicrofrontend.status, 0, updateMicrofrontend.stderr);
  assert.match(updateMicrofrontend.stdout, /Plantilla destino: v1\.1\.0/);

  const updateCalculator = runCli(
    ['mf', 'update', 'calculator', '--check', '--to', 'v1.1.0'],
    applicationRoot,
    environment,
  );
  assert.equal(updateCalculator.status, 0, updateCalculator.stderr);
  assert.match(updateCalculator.stdout, /Plantilla destino: v1\.1\.0/);

  for (const name of ['catalog', 'reports', 'widget', 'combo']) {
    const updateStarter = runCli(
      ['mf', 'update', name, '--check', '--to', 'v1.1.0'],
      applicationRoot,
      environment,
    );
    assert.equal(updateStarter.status, 0, `${name}: ${updateStarter.stderr}`);
    assert.doesNotMatch(updateStarter.stdout, /Conflictos/);
  }

  runGit(applicationRoot, ['init', '--initial-branch=main']);
  runGit(applicationRoot, ['add', '.']);
  runGit(applicationRoot, [
    '-c',
    'user.name=Open Mova Test',
    '-c',
    'user.email=test@open-mova.local',
    'commit',
    '--quiet',
    '-m',
    'Initial generated application',
  ]);
  for (const name of ['widget', 'combo']) {
    const applyUpdate = runCli(
      ['mf', 'update', name, '--to', 'v1.1.0'],
      applicationRoot,
      environment,
    );
    assert.equal(applyUpdate.status, 0, `${name}: ${applyUpdate.stderr}`);
    const updated = readJson(join(applicationRoot, 'mova.config.json')).microfrontends.find(
      (entry) => entry.name === name,
    );
    assert.equal(updated.template.version, 'v1.1.0');
    assert.equal(
      updated.template.componentName,
      name === 'widget' ? 'status-card' : 'product-card',
    );
    assert.deepEqual(
      updated.components,
      name === 'widget' ? { 'status-card': './StatusCard' } : { 'product-card': './ProductCard' },
    );
    runGit(applicationRoot, ['add', '.']);
    runGit(applicationRoot, [
      '-c',
      'user.name=Open Mova Test',
      '-c',
      'user.email=test@open-mova.local',
      'commit',
      '--quiet',
      '-m',
      `Update ${name}`,
    ]);
  }

  const help = runCli(['--help'], applicationRoot, environment);
  assert.equal(help.status, 0, help.stderr);
  assert.doesNotMatch(help.stdout, /deploy <microfrontend>/);

  const microfrontendHelp = runCli(['mf', '--help'], applicationRoot, environment);
  assert.equal(microfrontendHelp.status, 0, microfrontendHelp.stderr);
  assert.match(microfrontendHelp.stdout, /build <name>/);
  assert.match(microfrontendHelp.stdout, /deploy <name>/);
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
