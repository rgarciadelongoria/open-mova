import type { NativePluginCapability } from '@open-mova/core';

/**
 * Mantiene estable el contrato de Core aunque una aplicación no haya activado
 * una capacidad. Cualquier uso accidental produce un mensaje accionable.
 */
export function createUnavailableNativeCapability<TCapability>(name: string): TCapability {
  const unavailable = () =>
    Promise.reject(
      new Error(
        `La capacidad nativa "${name}" no está habilitada. Ejecuta: mova cap enable ${name}`,
      ),
    );

  const base: NativePluginCapability = {
    isAvailable: () => false,
    invoke: unavailable,
    subscribe: unavailable,
  };

  return new Proxy(base, {
    get(target, property, receiver) {
      if (property in target) {
        return Reflect.get(target, property, receiver);
      }

      return unavailable;
    },
  }) as TCapability;
}
