import { Device } from '@capacitor/device';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const deviceCapability = {
  ...createNativePluginCapability<NativeCapabilities['device']>('Device', Device),

  async getInfo() {
    const { model, platform, osVersion } = await Device.getInfo();
    return { model, platform, osVersion };
  },
} satisfies NativeCapabilities['device'];
