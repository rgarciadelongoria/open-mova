import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const MICROFRONTEND_MANIFEST_PATH = 'assets/open-mova.manifest.json';

export function readRequiredCoreVersion(projectRoot: string): string {
  const packageConfiguration = JSON.parse(
    readFileSync(join(projectRoot, 'package.json'), 'utf8'),
  ) as {
    dependencies?: Record<string, string>;
  };
  const requiredVersion = packageConfiguration.dependencies?.['@open-mova/core'];

  if (!requiredVersion) {
    throw new Error(
      `${projectRoot} debe declarar @open-mova/core en dependencies para definir su compatibilidad.`,
    );
  }
  return requiredVersion;
}

export function writeMicrofrontendManifest(
  projectRoot: string,
  name: string,
  remoteName: string,
  requiredCoreVersion: string,
): void {
  const manifest = {
    schemaVersion: 1,
    name,
    remoteName,
    core: { requiredVersion: requiredCoreVersion },
  };

  writeFileSync(
    join(projectRoot, 'src', 'assets', 'open-mova.manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
}
