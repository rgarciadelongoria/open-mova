import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { inspectDevelopmentEnvironment } from '../dist/application/doctor.js';

test('diagnostica dependencias, Core y remotos de una aplicación', (context) => {
  const root = mkdtempSync(join(tmpdir(), 'open-mova-doctor-test-'));
  context.after(() => rmSync(root, { recursive: true, force: true }));

  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      dependencies: { '@open-mova/core': '^0.2.2' },
    }),
  );
  writeFileSync(
    join(root, 'mova.config.json'),
    JSON.stringify({
      schemaVersion: 1,
      name: 'demo-app',
      shell: {
        repository: 'https://example.com/open-mova.git',
        version: 'v0.2.1',
        commit: '0123456789abcdef',
      },
      microfrontends: [
        {
          name: 'home',
          route: 'home',
          remoteName: 'home-microfrontend',
          exposedModule: './Routes',
          developmentRemoteEntry: 'http://localhost:4300/remoteEntry.json',
          productionRemoteEntry: 'https://cdn.example.com/home/remoteEntry.json',
          sourcePath: 'mfs/home',
        },
      ],
    }),
  );
  mkdirSync(join(root, 'node_modules'));
  mkdirSync(join(root, 'mfs', 'home', 'node_modules'), { recursive: true });
  writeFileSync(
    join(root, 'mfs', 'home', 'package.json'),
    JSON.stringify({
      dependencies: { '@open-mova/core': '^0.2.2' },
    }),
  );

  const report = inspectDevelopmentEnvironment(root);
  const checks = new Map(report.checks.map((check) => [check.id, check]));

  assert.equal(checks.get('application')?.status, 'ok');
  assert.equal(checks.get('configuration')?.status, 'ok');
  assert.equal(checks.get('dependencies:shell')?.status, 'ok');
  assert.equal(checks.get('microfrontend:home:core')?.status, 'ok');
  assert.equal(checks.get('microfrontend:home:production')?.status, 'ok');
});
