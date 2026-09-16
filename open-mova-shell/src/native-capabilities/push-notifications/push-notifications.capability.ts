import { PushNotifications } from '@capacitor/push-notifications';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const pushNotificationsCapability = createNativePluginCapability<
  NativeCapabilities['pushNotifications']
>('PushNotifications', PushNotifications);
