import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const barcodeScannerCapability = createNativePluginCapability<
  NativeCapabilities['barcodeScanner']
>('CapacitorBarcodeScanner', CapacitorBarcodeScanner);
