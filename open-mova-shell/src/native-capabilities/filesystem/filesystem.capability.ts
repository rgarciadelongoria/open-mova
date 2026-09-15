import { Filesystem } from '@capacitor/filesystem';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const filesystemCapability = createNativePluginCapability<NativeCapabilities['filesystem']>(
  'Filesystem',
  Filesystem,
);
