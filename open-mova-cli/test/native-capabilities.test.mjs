import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  diagnoseNativeCapabilities,
  listNativeCapabilities,
} from '../dist/application/native-capabilities.js';
import { synchronizeShellConfiguration } from '../dist/application/shell-configuration.js';

test('genera un proveedor que solo importa las capacidades habilitadas', (context) => {
  const root = createFixture();
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const configuration = {
    schemaVersion: 4,
    name: 'demo-app',
    native: { capabilities: ['camera'] },
    security: { trustedRemoteOrigins: [] },
    microfrontends: [
      {
        name: 'home',
        route: 'home',
        remoteName: 'home-microfrontend',
        exposedModule: './Routes',
        developmentRemoteEntry: 'http://localhost:4300/remoteEntry.json',
        productionRemoteEntry: 'https://cdn.example.com/home/1.0.0/remoteEntry.json',
        compatibility: { requiredCoreVersion: '^0.2.2' },
      },
    ],
  };
  writeFileSync(join(root, 'mova.config.json'), `${JSON.stringify(configuration, null, 2)}\n`);

  synchronizeShellConfiguration(root, configuration);

  const provider = readFileSync(
    join(root, 'src/native-capabilities/native-capabilities.provider.ts'),
    'utf8',
  );
  assert.match(provider, /import \{ cameraCapability \}/);
  assert.doesNotMatch(provider, /import \{ deviceCapability \}/);
  assert.match(provider, /device: createUnavailableNativeCapability/);

  const routes = readFileSync(join(root, 'src', 'app', 'application.config.ts'), 'utf8');
  assert.match(routes, /allowedOrigins: \["http:\/\/localhost:4300"\]/);

  const statuses = listNativeCapabilities(root);
  assert.equal(statuses.find((status) => status.definition.name === 'camera')?.enabled, true);
  assert.equal(statuses.find((status) => status.definition.name === 'device')?.enabled, false);
  assert.match(diagnoseNativeCapabilities(root, 'ios').join('\n'), /NSCameraUsageDescription/);
});

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'open-mova-native-capabilities-'));
  mkdirSync(join(root, 'src/assets'), { recursive: true });
  mkdirSync(join(root, 'src/app'), { recursive: true });
  mkdirSync(join(root, 'src/native-capabilities'), { recursive: true });
  writeFileSync(
    join(root, 'native-capabilities.catalog.json'),
    JSON.stringify({
      schemaVersion: 1,
      capabilities: [
        {
          name: 'camera',
          implementation: 'camera/camera.capability',
          exportName: 'cameraCapability',
          package: '@capacitor/camera',
          version: '^8.2.4',
          platforms: ['android', 'ios', 'web'],
          permissions: { ios: ['NSCameraUsageDescription'] },
        },
        {
          name: 'device',
          implementation: 'device/device.capability',
          exportName: 'deviceCapability',
          package: '@capacitor/device',
          version: '^8.0.3',
          platforms: ['android', 'ios', 'web'],
        },
      ],
    }),
  );
  return root;
}
