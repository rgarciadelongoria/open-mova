import { InAppBrowser } from '@capacitor/inappbrowser';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const inAppBrowserCapability = createNativePluginCapability<
  NativeCapabilities['inAppBrowser']
>('InAppBrowser', InAppBrowser);
