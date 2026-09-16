import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeName, toDisplayName, toPascalCase, toRemoteName } from '../dist/utils/names.js';
import { changeDirectoryCommand } from '../dist/utils/platform.js';

test('normaliza nombres de proyectos y microfrontales', () => {
  assert.equal(normalizeName('Mi Catálogo', 'Nombre'), 'mi-cat-logo');
  assert.equal(normalizeName('userProfile', 'Nombre'), 'user-profile');
  assert.equal(toDisplayName('user-profile'), 'User Profile');
  assert.equal(toPascalCase('user-profile'), 'UserProfile');
  assert.equal(toRemoteName('catalog'), 'catalog-microfrontend');
});

test('rechaza nombres vacíos', () => {
  assert.throws(() => normalizeName('---', 'Nombre'), /debe contener letras/);
});

test('genera un cambio de directorio copiable también en Windows', () => {
  assert.equal(changeDirectoryCommand('C:\\Open Mova\\demo-app'), 'cd "C:/Open Mova/demo-app"');
});
