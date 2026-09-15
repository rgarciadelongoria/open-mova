import { Dialog } from '@capacitor/dialog';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const dialogCapability = createNativePluginCapability<NativeCapabilities['dialog']>('Dialog', Dialog);
