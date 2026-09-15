import { Contacts } from '@capacitor/contacts';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const contactsCapability = createNativePluginCapability<NativeCapabilities['contacts']>(
  'Contacts',
  Contacts,
);
