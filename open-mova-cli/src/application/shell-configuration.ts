import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OpenMovaApplicationConfiguration } from '../types.js';

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
}

function renderApplicationConfiguration(
  configuration: OpenMovaApplicationConfiguration,
): string {
  const entries = configuration.microfrontends
    .map(
      (microfrontend) => `  {
    path: ${JSON.stringify(microfrontend.route)},
    remote: ${JSON.stringify(microfrontend.remoteName)},
    exposedModule: './Routes',
  },`,
    )
    .join('\n');

  return `export interface MicrofrontendDefinition {
  readonly path: string;
  readonly remote: string;
  readonly exposedModule: './Routes';
}

// Este fichero lo mantiene el CLI a partir de mova.config.json.
export const microfrontends: readonly MicrofrontendDefinition[] = [
${entries}
];
`;
}
