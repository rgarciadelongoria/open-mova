import { Keyboard } from '@capacitor/keyboard';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const keyboardCapability = createNativePluginCapability<NativeCapabilities['keyboard']>(
  'Keyboard',
  Keyboard,
);
