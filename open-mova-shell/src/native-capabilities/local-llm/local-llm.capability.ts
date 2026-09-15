import { LocalLLM } from '@capacitor/local-llm';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const localLlmCapability = createNativePluginCapability<NativeCapabilities['localLlm']>(
  'LocalLLM',
  LocalLLM,
);
