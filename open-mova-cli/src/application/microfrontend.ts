import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import type { MicrofrontendConfiguration, OpenMovaApplicationConfiguration } from '../types.js';
import { normalizeName, toRemoteName } from '../utils/names.js';
import {
  configureDownloadedMicrofrontend,
  type MicrofrontendProfile,
} from './microfrontend-profile.js';
import { downloadTaggedProject, type ShellVersion } from './shell-repository.js';
import { readRequiredCoreVersion } from './microfrontend-manifest.js';

export interface CreateMicrofrontendOptions {
  readonly name: string;
  readonly directory: string;
  readonly route?: string;
  readonly port?: number;
  readonly productionRemoteEntry?: string;
  readonly profile?: MicrofrontendProfile;
  readonly templateVersion?: string;
  readonly templateSource?: {
    readonly path: string;
    readonly version: ShellVersion;
  };
}

export interface ExistingMicrofrontendOptions {
  readonly sourcePath?: string;
  readonly name?: string;
  readonly route?: string;
  readonly remoteName?: string;
  readonly remoteEntry?: string;
  readonly productionRemoteEntry?: string;
  readonly port?: number;
  readonly coreVersion?: string;
  readonly components?: Readonly<Record<string, string>>;
}

export function createMicrofrontend(
  applicationRoot: string,
  configuration: OpenMovaApplicationConfiguration,
  options: CreateMicrofrontendOptions,
): MicrofrontendConfiguration {
  const name = normalizeName(options.name, 'El nombre del microfrontal');
  const route = profileRoute(options.profile, options.route, name);
  const destination = resolve(applicationRoot, options.directory);

  if (existsSync(destination)) {
    throw new Error(`Ya existe un directorio en ${destination}.`);
  }

  const port = options.port ?? findAvailablePort(configuration);
  validatePort(port);

  const profile = options.profile ?? 'minimal';
  let template: ShellVersion;
  let exposures: { readonly components?: Readonly<Record<string, string>> };
  try {
    if (options.templateSource) {
      cpSync(options.templateSource.path, destination, { recursive: true });
      template = options.templateSource.version;
    } else {
      template = downloadTaggedProject(
        'open-mova-mf-template',
        destination,
        options.templateVersion,
      );
    }
    exposures = configureDownloadedMicrofrontend(destination, name, port, profile);
  } catch (error) {
    rmSync(destination, { recursive: true, force: true });
    throw error;
  }

  return {
    name,
    ...(route ? { route, exposedModule: './Routes' as const } : {}),
    remoteName: toRemoteName(name),
    ...exposures,
    developmentRemoteEntry: `http://localhost:${port}/remoteEntry.json`,
    ...(options.productionRemoteEntry
      ? { productionRemoteEntry: options.productionRemoteEntry }
      : {}),
    sourcePath: toConfigurationPath(applicationRoot, destination),
    compatibility: {
      requiredCoreVersion: readRequiredCoreVersion(destination),
    },
    template: { ...template, project: 'open-mova-mf-template', profile },
  };
}

function profileRoute(
  profile: MicrofrontendProfile | undefined,
  route: string | undefined,
  name: string,
): string | undefined {
  return profile === 'calculator'
    ? undefined
    : normalizeName(route ?? name, 'La ruta del microfrontal');
}

