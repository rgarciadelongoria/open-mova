import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { packagesMatch, parseStableVersion, planNpmRelease } from './npm-release-plan.mjs';

test('publica solo versiones estables nuevas y permite primera publicación', () => {
  assert.equal(planNpmRelease('0.2.4', ['0.1.9', '0.2.3']), 'publish');
  assert.equal(planNpmRelease('0.1.0', []), 'publish');
  assert.equal(planNpmRelease('0.2.3', ['0.1.9', '0.2.3']), 'compare');
  assert.deepEqual(parseStableVersion('1.20.3'), [1, 20, 3]);
});

test('rechaza versión antigua o pre-release', () => {
  assert.throws(() => planNpmRelease('0.2.2', ['0.2.3']), /anterior/);
  assert.throws(() => planNpmRelease('0.2.2', ['0.2.2', '0.2.3']), /anterior/);
  assert.throws(() => planNpmRelease('0.2.4-beta.1', ['0.2.3']), /no válida/);
});

test('compara el contenido de los tarballs sin depender de metadatos gzip', (context) => {
  const root = mkdtempSync(join(tmpdir(), 'open-mova-npm-plan-'));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  const local = join(root, 'local');
  const registry = join(root, 'registry');
  mkdirSync(local);
  mkdirSync(registry);
  writeFileSync(join(local, 'index.js'), 'export const version = 1;');
  writeFileSync(join(registry, 'index.js'), 'export const version = 1;');
  assert.equal(packagesMatch(local, registry), true);
  writeFileSync(join(registry, 'index.js'), 'export const version = 2;');
  assert.equal(packagesMatch(local, registry), false);
});
