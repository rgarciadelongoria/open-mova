import { CapacitorHttp } from '@capacitor/core';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const httpCapability = createNativePluginCapability<NativeCapabilities['http']>(
  'CapacitorHttp',
  CapacitorHttp,
);
