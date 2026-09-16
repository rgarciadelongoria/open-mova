import { Geolocation } from '@capacitor/geolocation';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const geolocationCapability = createNativePluginCapability<
  NativeCapabilities['geolocation']
>('Geolocation', Geolocation);
