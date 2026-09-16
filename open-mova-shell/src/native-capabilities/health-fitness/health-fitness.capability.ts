import { HealthFitness } from '@capacitor/health-fitness';
import type { NativeCapabilities } from '@open-mova/core';
import { createNativePluginCapability } from '../create-native-plugin-capability';

export const healthFitnessCapability = createNativePluginCapability<
  NativeCapabilities['healthFitness']
>('HealthFitness', HealthFitness);
