import { Camera } from '@capacitor/camera';
import { Device } from '@capacitor/device';

// La interfaz pública equivalente se define en @open-mova/core.
export const nativeCapabilities = {
  version: 1,
  device: {
    async getInfo() {
      const { model, platform, osVersion } = await Device.getInfo();
      return { model, platform, osVersion };
    },
  },
  camera: {
    async takePhoto() {
      const { webPath, uri } = await Camera.takePhoto({});
      return { webPath, uri };
    },
    async choosePhoto() {
      const { results } = await Camera.chooseFromGallery({});
      const photo = results[0];
      return photo ? { webPath: photo.webPath, uri: photo.uri } : undefined;
    },
  },
} as const;

export function publishNativeCapabilities(): void {
  Object.defineProperty(window, 'openMovaNative', {
    configurable: false,
    writable: false,
    value: nativeCapabilities,
  });
}
