import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { MicrofrontendConfiguration, OpenMovaApplicationConfiguration } from '../types.js';
import {
  LATEST_CONFIGURATION_SCHEMA_VERSION,
  migrateConfiguration,
} from './configuration-migrations.js';
import { trustedOriginsForMicrofrontend } from './remote-security.js';

export const APPLICATION_CONFIGURATION_FILE = 'mova.config.json';

export interface ApplicationConfigurationDocument {
  readonly configuration: OpenMovaApplicationConfiguration;
  readonly migrations: readonly string[];
}

export function findApplicationRoot(startDirectory: string): string | undefined {
  let currentDirectory = resolve(startDirectory);

  while (true) {
    if (existsSync(join(currentDirectory, APPLICATION_CONFIGURATION_FILE))) {
      return currentDirectory;
    }

    const parentDirectory = dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      return undefined;
    }

    currentDirectory = parentDirectory;
  }
}

export function requireApplicationRoot(startDirectory: string): string {
  const applicationRoot = findApplicationRoot(startDirectory);

  if (!applicationRoot) {
    throw new Error(
      `No se ha encontrado ${APPLICATION_CONFIGURATION_FILE}. Ejecuta este comando desde una aplicación Open Mova.`,
    );
  }

  return applicationRoot;
}

export function readApplicationConfiguration(
  applicationRoot: string,
): OpenMovaApplicationConfiguration {
  return readApplicationConfigurationDocument(applicationRoot).configuration;
}

export function readApplicationConfigurationDocument(
  applicationRoot: string,
): ApplicationConfigurationDocument {
  const configurationPath = join(applicationRoot, APPLICATION_CONFIGURATION_FILE);
  const parsed: unknown = JSON.parse(readFileSync(configurationPath, 'utf8'));
  const migration = migrateConfiguration(parsed, applicationRoot);

  return {
    configuration: validateApplicationConfiguration(migration.value, configurationPath),
    migrations: migration.migrations,
  };
}

export function writeApplicationConfiguration(
  applicationRoot: string,
  configuration: OpenMovaApplicationConfiguration,
): void {
  const configurationPath = join(applicationRoot, APPLICATION_CONFIGURATION_FILE);
  const content = `${JSON.stringify(configuration, null, 2)}\n`;

  writeFileSync(configurationPath, content, 'utf8');
}

export function addMicrofrontend(
  configuration: OpenMovaApplicationConfiguration,
  microfrontend: MicrofrontendConfiguration,
): OpenMovaApplicationConfiguration {
  const routeInUse = configuration.microfrontends.some(
    (entry) => microfrontend.route !== undefined && entry.route === microfrontend.route,
  );
  const nameInUse = configuration.microfrontends.some((entry) => entry.name === microfrontend.name);
  const remoteInUse = configuration.microfrontends.some(
    (entry) => entry.remoteName === microfrontend.remoteName,
  );
  const remoteEntryInUse = configuration.microfrontends.some(
    (entry) => entry.developmentRemoteEntry === microfrontend.developmentRemoteEntry,
  );

  if (nameInUse || routeInUse || remoteInUse || remoteEntryInUse) {
    throw new Error(
      `El microfrontal "${microfrontend.name}" entra en conflicto con una entrada existente. ` +
        'El nombre, la ruta, el remoto y la URL de desarrollo deben ser únicos.',
    );
  }

  const trustedRemoteOrigins = new Set(configuration.security.trustedRemoteOrigins);
  for (const origin of trustedOriginsForMicrofrontend(microfrontend)) {
    trustedRemoteOrigins.add(origin);
  }

  return {
    ...configuration,
    security: { trustedRemoteOrigins: [...trustedRemoteOrigins].sort() },
    microfrontends: [...configuration.microfrontends, microfrontend],
  };
}

function validateApplicationConfiguration(
  value: unknown,
  configurationPath: string,
): OpenMovaApplicationConfiguration {
  if (!isRecord(value)) {
    throw new Error(`${configurationPath} no contiene un objeto JSON válido.`);
  }

  if (
    value.schemaVersion !== LATEST_CONFIGURATION_SCHEMA_VERSION ||
    typeof value.name !== 'string'
  ) {
    throw new Error(`${configurationPath} no tiene el formato de Open Mova esperado.`);
  }

  if (!Array.isArray(value.microfrontends)) {
    throw new Error(`${configurationPath} debe contener una lista de microfrontales.`);
  }

  let shell: OpenMovaApplicationConfiguration['shell'];
  if (value.shell !== undefined) {
    if (
      !isRecord(value.shell) ||
      typeof value.shell.repository !== 'string' ||
      typeof value.shell.version !== 'string' ||
      typeof value.shell.commit !== 'string'
    ) {
      throw new Error(`${configurationPath} contiene una versión de shell no válida.`);
    }

    shell = {
      repository: value.shell.repository,
      version: value.shell.version,
      commit: value.shell.commit,
    };
  }

  let native: OpenMovaApplicationConfiguration['native'];
  if (value.native !== undefined) {
    if (!isRecord(value.native)) {
      throw new Error(`${configurationPath} contiene una configuración nativa no válida.`);
    }

    if (
      !Array.isArray(value.native.capabilities) ||
      value.native.capabilities.some((capability) => typeof capability !== 'string')
    ) {
      throw new Error(`${configurationPath} contiene capacidades nativas no válidas.`);
    }

    const capabilities = [...new Set(value.native.capabilities as string[])].sort();

    if (value.native.googleMaps !== undefined) {
      if (
        !isRecord(value.native.googleMaps) ||
        typeof value.native.googleMaps.androidApiKey !== 'string'
      ) {
        throw new Error(`${configurationPath} contiene una clave de Google Maps no válida.`);
      }

      native = {
        capabilities,
        googleMaps: {
          androidApiKey: value.native.googleMaps.androidApiKey,
        },
      };
    } else {
      native = { capabilities };
    }
  }

  if (!isRecord(value.security) || !Array.isArray(value.security.trustedRemoteOrigins)) {
    throw new Error(`${configurationPath} contiene una política de remotos no válida.`);
  }

  if (value.security.trustedRemoteOrigins.some((origin) => typeof origin !== 'string')) {
    throw new Error(`${configurationPath} contiene un origen remoto no válido.`);
  }

  const trustedRemoteOrigins = [...new Set(value.security.trustedRemoteOrigins as string[])].sort();
  for (const origin of trustedRemoteOrigins) {
    if (!isHttpsOrigin(origin)) {
      throw new Error(
        `${configurationPath} solo admite orígenes HTTPS sin ruta en security.trustedRemoteOrigins.`,
      );
    }
  }

  const microfrontends = value.microfrontends.map((entry) =>
    validateMicrofrontend(entry, configurationPath),
  );

  return {
    schemaVersion: LATEST_CONFIGURATION_SCHEMA_VERSION,
    name: value.name,
    ...(shell ? { shell } : {}),
    ...(native ? { native } : {}),
    security: { trustedRemoteOrigins },
    microfrontends,
  };
}

