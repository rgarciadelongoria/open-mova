import type { Provider } from '@angular/core';
import { NATIVE_CAPABILITIES, type NativeCapabilities } from '@open-mova/core';
import { cameraCapability } from './camera/camera.capability';
import { deviceCapability } from './device/device.capability';

// Este fichero compone las capacidades y las expone mediante el contrato de core.
const nativeCapabilities = {
  version: 1,
  device: deviceCapability,
  camera: cameraCapability,
} satisfies NativeCapabilities;

export function provideNativeCapabilities(): Provider {
  return {
    provide: NATIVE_CAPABILITIES,
    useValue: nativeCapabilities,
  };
}
