import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OpenMovaApplicationConfiguration } from '../types.js';
import { npmCommand, useCommandShell } from '../utils/platform.js';
import { readApplicationConfiguration, writeApplicationConfiguration } from './configuration.js';
import {
  readNativeCapabilityCatalog,
  synchronizeShellConfiguration,
  type NativeCapabilityDefinition,
} from './shell-configuration.js';

export interface NativeCapabilityStatus {
  readonly definition: NativeCapabilityDefinition;
  readonly enabled: boolean;
}

export function listNativeCapabilities(applicationRoot: string): readonly NativeCapabilityStatus[] {
  const configuration = readApplicationConfiguration(applicationRoot);
  const enabled = new Set(configuration.native?.capabilities ?? []);

  return readNativeCapabilityCatalog(applicationRoot).capabilities.map((definition) => ({
    definition,
    enabled: enabled.has(definition.name),
  }));
}

export function enableNativeCapabilities(
  applicationRoot: string,
  requestedNames: readonly string[],
): OpenMovaApplicationConfiguration {
  const configuration = readApplicationConfiguration(applicationRoot);
  const definitions = resolveDefinitions(applicationRoot, requestedNames);
  const enabled = new Set(configuration.native?.capabilities ?? []);
  const newDefinitions = definitions.filter((definition) => !enabled.has(definition.name));

  for (const definition of definitions) enabled.add(definition.name);
  installPackages(applicationRoot, newDefinitions);

  return persistCapabilities(applicationRoot, configuration, [...enabled]);
}

export function disableNativeCapabilities(
  applicationRoot: string,
  requestedNames: readonly string[],
): OpenMovaApplicationConfiguration {
  const configuration = readApplicationConfiguration(applicationRoot);
  const definitions = resolveDefinitions(applicationRoot, requestedNames);
  const currentlyEnabled = new Set(configuration.native?.capabilities ?? []);
  const activeDefinitions = definitions.filter((definition) =>
    currentlyEnabled.has(definition.name),
  );
  const disabled = new Set(definitions.map((definition) => definition.name));
  const remainingNames = (configuration.native?.capabilities ?? []).filter(
    (name) => !disabled.has(name),
  );
  const remainingDefinitions =
    remainingNames.length > 0 ? resolveDefinitions(applicationRoot, remainingNames) : [];
  const retainedPackages = new Set(remainingDefinitions.map((definition) => definition.package));
  const packagesToRemove = [
    ...new Set(
      activeDefinitions
        .map((definition) => definition.package)
        .filter((packageName) => packageName !== '@capacitor/core'),
    ),
  ].filter((packageName) => !retainedPackages.has(packageName));

  uninstallPackages(applicationRoot, packagesToRemove);
  return persistCapabilities(applicationRoot, configuration, remainingNames);
}

export function diagnoseNativeCapabilities(
  applicationRoot: string,
  platform?: 'android' | 'ios',
): readonly string[] {
  const statuses = listNativeCapabilities(applicationRoot).filter((status) => status.enabled);
  const messages: string[] = [];

  if (statuses.length === 0) {
    return ['No hay capacidades nativas habilitadas.'];
  }

  for (const { definition } of statuses) {
    if (platform && !definition.platforms.includes(platform)) {
      messages.push(`⚠ ${definition.name}: no es compatible con ${platform}.`);
      continue;
    }

    const requirements: string[] = [];
    if (platform === 'android' && definition.minimumAndroidSdk) {
      requirements.push(`Android SDK mínimo ${definition.minimumAndroidSdk}`);
    }
    if (platform && definition.permissions?.[platform]?.length) {
      requirements.push(`permisos: ${definition.permissions[platform]?.join(', ')}`);
    }
    if (definition.notes?.length) requirements.push(...definition.notes);

    messages.push(
      requirements.length > 0
        ? `• ${definition.name}: ${requirements.join('; ')}`
        : `✓ ${definition.name}: sin configuración adicional declarada${platform ? ` para ${platform}` : ''}.`,
    );
  }

  return messages;
}

