import type { Provider } from '@angular/core';
import { NATIVE_CAPABILITIES, type NativeCapabilities } from '@open-mova/core';
import { createUnavailableNativeCapability } from './unavailable-native-capability';

// Generado por el CLI desde mova.config.json. No editar manualmente.
const nativeCapabilities = {
  version: 1,
  actionSheet: createUnavailableNativeCapability<NativeCapabilities['actionSheet']>('actionSheet'),
  app: createUnavailableNativeCapability<NativeCapabilities['app']>('app'),
  appLauncher: createUnavailableNativeCapability<NativeCapabilities['appLauncher']>('appLauncher'),
  backgroundRunner:
    createUnavailableNativeCapability<NativeCapabilities['backgroundRunner']>('backgroundRunner'),
  barcodeScanner:
    createUnavailableNativeCapability<NativeCapabilities['barcodeScanner']>('barcodeScanner'),
  browser: createUnavailableNativeCapability<NativeCapabilities['browser']>('browser'),
  calendar: createUnavailableNativeCapability<NativeCapabilities['calendar']>('calendar'),
  camera: createUnavailableNativeCapability<NativeCapabilities['camera']>('camera'),
  clipboard: createUnavailableNativeCapability<NativeCapabilities['clipboard']>('clipboard'),
  contacts: createUnavailableNativeCapability<NativeCapabilities['contacts']>('contacts'),
  cookies: createUnavailableNativeCapability<NativeCapabilities['cookies']>('cookies'),
  device: createUnavailableNativeCapability<NativeCapabilities['device']>('device'),
  dialog: createUnavailableNativeCapability<NativeCapabilities['dialog']>('dialog'),
  fileTransfer:
    createUnavailableNativeCapability<NativeCapabilities['fileTransfer']>('fileTransfer'),
  fileViewer: createUnavailableNativeCapability<NativeCapabilities['fileViewer']>('fileViewer'),
  filesystem: createUnavailableNativeCapability<NativeCapabilities['filesystem']>('filesystem'),
  geolocation: createUnavailableNativeCapability<NativeCapabilities['geolocation']>('geolocation'),
  googleMaps: createUnavailableNativeCapability<NativeCapabilities['googleMaps']>('googleMaps'),
  haptics: createUnavailableNativeCapability<NativeCapabilities['haptics']>('haptics'),
  healthFitness:
    createUnavailableNativeCapability<NativeCapabilities['healthFitness']>('healthFitness'),
  http: createUnavailableNativeCapability<NativeCapabilities['http']>('http'),
  inAppBrowser:
    createUnavailableNativeCapability<NativeCapabilities['inAppBrowser']>('inAppBrowser'),
  keyboard: createUnavailableNativeCapability<NativeCapabilities['keyboard']>('keyboard'),
  localLlm: createUnavailableNativeCapability<NativeCapabilities['localLlm']>('localLlm'),
  localNotifications:
    createUnavailableNativeCapability<NativeCapabilities['localNotifications']>(
      'localNotifications',
    ),
  motion: createUnavailableNativeCapability<NativeCapabilities['motion']>('motion'),
  network: createUnavailableNativeCapability<NativeCapabilities['network']>('network'),
  preferences: createUnavailableNativeCapability<NativeCapabilities['preferences']>('preferences'),
  privacyScreen:
    createUnavailableNativeCapability<NativeCapabilities['privacyScreen']>('privacyScreen'),
  pushNotifications:
    createUnavailableNativeCapability<NativeCapabilities['pushNotifications']>('pushNotifications'),
  screenOrientation:
    createUnavailableNativeCapability<NativeCapabilities['screenOrientation']>('screenOrientation'),
  screenReader:
    createUnavailableNativeCapability<NativeCapabilities['screenReader']>('screenReader'),
  share: createUnavailableNativeCapability<NativeCapabilities['share']>('share'),
  splashScreen:
    createUnavailableNativeCapability<NativeCapabilities['splashScreen']>('splashScreen'),
  statusBar: createUnavailableNativeCapability<NativeCapabilities['statusBar']>('statusBar'),
  systemBars: createUnavailableNativeCapability<NativeCapabilities['systemBars']>('systemBars'),
  textZoom: createUnavailableNativeCapability<NativeCapabilities['textZoom']>('textZoom'),
  toast: createUnavailableNativeCapability<NativeCapabilities['toast']>('toast'),
} satisfies NativeCapabilities;

export function provideNativeCapabilities(): Provider {
  return {
    provide: NATIVE_CAPABILITIES,
    useValue: nativeCapabilities,
  };
}
