import { AppLauncher } from '@capacitor/app-launcher';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const appLauncherCapability = createNativePluginCapability<
  NativeCapabilities['appLauncher']
>('AppLauncher', AppLauncher);