/**
 * Recompone las dependencias seleccionables después de actualizar la shell.
 * No instala paquetes: el flujo de update regenera después el lockfile.
 */
export function synchronizeNativeCapabilityDependencies(
  applicationRoot: string,
  configuration: OpenMovaApplicationConfiguration,
): void {
  const packagePath = join(applicationRoot, 'package.json');
  const packageConfiguration = JSON.parse(readFileSync(packagePath, 'utf8')) as {
    dependencies?: Record<string, string>;
  };
  const dependencies = { ...(packageConfiguration.dependencies ?? {}) };
  const catalog = readNativeCapabilityCatalog(applicationRoot);
  const enabled = new Set(configuration.native?.capabilities ?? []);
  const selectablePackages = new Set(
    catalog.capabilities
      .map((definition) => definition.package)
      .filter((packageName) => packageName !== '@capacitor/core'),
  );

  for (const packageName of selectablePackages) delete dependencies[packageName];
  for (const definition of catalog.capabilities) {
    if (
      enabled.has(definition.name) &&
      definition.package !== '@capacitor/core' &&
      definition.version
    ) {
      dependencies[definition.package] = definition.version;
    }
  }

  packageConfiguration.dependencies = Object.fromEntries(
    Object.entries(dependencies).sort(([first], [second]) => first.localeCompare(second)),
  );
  writeFileSync(packagePath, `${JSON.stringify(packageConfiguration, null, 2)}\n`, 'utf8');
}

function persistCapabilities(
  applicationRoot: string,
  configuration: OpenMovaApplicationConfiguration,
  capabilities: readonly string[],
): OpenMovaApplicationConfiguration {
  const updated: OpenMovaApplicationConfiguration = {
    ...configuration,
    native: {
      ...configuration.native,
      capabilities: [...new Set(capabilities)].sort(),
    },
  };

  writeApplicationConfiguration(applicationRoot, updated);
  synchronizeShellConfiguration(applicationRoot, updated);
  return updated;
}

function resolveDefinitions(
  applicationRoot: string,
  names: readonly string[],
): readonly NativeCapabilityDefinition[] {
  if (names.length === 0) throw new Error('Indica al menos una capacidad nativa.');

  const catalog = readNativeCapabilityCatalog(applicationRoot);
  const definitionsByName = new Map(
    catalog.capabilities.map((definition) => [definition.name, definition]),
  );
  const unknown = names.filter((name) => !definitionsByName.has(name));

  if (unknown.length > 0) {
    throw new Error(
      `Capacidades desconocidas: ${unknown.join(', ')}. Usa "mova cap list" para consultar el catálogo.`,
    );
  }

  return names.map((name) => definitionsByName.get(name) as NativeCapabilityDefinition);
}

function installPackages(
  applicationRoot: string,
  definitions: readonly NativeCapabilityDefinition[],
): void {
  const packages = [
    ...new Set(
      definitions
        .filter((definition) => definition.package !== '@capacitor/core')
        .map((definition) => `${definition.package}@${definition.version ?? 'latest'}`),
    ),
  ];

  if (packages.length > 0) runNpm(applicationRoot, ['install', '--save', ...packages]);
}

function uninstallPackages(applicationRoot: string, packages: readonly string[]): void {
  if (packages.length > 0) runNpm(applicationRoot, ['uninstall', '--save', ...packages]);
}

function runNpm(applicationRoot: string, arguments_: readonly string[]): void {
  if (!existsSync(join(applicationRoot, 'package.json'))) {
    throw new Error(`No se encuentra package.json en ${applicationRoot}.`);
  }

  const result = spawnSync(npmCommand(), arguments_, {
    cwd: applicationRoot,
    stdio: 'inherit',
    shell: useCommandShell(),
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${npmCommand()} ${arguments_.join(' ')} terminó con error.`);
  }
}
