import { Capacitor } from '@capacitor/core';
import type { NativeOptions, NativeSubscription } from '@open-mova/core';

type PluginMethod = (...arguments_: unknown[]) => unknown;

type CapacitorPluginLike = object;

/**
 * Adapta la forma común de los plugins de Capacitor al contrato estable de
 * Open Mova. Las capacidades concretas permanecen en directorios separados.
 */
export function createNativePluginCapability<TCapability>(
  pluginName: string,
  plugin: CapacitorPluginLike,
): TCapability {
  const pluginRecord = plugin as Record<string, unknown>;

  return {
    isAvailable: () => Capacitor.isPluginAvailable(pluginName),

    async invoke(operation: string, options?: NativeOptions): Promise<unknown> {
      const method = pluginRecord[operation];

      if (typeof method !== 'function') {
        throw new Error(`La capacidad nativa ${pluginName} no ofrece ${operation}.`);
      }

      const invoke = method as PluginMethod;
      return options === undefined ? invoke.call(plugin) : invoke.call(plugin, options);
    },

    async subscribe(
      event: string,
      listener: (payload: unknown) => void,
    ): Promise<NativeSubscription> {
      const addListener = pluginRecord['addListener'];

      if (typeof addListener !== 'function') {
        throw new Error(`La capacidad nativa ${pluginName} no emite eventos.`);
      }

      return (addListener as PluginMethod).call(
        plugin,
        event,
        listener,
      ) as Promise<NativeSubscription>;
    },
  } as TCapability;
}
