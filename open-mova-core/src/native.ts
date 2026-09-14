import { InjectionToken, inject } from '@angular/core';

export interface DeviceDetails {
  readonly model: string;
  readonly platform: 'ios' | 'android' | 'web';
  readonly osVersion: string;
}

export interface DeviceCapability {
  getInfo(): Promise<DeviceDetails>;
}

export interface PhotoResult {
  readonly webPath?: string;
  readonly uri?: string;
}

export interface CameraCapability {
  takePhoto(): Promise<PhotoResult>;
  choosePhoto(): Promise<PhotoResult | undefined>;
}

export interface NativeCapabilities {
  readonly version: 1;
  readonly device: DeviceCapability;
  readonly camera: CameraCapability;
}

// Shell y remotos deben compartir una sola instancia de este token.
export const NATIVE_CAPABILITIES = new InjectionToken<NativeCapabilities>(
  'Open Mova native capabilities',
);

export function injectNativeCapabilities(): NativeCapabilities {
  const capabilities = inject(NATIVE_CAPABILITIES);

  if (capabilities.version !== 1) {
    throw new Error('La shell no ofrece el contrato nativo Open Mova v1.');
  }

  return capabilities;
}
