import assert from 'node:assert/strict';
import test from 'node:test';
import { NATIVE_CAPABILITY_API } from '../dist/index.js';

test('el catálogo nativo define operaciones y eventos sin duplicados', () => {
  const capabilities = Object.entries(NATIVE_CAPABILITY_API);

  assert.ok(capabilities.length > 0);

  for (const [name, definition] of capabilities) {
    assert.ok(definition.operations.length > 0, `${name} debe exponer alguna operación`);
    assert.equal(
      new Set(definition.operations).size,
      definition.operations.length,
      `${name} contiene operaciones duplicadas`,
    );
    assert.equal(
      new Set(definition.events).size,
      definition.events.length,
      `${name} contiene eventos duplicados`,
    );
  }
});

test('el contrato conserva los accesos directos fundamentales', () => {
  assert.ok(NATIVE_CAPABILITY_API.device.operations.includes('getInfo'));
  assert.ok(NATIVE_CAPABILITY_API.camera.operations.includes('takePhoto'));
});
