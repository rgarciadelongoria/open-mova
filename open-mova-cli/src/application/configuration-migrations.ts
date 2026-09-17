import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const LATEST_CONFIGURATION_SCHEMA_VERSION = 4;

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

  if (migrated.schemaVersion === 2) {
    migrated = migrateVersionTwo(migrated, applicationRoot);
    migrations.push('2 → 3: declarar las capacidades nativas habilitadas');
  }

  if (migrated.schemaVersion === 3) {
    migrated = migrateVersionThree(migrated);
    migrations.push('3 → 4: declarar los orígenes de remotos de confianza');
  }

  return { value: migrated, migrations };
}

function migrateVersionThree(configuration: Record<string, unknown>): Record<string, unknown> {
  const trustedRemoteOrigins = new Set<string>();

  if (Array.isArray(configuration.microfrontends)) {
    for (const microfrontend of configuration.microfrontends) {
      if (!isRecord(microfrontend)) continue;

      for (const entry of [
        microfrontend.productionRemoteEntry,
        microfrontend.developmentRemoteEntry,
      ]) {
        if (typeof entry !== 'string') continue;
        const origin = toHttpsOrigin(entry);
        if (origin) trustedRemoteOrigins.add(origin);
      }
    }
  }

  return {
    ...configuration,
    schemaVersion: 4,
    security: { trustedRemoteOrigins: [...trustedRemoteOrigins].sort() },
  };
}

function toHttpsOrigin(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.origin : undefined;
  } catch {
    return undefined;
  }
}

function migrateVersionTwo(
  configuration: Record<string, unknown>,
  applicationRoot: string,
): Record<string, unknown> {
  const currentNative = isRecord(configuration.native) ? configuration.native : {};

  return {
    ...configuration,
    schemaVersion: 3,
    native: {
      ...currentNative,
      // Las aplicaciones anteriores incluían todos los plugins. Se conservan
      // explícitamente hasta que el equipo decida deshabilitarlos.
      capabilities: readLegacyCapabilities(configuration, applicationRoot),
    },
  };
}

function readLegacyCapabilities(
  configuration: Record<string, unknown>,
  applicationRoot: string,
): readonly string[] {
  if (isRecord(configuration.native) && Array.isArray(configuration.native.capabilities)) {
    return configuration.native.capabilities.filter(
      (capability): capability is string => typeof capability === 'string',
    );
  }

  const packageConfiguration = readJson(join(applicationRoot, 'package.json'));
  const catalog = readJson(join(applicationRoot, 'native-capabilities.catalog.json'));
  const dependencies = isRecord(packageConfiguration?.dependencies)
    ? packageConfiguration.dependencies
    : {};

  if (!Array.isArray(catalog?.capabilities)) return [];

  return catalog.capabilities
    .filter(
      (capability): capability is Record<string, unknown> & { name: string; package: string } =>
        isRecord(capability) &&
        typeof capability.name === 'string' &&
        typeof capability.package === 'string',
    )
    .filter(
      (capability) =>
        capability.package === '@capacitor/core' || capability.package in dependencies,
    )
    .map((capability) => capability.name as string);
}

function readJson(path: string): Record<string, unknown> | undefined {
  if (!existsSync(path)) return undefined;

  try {
    const value: unknown = JSON.parse(readFileSync(path, 'utf8'));
    return isRecord(value) ? value : undefined;
  } catch {
    return undefined;
  }
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
