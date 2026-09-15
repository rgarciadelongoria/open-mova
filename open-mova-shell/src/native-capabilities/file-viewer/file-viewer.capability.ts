import { FileViewer } from '@capacitor/file-viewer';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const fileViewerCapability = createNativePluginCapability<NativeCapabilities['fileViewer']>(
  'FileViewer',
  FileViewer,
);
