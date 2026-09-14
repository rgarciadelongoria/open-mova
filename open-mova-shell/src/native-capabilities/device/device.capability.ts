import { Device } from '@capacitor/device';
import type { NativeCapabilities } from '@open-mova/core';

export const deviceCapability = {
  async getInfo() {
    const { model, platform, osVersion } = await Device.getInfo();
    return { model, platform, osVersion };
  },
} satisfies NativeCapabilities['device'];
