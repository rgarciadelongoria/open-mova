import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BuiltMicrofrontend } from './microfrontend-build.js';

export interface MicrofrontendDeploymentDescriptor {
  readonly schemaVersion: 1;
  readonly remoteName: string;
  readonly remoteEntry: 'remoteEntry.json';
  readonly exposedModule: './Routes';
  readonly route: string;
  readonly requiredCoreVersion: string;
}

/**
 * Describe un directorio de distribución sin imponer CDN, proveedor ni URL.
 * El pipeline del proveedor publica todo el directorio, conservando los nombres
 * de los assets que referencia remoteEntry.json.
 */
export function writeMicrofrontendDeploymentDescriptor(
  build: BuiltMicrofrontend,
): MicrofrontendDeploymentDescriptor {
  const descriptor: MicrofrontendDeploymentDescriptor = {
    schemaVersion: 1,
    remoteName: build.configuration.remoteName,
    remoteEntry: 'remoteEntry.json',
    exposedModule: build.configuration.exposedModule,
    route: build.configuration.route,
    requiredCoreVersion: build.configuration.compatibility.requiredCoreVersion,
  };

  writeFileSync(
    join(build.outputDirectory, 'open-mova-deployment.json'),
    `${JSON.stringify(descriptor, null, 2)}\n`,
    'utf8',
  );

  return descriptor;
}
