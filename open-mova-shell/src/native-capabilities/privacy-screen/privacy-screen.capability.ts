import { PrivacyScreen } from '@capacitor/privacy-screen';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const privacyScreenCapability = createNativePluginCapability<NativeCapabilities['privacyScreen']>(
  'PrivacyScreen',
  PrivacyScreen,
);
