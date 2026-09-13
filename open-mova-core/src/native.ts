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

declare global {
  interface Window {
    readonly openMovaNative?: NativeCapabilities;
  }
}

// El host publica las capacidades antes de iniciar los microfrontales remotos.
export function getNativeCapabilities(): NativeCapabilities {
  const capabilities = window.openMovaNative;

  if (!capabilities || capabilities.version !== 1) {
    throw new Error('La shell no ofrece el contrato nativo Open Mova v1.');
  }

  return capabilities;
}
