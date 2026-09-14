import { Camera } from '@capacitor/camera';
import type { NativeCapabilities } from '@open-mova/core';

export const cameraCapability = {
  async takePhoto() {
    const { webPath, uri } = await Camera.takePhoto({});
    return { webPath, uri };
  },

  async choosePhoto() {
    const { results } = await Camera.chooseFromGallery({});
    const photo = results[0];
    return photo ? { webPath: photo.webPath, uri: photo.uri } : undefined;
  },
} satisfies NativeCapabilities['camera'];
