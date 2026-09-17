import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OpenMovaApplicationConfiguration } from '../types.js';
import { allowedRemoteOrigins } from './remote-security.js';

export interface NativeCapabilityDefinition {
  readonly name: string;
  readonly implementation: string;
  readonly exportName: string;
  readonly package: string;
  readonly version?: string;
  readonly platforms: readonly ('android' | 'ios' | 'web')[];
  readonly minimumAndroidSdk?: number;
  readonly permissions?: {
    readonly android?: readonly string[];
    readonly ios?: readonly string[];
  };
  readonly notes?: readonly string[];
}

interface NativeCapabilityCatalog {
  readonly schemaVersion: 1;
  readonly capabilities: readonly NativeCapabilityDefinition[];
}

export function synchronizeShellConfiguration(
  applicationRoot: string,
  configuration: OpenMovaApplicationConfiguration,
): void {
  const manifest = Object.fromEntries(
    configuration.microfrontends.map((microfrontend) => [
      microfrontend.remoteName,
      microfrontend.developmentRemoteEntry,
    ]),
  );

  writeFileSync(
    join(applicationRoot, 'src', 'assets', 'federation.manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  writeFileSync(
    join(applicationRoot, 'src', 'app', 'application.config.ts'),
    renderApplicationConfiguration(configuration),
    'utf8',
  );

  synchronizeNativeCapabilities(applicationRoot, configuration);
}

export function readNativeCapabilityCatalog(applicationRoot: string): NativeCapabilityCatalog {
  const catalogPath = join(applicationRoot, 'native-capabilities.catalog.json');
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as NativeCapabilityCatalog;

  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.capabilities)) {
    throw new Error(`${catalogPath} no contiene un catálogo de capacidades válido.`);
  }

  return catalog;
}

function synchronizeNativeCapabilities(
  applicationRoot: string,
  configuration: OpenMovaApplicationConfiguration,
): void {
  const catalog = readNativeCapabilityCatalog(applicationRoot);
  const enabledNames = new Set(configuration.native?.capabilities ?? []);
  const knownNames = new Set(catalog.capabilities.map((capability) => capability.name));
  const unknownNames = [...enabledNames].filter((name) => !knownNames.has(name));

  if (unknownNames.length > 0) {
    throw new Error(`Capacidades nativas desconocidas: ${unknownNames.join(', ')}.`);
  }

  const enabled = catalog.capabilities.filter((capability) => enabledNames.has(capability.name));
  const imports = enabled
    .map(
      (capability) => `import { ${capability.exportName} } from './${capability.implementation}';`,
    )
    .join('\n');
  const entries = catalog.capabilities
    .map((capability) => {
      const value = enabledNames.has(capability.name)
        ? capability.exportName
        : `createUnavailableNativeCapability<NativeCapabilities[${JSON.stringify(capability.name)}]>(${JSON.stringify(capability.name)})`;
      return `  ${capability.name}: ${value},`;
    })
    .join('\n');

  const source = `import type { Provider } from '@angular/core';
import { NATIVE_CAPABILITIES, type NativeCapabilities } from '@open-mova/core';
import { createUnavailableNativeCapability } from './unavailable-native-capability';
${imports ? `\n${imports}` : ''}

// Generado por el CLI desde mova.config.json. No editar manualmente.
const nativeCapabilities = {
  version: 1,
${entries}
} satisfies NativeCapabilities;

export function provideNativeCapabilities(): Provider {
  return {
    provide: NATIVE_CAPABILITIES,
    useValue: nativeCapabilities,
  };
}
`;

  writeFileSync(
    join(applicationRoot, 'src', 'native-capabilities', 'native-capabilities.provider.ts'),
    source,
    'utf8',
  );
}

function renderApplicationConfiguration(configuration: OpenMovaApplicationConfiguration): string {
  const entries = configuration.microfrontends
    .map(
      (microfrontend) => `  {
    path: ${JSON.stringify(microfrontend.route)},
    remote: ${JSON.stringify(microfrontend.remoteName)},
    exposedModule: './Routes',
    requiredCoreVersion: ${JSON.stringify(microfrontend.compatibility.requiredCoreVersion)},
    allowedOrigins: ${JSON.stringify(allowedRemoteOrigins(microfrontend, configuration))},
  },`,
    )
    .join('\n');

  return `export interface MicrofrontendDefinition {
  readonly path: string;
  readonly remote: string;
  readonly exposedModule: './Routes';
  readonly requiredCoreVersion: string;
  readonly allowedOrigins: readonly string[];
}

// Este fichero lo mantiene el CLI a partir de mova.config.json.
export const microfrontends: readonly MicrofrontendDefinition[] = [
${entries}
];
`;
}
