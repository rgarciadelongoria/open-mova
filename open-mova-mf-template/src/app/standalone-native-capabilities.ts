import type { NativeCapabilities, NativePluginCapability } from '@open-mova/core';

const shellRequiredError = (): Error =>
  new Error('Abre este ejemplo desde la shell para usar capacidades nativas.');

function createUnavailableCapability(): NativePluginCapability<string, string> {
  return {
    isAvailable: () => false,
    invoke: async () => Promise.reject(shellRequiredError()),
    subscribe: async () => Promise.reject(shellRequiredError()),
  };
}

/** Permite recorrer los ejemplos seleccionados al abrir el remoto directamente. */
export function createStandaloneNativeCapabilities(): NativeCapabilities {
  return {
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
    share: createUnavailableCapability(),
  } as NativeCapabilities;
}
