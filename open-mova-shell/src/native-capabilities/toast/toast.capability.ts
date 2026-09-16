import { Toast } from '@capacitor/toast';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const toastCapability = createNativePluginCapability<NativeCapabilities['toast']>(
  'Toast',
  Toast,
);
