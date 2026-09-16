import { Preferences } from '@capacitor/preferences';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const preferencesCapability = createNativePluginCapability<
  NativeCapabilities['preferences']
>('Preferences', Preferences);