export function inspectExistingMicrofrontend(
  applicationRoot: string,
  options: ExistingMicrofrontendOptions,
): MicrofrontendConfiguration {
  if (!options.sourcePath && !options.remoteEntry) {
    throw new Error(
      'Indica una ruta de proyecto o usa --remote-entry para registrar un microfrontal ya desplegado.',
    );
  }

  const sourceDirectory = options.sourcePath
    ? resolve(applicationRoot, options.sourcePath)
    : undefined;
  const discovered = sourceDirectory
    ? inspectLocalProject(sourceDirectory)
    : { remoteName: undefined, port: undefined, requiredCoreVersion: undefined };
  const remoteName = options.remoteName ?? discovered.remoteName;
  const inferredName = remoteName?.replace(/-microfrontend$/, '');
  const name = normalizeName(options.name ?? inferredName ?? '', 'El nombre del microfrontal');
  const route =
    options.components && options.route === undefined
      ? undefined
      : normalizeName(options.route ?? name, 'La ruta del microfrontal');
  const resolvedRemoteName = remoteName ?? toRemoteName(name);
  const port = options.port ?? discovered.port;

  if (port !== undefined) {
    validatePort(port);
  }

  const remoteEntry =
    options.remoteEntry ??
    (port === undefined ? undefined : `http://localhost:${port}/remoteEntry.json`);

  if (!remoteEntry) {
    throw new Error('No se ha podido detectar el puerto. Indica --remote-entry o --port.');
  }

  const requiredCoreVersion =
    options.coreVersion ??
    discovered.requiredCoreVersion ??
    readRequiredCoreVersion(applicationRoot);
  if (!requiredCoreVersion) {
    throw new Error(
      'Indica --core-version para declarar qué versión de @open-mova/core necesita el microfrontal remoto.',
    );
  }

  return {
    name,
    ...(route ? { route, exposedModule: './Routes' as const } : {}),
    remoteName: resolvedRemoteName,
    ...(options.components ? { components: options.components } : {}),
    developmentRemoteEntry: remoteEntry,
    ...(options.productionRemoteEntry
      ? { productionRemoteEntry: options.productionRemoteEntry }
      : {}),
    ...(sourceDirectory
      ? { sourcePath: toConfigurationPath(applicationRoot, sourceDirectory) }
      : {}),
    compatibility: { requiredCoreVersion },
  };
}

function inspectLocalProject(directory: string): {
  readonly remoteName?: string;
  readonly port?: number;
  readonly requiredCoreVersion?: string;
} {
  const federationConfiguration = resolve(directory, 'federation.config.js');
  const angularConfiguration = resolve(directory, 'angular.json');
  const packageConfiguration = resolve(directory, 'package.json');

  if (
    !existsSync(federationConfiguration) ||
    !existsSync(angularConfiguration) ||
    !existsSync(packageConfiguration)
  ) {
    throw new Error(
      `${directory} no parece un microfrontal Open Mova. Debe contener package.json, angular.json y federation.config.js.`,
    );
  }

  const federationContent = readFileSync(federationConfiguration, 'utf8');
  const remoteName = federationContent.match(/\bname\s*:\s*['"]([^'"]+)['"]/)?.[1];
  const port = readPort(angularConfiguration);

  return { remoteName, port, requiredCoreVersion: readRequiredCoreVersion(directory) };
}

function readPort(configurationPath: string): number | undefined {
  const parsed: unknown = JSON.parse(readFileSync(configurationPath, 'utf8'));

  if (!isRecord(parsed) || !isRecord(parsed.projects)) {
    return undefined;
  }

  const firstProject = Object.values(parsed.projects)[0];

  if (!isRecord(firstProject) || !isRecord(firstProject.architect)) {
    return undefined;
  }

  const serveApplication = firstProject.architect['serve-application'];

  if (!isRecord(serveApplication) || !isRecord(serveApplication.options)) {
    return undefined;
  }

  const port = serveApplication.options.port;
  return typeof port === 'number' ? port : undefined;
}

function findAvailablePort(configuration: OpenMovaApplicationConfiguration): number {
  const occupiedPorts = configuration.microfrontends
    .map((microfrontend) => extractPort(microfrontend.developmentRemoteEntry))
    .filter((port): port is number => port !== undefined);
  let candidate = 4300;

  while (occupiedPorts.includes(candidate)) {
    candidate += 100;
  }

  return candidate;
}

function extractPort(remoteEntry: string): number | undefined {
  try {
    const port = new URL(remoteEntry).port;
    return port === '' ? undefined : Number(port);
  } catch {
    return undefined;
  }
}

function validatePort(port: number): void {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('El puerto debe ser un número entre 1 y 65535.');
  }
}

function toConfigurationPath(applicationRoot: string, targetPath: string): string {
  return relative(applicationRoot, targetPath).split(sep).join('/');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
