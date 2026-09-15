import { Haptics } from '@capacitor/haptics';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const hapticsCapability = createNativePluginCapability<NativeCapabilities['haptics']>(
  'Haptics',
  Haptics,
);
