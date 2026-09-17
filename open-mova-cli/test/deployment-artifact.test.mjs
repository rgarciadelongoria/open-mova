import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { writeMicrofrontendDeploymentDescriptor } from '../dist/application/deployment-artifact.js';
import { buildLocalMicrofrontend } from '../dist/application/microfrontend-build.js';

test('compila un MF local y genera un descriptor de despliegue neutral', (context) => {
  const applicationRoot = mkdtempSync(join(tmpdir(), 'open-mova-deploy-'));
  context.after(() => rmSync(applicationRoot, { recursive: true, force: true }));
  const projectRoot = join(applicationRoot, 'mfs', 'catalog');
  mkdirSync(projectRoot, { recursive: true });
  writeFileSync(
    join(projectRoot, 'package.json'),
    JSON.stringify({ scripts: { build: 'node build.mjs' } }),
  );
  writeFileSync(
    join(projectRoot, 'build.mjs'),
    "import { mkdirSync, writeFileSync } from 'node:fs';\nmkdirSync('dist/browser', { recursive: true });\nwriteFileSync('dist/browser/remoteEntry.json', '{}');\n",
  );

  const configuration = {
    schemaVersion: 4,
    name: 'demo-app',
    security: { trustedRemoteOrigins: [] },
    microfrontends: [
      {
        name: 'catalog',
        route: 'catalog',
        remoteName: 'catalog-microfrontend',
        exposedModule: './Routes',
        developmentRemoteEntry: 'http://localhost:4300/remoteEntry.json',
        sourcePath: 'mfs/catalog',
        compatibility: { requiredCoreVersion: '^0.2.2' },
      },
    ],
  };

  const build = buildLocalMicrofrontend(applicationRoot, configuration, 'catalog');
  assert.equal(existsSync(join(build.outputDirectory, 'remoteEntry.json')), true);

  const descriptor = writeMicrofrontendDeploymentDescriptor(build);
  assert.deepEqual(descriptor, {
    schemaVersion: 1,
    remoteName: 'catalog-microfrontend',
    remoteEntry: 'remoteEntry.json',
    exposedModule: './Routes',
    route: 'catalog',
    requiredCoreVersion: '^0.2.2',
  });
  assert.deepEqual(
    JSON.parse(readFileSync(join(build.outputDirectory, 'open-mova-deployment.json'), 'utf8')),
    descriptor,
  );
});
