import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const LATEST_CONFIGURATION_SCHEMA_VERSION = 2;

export interface ConfigurationMigrationResult {
  readonly value: unknown;
  readonly migrations: readonly string[];
}

export function migrateConfiguration(
  value: unknown,
  applicationRoot: string,
): ConfigurationMigrationResult {
  if (!isRecord(value) || typeof value.schemaVersion !== 'number') {
    return { value, migrations: [] };
  }

  if (value.schemaVersion > LATEST_CONFIGURATION_SCHEMA_VERSION) {
    throw new Error(
      `mova.config.json usa schemaVersion ${value.schemaVersion}, pero este CLI solo admite hasta ${LATEST_CONFIGURATION_SCHEMA_VERSION}.`,
    );
  }

  let migrated: Record<string, unknown> = value;
  const migrations: string[] = [];

  if (migrated.schemaVersion === 1) {
    migrated = migrateVersionOne(migrated, applicationRoot);
    migrations.push('1 → 2: declarar la compatibilidad de Core de cada microfrontal');
  }

  return { value: migrated, migrations };
}

function migrateVersionOne(
  configuration: Record<string, unknown>,
  applicationRoot: string,
): Record<string, unknown> {
  const shellCoreVersion = readCoreVersion(join(applicationRoot, 'package.json'));
  const microfrontends = Array.isArray(configuration.microfrontends)
    ? configuration.microfrontends.map((entry) => {
        if (!isRecord(entry)) return entry;

        const sourcePath = typeof entry.sourcePath === 'string' ? entry.sourcePath : undefined;
        const localCoreVersion = sourcePath
          ? readCoreVersion(join(resolve(applicationRoot, sourcePath), 'package.json'))
          : undefined;
        const requiredCoreVersion = localCoreVersion ?? shellCoreVersion;

        return {
          ...entry,
          // El comodín conserva aplicaciones antiguas cuyo remoto no tenía
          // metadatos; se debe concretar al actualizar el MF.
          compatibility: { requiredCoreVersion: requiredCoreVersion ?? '*' },
        };
      })
    : configuration.microfrontends;

  return {
    ...configuration,
    schemaVersion: 2,
    microfrontends,
  };
}

function readCoreVersion(packagePath: string): string | undefined {
  if (!existsSync(packagePath)) return undefined;

  try {
    const packageConfiguration = JSON.parse(readFileSync(packagePath, 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    return packageConfiguration.dependencies?.['@open-mova/core'];
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
