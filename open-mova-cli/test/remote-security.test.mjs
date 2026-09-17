import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allowedRemoteOrigins,
  createProductionRemoteManifest,
} from '../dist/application/remote-security.js';

const remote = {
  name: 'catalog',
  route: 'catalog',
  remoteName: 'catalog-microfrontend',
  exposedModule: './Routes',
  developmentRemoteEntry: 'http://localhost:4300/remoteEntry.json',
  productionRemoteEntry: 'https://cdn.example.com/catalog/1.4.0/remoteEntry.json',
  compatibility: { requiredCoreVersion: '^0.2.2' },
};

test('genera un manifiesto de producción solo para orígenes HTTPS de confianza', () => {
  const configuration = {
    schemaVersion: 4,
    name: 'demo-app',
    security: { trustedRemoteOrigins: ['https://cdn.example.com'] },
    microfrontends: [remote],
  };

  assert.deepEqual(createProductionRemoteManifest(configuration), {
    'catalog-microfrontend': 'https://cdn.example.com/catalog/1.4.0/remoteEntry.json',
  });
  assert.deepEqual(allowedRemoteOrigins(remote, configuration), [
    'http://localhost:4300',
    'https://cdn.example.com',
  ]);
});

test('rechaza una URL de producción cuyo origen no está declarado', () => {
  const configuration = {
    schemaVersion: 4,
    name: 'demo-app',
    security: { trustedRemoteOrigins: ['https://cdn.example.com'] },
    microfrontends: [
      {
        ...remote,
        productionRemoteEntry: 'https://untrusted.example.com/catalog/1.4.0/remoteEntry.json',
      },
    ],
  };

  assert.throws(() => createProductionRemoteManifest(configuration), /no está en security/);
});
