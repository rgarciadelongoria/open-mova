import { GoogleMap } from '@capacitor/google-maps';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const googleMapsCapability = createNativePluginCapability<NativeCapabilities['googleMaps']>(
  'CapacitorGoogleMaps',
  GoogleMap,
);
