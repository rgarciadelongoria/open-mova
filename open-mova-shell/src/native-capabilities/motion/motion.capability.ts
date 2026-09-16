import { Motion } from '@capacitor/motion';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const motionCapability = createNativePluginCapability<NativeCapabilities['motion']>(
  'Motion',
  Motion,
);
