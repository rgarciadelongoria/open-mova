import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  addMicrofrontend,
  findApplicationRoot,
  readApplicationConfigurationDocument,
  readApplicationConfiguration,
} from '../dist/application/configuration.js';

function createApplicationFixture() {
  const root = mkdtempSync(join(tmpdir(), 'open-mova-cli-test-'));
  const configuration = {
    schemaVersion: 4,
    name: 'demo-app',
    shell: {
      repository: 'https://example.com/open-mova.git',
      version: 'v0.2.1',
      commit: '0123456789abcdef',
    },
    native: { capabilities: [] },
    security: { trustedRemoteOrigins: [] },
    microfrontends: [
      {
        name: 'home',
        route: 'home',
        remoteName: 'home-microfrontend',
        exposedModule: './Routes',
        developmentRemoteEntry: 'http://localhost:4300/remoteEntry.json',
        compatibility: { requiredCoreVersion: '^0.2.2' },
      },
    ],
  };

  writeFileSync(join(root, 'mova.config.json'), `${JSON.stringify(configuration, null, 2)}\n`);

  return { root, configuration };
}

test('encuentra y valida una aplicación desde uno de sus subdirectorios', (context) => {
  const fixture = createApplicationFixture();
  context.after(() => rmSync(fixture.root, { recursive: true, force: true }));

  const nestedDirectory = join(fixture.root, 'mfs', 'home');
  mkdirSync(nestedDirectory, { recursive: true });

  assert.equal(findApplicationRoot(nestedDirectory), fixture.root);
  assert.deepEqual(readApplicationConfiguration(fixture.root), {
    ...fixture.configuration,
    schemaVersion: 5,
  });
});

test('migra configuraciones antiguas en memoria sin sobrescribirlas', (context) => {
  const fixture = createApplicationFixture();
  context.after(() => rmSync(fixture.root, { recursive: true, force: true }));
  const legacy = { ...fixture.configuration, schemaVersion: 1 };
  delete legacy.microfrontends[0].compatibility;
  writeFileSync(join(fixture.root, 'mova.config.json'), `${JSON.stringify(legacy, null, 2)}\n`);

  const document = readApplicationConfigurationDocument(fixture.root);
  assert.equal(document.configuration.schemaVersion, 5);
  assert.equal(document.migrations.length, 4);
});

test('rechaza un módulo federado que no expone las rutas esperadas', (context) => {
  const fixture = createApplicationFixture();
  context.after(() => rmSync(fixture.root, { recursive: true, force: true }));

  fixture.configuration.microfrontends[0].exposedModule = './Module';
  writeFileSync(
    join(fixture.root, 'mova.config.json'),
    `${JSON.stringify(fixture.configuration, null, 2)}\n`,
  );

  assert.throws(
    () => readApplicationConfiguration(fixture.root),
    /debe asociar cada ruta de MF con "\.\/Routes"/,
  );
});

test('impide registrar rutas o nombres de remoto duplicados', () => {
  const fixture = createApplicationFixture();

  assert.throws(
    () =>
      addMicrofrontend(fixture.configuration, {
        name: 'catalog',
        route: 'home',
        remoteName: 'catalog-microfrontend',
        exposedModule: './Routes',
        developmentRemoteEntry: 'http://localhost:4400/remoteEntry.json',
      }),
    /entra en conflicto/,
  );

  rmSync(fixture.root, { recursive: true, force: true });
});

test('registra el origen HTTPS de un remoto como origen de confianza', () => {
  const fixture = createApplicationFixture();

  const configuration = addMicrofrontend(fixture.configuration, {
    name: 'catalog',
    route: 'catalog',
    remoteName: 'catalog-microfrontend',
    exposedModule: './Routes',
    developmentRemoteEntry: 'https://cdn.example.com/catalog/1.4.0/remoteEntry.json',
    productionRemoteEntry: 'https://cdn.example.com/catalog/1.4.0/remoteEntry.json',
    compatibility: { requiredCoreVersion: '^0.2.2' },
  });

  assert.deepEqual(configuration.security.trustedRemoteOrigins, ['https://cdn.example.com']);
  rmSync(fixture.root, { recursive: true, force: true });
});

test('admite un MF solo de componentes y otro con rutas y componentes', (context) => {
  const fixture = createApplicationFixture();
  context.after(() => rmSync(fixture.root, { recursive: true, force: true }));
  const withComponents = addMicrofrontend(fixture.configuration, {
    name: 'calculator',
    remoteName: 'calculator-microfrontend',
    components: { main: './Calculator' },
    developmentRemoteEntry: 'http://localhost:4400/remoteEntry.json',
    compatibility: { requiredCoreVersion: '^0.2.5' },
  });
  const both = {
    ...withComponents,
    schemaVersion: 5,
    microfrontends: withComponents.microfrontends.map((entry) =>
      entry.name === 'home' ? { ...entry, components: { widget: './Widget' } } : entry,
    ),
  };
  writeFileSync(join(fixture.root, 'mova.config.json'), `${JSON.stringify(both, null, 2)}\n`);
  const read = readApplicationConfiguration(fixture.root);
  assert.equal(read.microfrontends[0].route, 'home');
  assert.deepEqual(read.microfrontends[0].components, { widget: './Widget' });
  assert.equal(read.microfrontends[1].route, undefined);
  assert.deepEqual(read.microfrontends[1].components, { main: './Calculator' });
});
