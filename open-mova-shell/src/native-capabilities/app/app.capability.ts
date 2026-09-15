import { App } from '@capacitor/app';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const appCapability = createNativePluginCapability<NativeCapabilities['app']>('App', App);
