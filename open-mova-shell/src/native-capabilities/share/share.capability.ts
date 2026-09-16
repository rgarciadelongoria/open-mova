import { Share } from '@capacitor/share';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const shareCapability = createNativePluginCapability<NativeCapabilities['share']>(
  'Share',
  Share,
);
