import { initFederation } from '@angular-architects/native-federation';

// El manifiesto permite cambiar la ubicación de los remotos sin tocar la shell.
initFederation('assets/federation.manifest.json')
  .then(() => import('./bootstrap'))
  .catch((error: unknown) => console.error(error));