function validateMicrofrontend(
  value: unknown,
  configurationPath: string,
): MicrofrontendConfiguration {
  if (!isRecord(value)) {
    throw new Error(`${configurationPath} contiene un microfrontal no válido.`);
  }

  const requiredStrings = [value.name, value.remoteName, value.developmentRemoteEntry];

  if (requiredStrings.some((entry) => typeof entry !== 'string')) {
    throw new Error(`${configurationPath} contiene un microfrontal incompleto.`);
  }

  if (value.route !== undefined && (typeof value.route !== 'string' || !value.route)) {
    throw new Error(`${configurationPath} contiene una ruta de MF no válida.`);
  }
  if (
    value.route === undefined
      ? value.exposedModule !== undefined
      : value.exposedModule !== './Routes'
  ) {
    throw new Error(`${configurationPath} debe asociar cada ruta de MF con "./Routes".`);
  }
  let components: Record<string, string> | undefined;
  if (value.components !== undefined) {
    if (!isRecord(value.components) || Array.isArray(value.components)) {
      throw new Error(`${configurationPath} contiene componentes remotos no válidos.`);
    }
    components = {};
    for (const [alias, module] of Object.entries(value.components)) {
      if (
        !/^[a-z][a-z0-9-]*$/.test(alias) ||
        typeof module !== 'string' ||
        !/^\.\/[A-Za-z][A-Za-z0-9/_-]*$/.test(module)
      ) {
        throw new Error(`${configurationPath} contiene un alias o módulo de componente no válido.`);
      }
      components[alias] = module;
    }
  }
  if (value.route === undefined && !Object.keys(components ?? {}).length) {
    throw new Error(`${configurationPath} contiene un MF sin rutas ni componentes.`);
  }

  if (value.sourcePath !== undefined && typeof value.sourcePath !== 'string') {
    throw new Error(`${configurationPath} contiene una ruta de origen no válida.`);
  }

  if (
    value.productionRemoteEntry !== undefined &&
    typeof value.productionRemoteEntry !== 'string'
  ) {
    throw new Error(`${configurationPath} contiene una URL de producción no válida.`);
  }

  if (
    !isRecord(value.compatibility) ||
    typeof value.compatibility.requiredCoreVersion !== 'string' ||
    value.compatibility.requiredCoreVersion.trim() === ''
  ) {
    throw new Error(
      `${configurationPath} contiene un microfrontal sin compatibilidad de Core declarada.`,
    );
  }

  if (
    value.template !== undefined &&
    (!isRecord(value.template) ||
      typeof value.template.repository !== 'string' ||
      typeof value.template.version !== 'string' ||
      typeof value.template.commit !== 'string' ||
      value.template.project !== 'open-mova-mf-template' ||
      (value.template.profile !== 'minimal' &&
        value.template.profile !== 'demo' &&
        value.template.profile !== 'calculator' &&
        value.template.profile !== 'starter-both' &&
        value.template.profile !== 'starter-routes' &&
        value.template.profile !== 'starter-component') ||
      (value.template.componentName !== undefined &&
        (typeof value.template.componentName !== 'string' ||
          !/^[a-z][a-z0-9-]*$/.test(value.template.componentName))))
  ) {
    throw new Error(`${configurationPath} contiene una plantilla de microfrontal no válida.`);
  }

  return {
    name: value.name as string,
    ...(value.route === undefined ? {} : { route: value.route as string }),
    remoteName: value.remoteName as string,
    ...(value.route === undefined ? {} : { exposedModule: './Routes' as const }),
    ...(components ? { components } : {}),
    developmentRemoteEntry: value.developmentRemoteEntry as string,
    ...(value.productionRemoteEntry === undefined
      ? {}
      : { productionRemoteEntry: value.productionRemoteEntry }),
    ...(value.sourcePath === undefined ? {} : { sourcePath: value.sourcePath }),
    compatibility: {
      requiredCoreVersion: value.compatibility.requiredCoreVersion,
    },
    ...(value.template === undefined
      ? {}
      : { template: value.template as MicrofrontendConfiguration['template'] }),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isHttpsOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.origin === value;
  } catch {
    return false;
  }
}
