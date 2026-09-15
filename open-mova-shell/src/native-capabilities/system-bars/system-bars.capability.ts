import { SystemBars } from '@capacitor/core';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const systemBarsCapability = createNativePluginCapability<NativeCapabilities['systemBars']>(
  'SystemBars',
  SystemBars,
);
