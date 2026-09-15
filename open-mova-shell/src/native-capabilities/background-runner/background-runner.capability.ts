import { BackgroundRunner } from '@capacitor/background-runner';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const backgroundRunnerCapability = createNativePluginCapability<NativeCapabilities['backgroundRunner']>(
  'CapacitorBackgroundRunner',
  BackgroundRunner,
);
