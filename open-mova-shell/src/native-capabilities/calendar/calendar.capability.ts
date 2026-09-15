import { Calendar } from '@capacitor/calendar';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const calendarCapability = createNativePluginCapability<NativeCapabilities['calendar']>(
  'Calendar',
  Calendar,
);
