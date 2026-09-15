import {
  NATIVE_CAPABILITY_API,
  type NativeCapabilities,
  type NativePluginCapability,
} from '@open-mova/core';

const shellRequiredError = (): Error =>
  new Error('Abre este ejemplo desde la shell para usar capacidades nativas.');

function createUnavailableCapability(): NativePluginCapability<string, string> {
  return {
    isAvailable: () => false,
    invoke: async () => Promise.reject(shellRequiredError()),
    subscribe: async () => Promise.reject(shellRequiredError()),
  };
}

/** Permite navegar por toda la documentación al abrir el remoto directamente. */
export function createStandaloneNativeCapabilities(): NativeCapabilities {
  const capabilities = Object.fromEntries(
    Object.keys(NATIVE_CAPABILITY_API).map((name) => [name, createUnavailableCapability()]),
  );

  return {
    ...capabilities,
    version: 1,
    device: {
      ...createUnavailableCapability(),
      getInfo: async () => Promise.reject(shellRequiredError()),
    },
    camera: {
      ...createUnavailableCapability(),
      takePhoto: async () => Promise.reject(shellRequiredError()),
      choosePhoto: async () => Promise.reject(shellRequiredError()),
    },
  } as NativeCapabilities;
}
