import { initFederation } from '@angular-architects/native-federation';
import { publishNativeCapabilities } from './native-capabilities';

// El manifiesto permite cambiar la ubicación de los remotos sin tocar la shell.
publishNativeCapabilities();
initFederation('assets/federation.manifest.json')
  .then(() => import('./bootstrap'))
  .catch((error: unknown) => console.error(error));
