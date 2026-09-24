import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { compareManagedFiles } from '../dist/application/project-update.js';

test('omite archivos generados con rutas de Windows', (context) => {
  const root = mkdtempSync(join(tmpdir(), 'open-mova-project-update-'));
  context.after(() => rmSync(root, { recursive: true, force: true }));

  const application = join(root, 'application');
  const current = join(root, 'current');
  const target = join(root, 'target');
  for (const directory of [application, current, target]) {
    mkdirSync(join(directory, 'src', 'app'), { recursive: true });
  }

  writeFileSync(join(current, 'src', 'app', 'application.config.ts'), 'current');
  writeFileSync(join(target, 'src', 'app', 'application.config.ts'), 'target');
  writeFileSync(join(application, 'src', 'app', 'application.config.ts'), 'generated-from-app');

  const conflicts = [];
  const changes = compareManagedFiles(
    application,
    current,
    target,
    conflicts,
    new Set(['src\\app\\application.config.ts']),
  );

  assert.deepEqual(conflicts, []);
  assert.deepEqual(changes, []);
});
