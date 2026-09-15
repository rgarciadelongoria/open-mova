import { TextZoom } from '@capacitor/text-zoom';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const textZoomCapability = createNativePluginCapability<NativeCapabilities['textZoom']>(
  'TextZoom',
  TextZoom,
);
