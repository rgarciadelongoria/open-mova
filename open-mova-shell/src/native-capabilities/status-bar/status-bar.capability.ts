import { StatusBar } from '@capacitor/status-bar';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const statusBarCapability = createNativePluginCapability<NativeCapabilities['statusBar']>(
  'StatusBar',
  StatusBar,
);
