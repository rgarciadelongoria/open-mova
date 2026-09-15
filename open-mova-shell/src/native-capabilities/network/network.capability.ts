import { Network } from '@capacitor/network';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const networkCapability = createNativePluginCapability<NativeCapabilities['network']>(
  'Network',
  Network,
);
