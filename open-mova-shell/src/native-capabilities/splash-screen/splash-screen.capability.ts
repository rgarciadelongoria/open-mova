import { SplashScreen } from '@capacitor/splash-screen';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const splashScreenCapability = createNativePluginCapability<
  NativeCapabilities['splashScreen']
>('SplashScreen', SplashScreen);
