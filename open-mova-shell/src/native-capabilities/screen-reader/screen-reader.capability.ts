import { ScreenReader } from '@capacitor/screen-reader';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const screenReaderCapability = createNativePluginCapability<NativeCapabilities['screenReader']>(
  'ScreenReader',
  ScreenReader,
);
