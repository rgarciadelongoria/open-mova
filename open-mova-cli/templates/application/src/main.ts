import { initFederation } from '@angular-architects/native-federation';
import { publishNativeCapabilities } from './native-capabilities';

publishNativeCapabilities();
initFederation('assets/federation.manifest.json')
  .then(() => import('./bootstrap'))
  .catch((error: unknown) => console.error(error));
