import { FileTransfer } from '@capacitor/file-transfer';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const fileTransferCapability = createNativePluginCapability<
  NativeCapabilities['fileTransfer']
>('FileTransfer', FileTransfer);
