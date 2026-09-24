import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { offerDependencyInstallation } from '../dist/commands/create.js';
import { isAffirmativeAnswer } from '../dist/ui/terminal.js';

test('la confirmación acepta Sí y trata Enter o No como opción negativa', () => {
  assert.equal(isAffirmativeAnswer('Sí'), true);
  assert.equal(isAffirmativeAnswer('yes'), true);
  assert.equal(isAffirmativeAnswer(''), false);
  assert.equal(isAffirmativeAnswer('  '), false);
  assert.equal(isAffirmativeAnswer('no'), false);
});

test('una confirmación negativa no ejecuta npm', async () => {
  const calls = [];
  await offerDependencyInstallation(
    '/app',
    true,
    async () => false,
    (directory) => {
      calls.push(directory);
    },
  );
  assert.deepEqual(calls, []);
});

test('Sí instala la aplicación y ambos MF', async () => {
  const calls = [];
  await offerDependencyInstallation(
    '/app',
    true,
    async () => true,
    (directory, label) => {
      calls.push([directory, label]);
    },
  );
  assert.deepEqual(calls, [
    ['/app', 'la aplicación'],
    [join('/app', 'mfs', 'home'), 'el MF home'],
    [join('/app', 'mfs', 'calculator'), 'el MF calculator'],
  ]);
});

test('Sí con --empty instala solo la shell', async () => {
  const calls = [];
  await offerDependencyInstallation(
    '/app',
    false,
    async () => true,
    (directory) => {
      calls.push(directory);
    },
  );
  assert.deepEqual(calls, ['/app']);
});

test('un fallo en el MF preserva la aplicación y detiene el comando', async (context) => {
  const applicationRoot = mkdtempSync(join(tmpdir(), 'open-mova-create-install-'));
  context.after(() => rmSync(applicationRoot, { recursive: true, force: true }));
  const calls = [];
  await assert.rejects(
    offerDependencyInstallation(
      applicationRoot,
      true,
      async () => true,
      (directory) => {
        calls.push(directory);
        if (directory.endsWith(join('mfs', 'home'))) throw new Error('npm falló');
      },
    ),
    /npm falló/,
  );
  assert.deepEqual(calls, [applicationRoot, join(applicationRoot, 'mfs', 'home')]);
  assert.equal(existsSync(applicationRoot), true);
});
