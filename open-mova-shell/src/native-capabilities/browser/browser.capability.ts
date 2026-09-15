import { Browser } from '@capacitor/browser';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const browserCapability = createNativePluginCapability<NativeCapabilities['browser']>(
  'Browser',
  Browser,
);
