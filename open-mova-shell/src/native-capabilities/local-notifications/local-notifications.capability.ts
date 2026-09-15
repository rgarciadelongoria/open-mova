import { LocalNotifications } from '@capacitor/local-notifications';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const localNotificationsCapability = createNativePluginCapability<NativeCapabilities['localNotifications']>(
  'LocalNotifications',
  LocalNotifications,
);
