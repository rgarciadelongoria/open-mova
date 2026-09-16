import { ActionSheet } from '@capacitor/action-sheet';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const actionSheetCapability = createNativePluginCapability<
  NativeCapabilities['actionSheet']
>('ActionSheet', ActionSheet);
