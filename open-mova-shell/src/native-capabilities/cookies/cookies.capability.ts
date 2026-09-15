import { CapacitorCookies } from '@capacitor/core';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const cookiesCapability = createNativePluginCapability<NativeCapabilities['cookies']>(
  'CapacitorCookies',
  CapacitorCookies,
);
