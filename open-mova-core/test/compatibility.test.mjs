import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkCoreCompatibility,
  OPEN_MOVA_CORE_VERSION,
  parseMicrofrontendManifest,
} from '../dist/index.js';

test('comprueba rangos de Core exactos, caret y tilde', () => {
  assert.equal(checkCoreCompatibility('^0.2.0', '0.2.5').compatible, true);
  assert.equal(checkCoreCompatibility('^0.2.0', '0.3.0').compatible, false);
  assert.equal(checkCoreCompatibility('~1.4.2', '1.4.9').compatible, true);
  assert.equal(checkCoreCompatibility('~1.4.2', '1.5.0').compatible, false);
  assert.equal(checkCoreCompatibility('1.2.3', '1.2.3').compatible, true);
  assert.equal(checkCoreCompatibility('1.2.3', '1.2.4').compatible, false);
});

test('valida el manifiesto de compatibilidad de un microfrontal', () => {
  const manifest = parseMicrofrontendManifest({
    schemaVersion: 1,
    name: 'catalog',
    remoteName: 'catalog-microfrontend',
    core: { requiredVersion: `^${OPEN_MOVA_CORE_VERSION}` },
  });

  assert.equal(manifest.remoteName, 'catalog-microfrontend');
  assert.throws(() => parseMicrofrontendManifest({ schemaVersion: 2 }), /versión no compatible/);
});
