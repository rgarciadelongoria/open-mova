import { Clipboard } from '@capacitor/clipboard';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const clipboardCapability = createNativePluginCapability<NativeCapabilities['clipboard']>(
  'Clipboard',
  Clipboard,
);
