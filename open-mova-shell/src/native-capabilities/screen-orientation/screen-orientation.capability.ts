import { ScreenOrientation } from '@capacitor/screen-orientation';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const screenOrientationCapability = createNativePluginCapability<
  NativeCapabilities['screenOrientation']
>('ScreenOrientation', ScreenOrientation);
