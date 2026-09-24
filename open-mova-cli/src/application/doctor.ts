import { join, resolve } from 'node:path';
import { inspectAndroidProject } from './android-doctor.js';
import { findApplicationRoot, readApplicationConfigurationDocument } from './configuration.js';
import { areCoreRangesCompatible } from './core-compatibility.js';
import { createSystemDoctorRuntime, type DoctorRuntime } from './doctor-runtime.js';
import { inspectIosProject } from './ios-doctor.js';
import { npmCommand, useCommandShell } from '../utils/platform.js';
import { isHttpsUrl, isTrustedRemoteOrigin } from './remote-security.js';
import {
  readNativeCapabilityCatalog,
  type NativeCapabilityDefinition,
} from './shell-configuration.js';
import type { OpenMovaApplicationConfiguration } from '../types.js';

export type DoctorCheckStatus = 'ok' | 'warning' | 'error';
export type DoctorPlatform = 'android' | 'ios';

export interface DoctorCheck {
  readonly id: string;
  readonly status: DoctorCheckStatus;
  readonly message: string;
  readonly detail?: string;
}

export interface DoctorReport {
  readonly applicationRoot?: string;
  readonly checks: readonly DoctorCheck[];
}

export interface DoctorOptions {
  readonly platform?: DoctorPlatform;
  readonly runtime?: DoctorRuntime;
}

interface PackageConfiguration {
  readonly dependencies?: Readonly<Record<string, string>>;
}

export function inspectDevelopmentEnvironment(
  startDirectory: string,
  options: DoctorOptions = {},
): DoctorReport {
  const runtime = options.runtime ?? createSystemDoctorRuntime();
  const checks: DoctorCheck[] = [
    checkNodeVersion(runtime),
    checkCommand(runtime, npmCommand(), ['--version'], 'npm', true, 'npm', useCommandShell()),
    checkCommand(runtime, 'git', ['--version'], 'Git', true),
  ];
  const applicationRoot = findApplicationRoot(resolve(startDirectory));

  if (!applicationRoot) {
    checks.push(
      warning(
        'application',
        'No se ha encontrado una aplicación Open Mova.',
        'Ejecuta el comando dentro de un directorio que contenga mova.config.json.',
      ),
    );
    return { checks };
  }

  checks.push(ok('application', `Aplicación encontrada en ${applicationRoot}.`));
  let configuration: OpenMovaApplicationConfiguration;
  try {
    const document = readApplicationConfigurationDocument(applicationRoot);
    configuration = document.configuration;
    checks.push(ok('configuration', 'mova.config.json tiene un formato válido.'));
    if (document.migrations.length > 0) {
      checks.push(
        warning(
          'configuration-migrations',
          'mova.config.json necesita migraciones.',
          'Ejecuta mova update para guardarlo con el esquema actual.',
        ),
      );
    }
  } catch (cause) {
    checks.push(
      errorCheck(
        'configuration',
        'mova.config.json no es válido.',
        cause instanceof Error ? cause.message : 'No se pudo leer la configuración.',
      ),
    );
    return { applicationRoot, checks };
  }

  const shellPackage = readOptionalPackage(applicationRoot, runtime);
  checks.push(...checkDependencies(applicationRoot, 'shell', runtime));
  checks.push(checkShellVersion(configuration.shell?.version));
  checks.push(checkCapacitor(shellPackage));

  const catalog = readCatalog(applicationRoot, checks);
  const enabledCapabilities = catalog.filter((capability) =>
    configuration.native?.capabilities.includes(capability.name),
  );
  checks.push(
    ...checkEnabledCapabilityPackages(applicationRoot, shellPackage, enabledCapabilities, runtime),
  );

  const shellCoreVersion = shellPackage?.dependencies?.['@open-mova/core'];
  for (const microfrontend of configuration.microfrontends) {
    if (microfrontend.sourcePath) {
      const microfrontendRoot = resolve(applicationRoot, microfrontend.sourcePath);
      if (!runtime.fileExists(microfrontendRoot)) {
        checks.push(
          errorCheck(
            `microfrontend:${microfrontend.name}:source`,
            `No existe el directorio del MF ${microfrontend.name}.`,
            microfrontendRoot,
          ),
        );
      } else {
        checks.push(...checkDependencies(microfrontendRoot, `MF ${microfrontend.name}`, runtime));
        checks.push(
          checkCoreCompatibility(
            microfrontend.name,
            shellCoreVersion,
            readOptionalPackage(microfrontendRoot, runtime)?.dependencies?.['@open-mova/core'],
          ),
        );
      }
    }
    checks.push(checkProductionRemote(microfrontend, configuration));
  }

  const hasAndroid = runtime.fileExists(join(applicationRoot, 'android'));
  const hasIos = runtime.fileExists(join(applicationRoot, 'ios'));
  checks.push(
    hasAndroid || hasIos
      ? ok(
          'capacitor-platforms',
          `Plataformas añadidas: ${[hasAndroid && 'Android', hasIos && 'iOS'].filter(Boolean).join(', ')}.`,
        )
      : warning('capacitor-platforms', 'No hay plataformas nativas añadidas todavía.'),
  );

  if (options.platform === 'android' || (!options.platform && hasAndroid)) {
    checks.push(
      ...inspectAndroidProject({
        applicationRoot,
        runtime,
        capabilities: enabledCapabilities,
        configuredGoogleMapsKey: configuration.native?.googleMaps?.androidApiKey,
      }),
    );
  }
  if (options.platform === 'ios' || (!options.platform && hasIos)) {
    checks.push(
      ...inspectIosProject({ applicationRoot, runtime, capabilities: enabledCapabilities }),
    );
  }
  return { applicationRoot, checks };
}

function checkNodeVersion(runtime: DoctorRuntime): DoctorCheck {
  const majorVersion = Number(runtime.nodeVersion.split('.')[0]);
  return majorVersion >= 22
    ? ok('node', `Node.js ${runtime.nodeVersion}.`)
    : errorCheck(
        'node',
        `Node.js ${runtime.nodeVersion} no es compatible.`,
        'Instala Node.js 22 o posterior.',
      );
}

function checkCommand(
  runtime: DoctorRuntime,
  command: string,
  args: readonly string[],
  label: string,
  required: boolean,
  id = command,
  shell = false,
): DoctorCheck {
  const result = runtime.command(command, args, shell);
  const available = !result.error && result.status === 0;
  const version = available ? firstLine(result.stdout, result.stderr) : undefined;
  return available
    ? ok(`command:${id}`, `${label}: ${version}.`)
    : required
      ? errorCheck(
          `command:${id}`,
          `${label} no está disponible.`,
          `Instala ${label} y añádelo a PATH.`,
        )
      : warning(`command:${id}`, `${label} no está disponible.`);
}

function checkDependencies(
  directory: string,
  label: string,
  runtime: DoctorRuntime,
): readonly DoctorCheck[] {
  const packagePath = join(directory, 'package.json');
  if (!runtime.fileExists(packagePath)) {
    return [errorCheck(`dependencies:${label}`, `${label} no contiene package.json.`, directory)];
  }
  const lockfilePath = join(directory, 'package-lock.json');
  const checks: DoctorCheck[] = [
    runtime.fileExists(join(directory, 'node_modules'))
      ? ok(`dependencies:${label}`, `${label}: dependencias instaladas.`)
      : warning(
          `dependencies:${label}`,
          `${label}: faltan las dependencias.`,
          `Ejecuta npm install en ${directory}.`,
        ),
    runtime.fileExists(lockfilePath)
      ? checkLockfile(runtime, packagePath, lockfilePath, label)
      : warning(
          `lockfile:${label}`,
          `${label}: falta package-lock.json.`,
          `Ejecuta npm install en ${directory} para generar un lockfile reproducible.`,
        ),
  ];
  return checks;
}

function checkLockfile(
  runtime: DoctorRuntime,
  packagePath: string,
  lockfilePath: string,
  label: string,
): DoctorCheck {
  try {
    const packageDependencies =
      (JSON.parse(runtime.readFile(packagePath)) as PackageConfiguration).dependencies ?? {};
    const lockfile = JSON.parse(runtime.readFile(lockfilePath)) as {
      packages?: Record<string, PackageConfiguration>;
      dependencies?: Readonly<Record<string, unknown>>;
    };
    const lockfileDependencies = lockfile.packages?.['']?.dependencies;
    if (!lockfileDependencies && !lockfile.dependencies) {
      return warning(
        `lockfile:${label}`,
        `${label}: package-lock.json no contiene dependencias verificables.`,
        `Ejecuta npm install en ${label === 'shell' ? 'la aplicación' : label}.`,
      );
    }
    const mismatches = Object.entries(packageDependencies).filter(
      ([name, version]) => lockfileDependencies?.[name] !== version,
    );
    return mismatches.length === 0
      ? ok(`lockfile:${label}`, `${label}: package-lock.json sincronizado.`)
      : errorCheck(
          `lockfile:${label}`,
          `${label}: package-lock.json está desincronizado.`,
          `Ejecuta npm install. Dependencias afectadas: ${mismatches.map(([name]) => name).join(', ')}.`,
        );
  } catch {
    return errorCheck(
      `lockfile:${label}`,
      `${label}: no se puede leer package-lock.json.`,
      'Regenera el lockfile con npm install.',
    );
  }
}

function checkCapacitor(packageConfiguration: PackageConfiguration | undefined): DoctorCheck {
  const version = packageConfiguration?.dependencies?.['@capacitor/core'];
  const major = /^\^?(\d+)/.exec(version ?? '')?.[1];
  if (!version) {
    return errorCheck(
      'capacitor-version',
      'La shell no declara @capacitor/core.',
      'Actualiza la shell a una versión compatible con Capacitor 8.',
    );
  }
  return major === '8'
    ? ok('capacitor-version', `Capacitor ${version} declarado por la shell.`)
    : errorCheck(
        'capacitor-version',
        `Capacitor ${version} no es compatible con el framework actual.`,
        'Usa una shell que dependa de @capacitor/core 8.',
      );
}

function readCatalog(
  applicationRoot: string,
  checks: DoctorCheck[],
): readonly NativeCapabilityDefinition[] {
  try {
    return readNativeCapabilityCatalog(applicationRoot).capabilities;
  } catch (cause) {
    checks.push(
      warning(
        'native-capability-catalog',
        'No se ha podido leer el catálogo de capacidades nativas.',
        cause instanceof Error ? cause.message : undefined,
      ),
    );
    return [];
  }
}

function checkEnabledCapabilityPackages(
  applicationRoot: string,
  packageConfiguration: PackageConfiguration | undefined,
  capabilities: readonly NativeCapabilityDefinition[],
  runtime: DoctorRuntime,
): readonly DoctorCheck[] {
  return capabilities.flatMap((capability) => {
    if (capability.package === '@capacitor/core') return [];
    const declared = packageConfiguration?.dependencies?.[capability.package];
    const installed = runtime.fileExists(
      join(applicationRoot, 'node_modules', ...capability.package.split('/')),
    );
    return declared && installed
      ? [
          ok(
            `capability:${capability.name}:package`,
            `${capability.name}: ${capability.package} ${declared} instalado.`,
          ),
        ]
      : [
          errorCheck(
            `capability:${capability.name}:package`,
            `${capability.name} está habilitada pero falta ${capability.package}.`,
            `Ejecuta mova cap enable ${capability.name} o npm install en ${applicationRoot}.`,
          ),
        ];
  });
}

function checkShellVersion(version: string | undefined): DoctorCheck {
  return version && /^v\d+\.\d+\.\d+$/.test(version)
    ? ok('shell-version', `Shell registrada: ${version}.`)
    : errorCheck(
        'shell-version',
        'La aplicación no tiene una versión estable de shell registrada.',
        'Actualiza mova.config.json mediante mova update.',
      );
}

function checkCoreCompatibility(
  microfrontendName: string,
  shellVersion: string | undefined,
  microfrontendVersion: string | undefined,
): DoctorCheck {
  if (!microfrontendVersion) {
    return warning(
      `microfrontend:${microfrontendName}:core`,
      `El MF ${microfrontendName} no declara @open-mova/core.`,
    );
  }
  if (microfrontendVersion === '*') {
    return warning(
      `microfrontend:${microfrontendName}:core`,
      `El MF ${microfrontendName} necesita concretar su rango de @open-mova/core.`,
      'Ejecuta mova mf update o registra de nuevo el MF con --core-version.',
    );
  }
  if (!shellVersion || !areCoreRangesCompatible(shellVersion, microfrontendVersion)) {
    return errorCheck(
      `microfrontend:${microfrontendName}:core`,
      `El MF ${microfrontendName} y la shell usan rangos distintos de @open-mova/core.`,
      `Shell: ${shellVersion ?? 'no declarado'}; MF: ${microfrontendVersion}.`,
    );
  }
  return ok(
    `microfrontend:${microfrontendName}:core`,
    `El MF ${microfrontendName} comparte ${microfrontendVersion} de @open-mova/core.`,
  );
}

function checkProductionRemote(
  microfrontend: OpenMovaApplicationConfiguration['microfrontends'][number],
  configuration: OpenMovaApplicationConfiguration,
): DoctorCheck {
  const remoteEntry = microfrontend.productionRemoteEntry;
  if (!remoteEntry || !isHttpsUrl(remoteEntry)) {
    return warning(
      `microfrontend:${microfrontend.name}:production`,
      `El MF ${microfrontend.name} no tiene una URL HTTPS de producción válida.`,
      'Configúrala antes de preparar una aplicación nativa o ejecutar mova build --production.',
    );
  }
  if (!isTrustedRemoteOrigin(remoteEntry, configuration)) {
    return errorCheck(
      `microfrontend:${microfrontend.name}:production`,
      `El origen de producción del MF ${microfrontend.name} no es de confianza.`,
      'Añádelo a security.trustedRemoteOrigins antes de generar el artefacto de producción.',
    );
  }
  return ok(
    `microfrontend:${microfrontend.name}:production`,
    `El MF ${microfrontend.name} tiene una URL HTTPS de producción de confianza.`,
  );
}

function readOptionalPackage(
  directory: string,
  runtime: DoctorRuntime,
): PackageConfiguration | undefined {
  const packagePath = join(directory, 'package.json');
  if (!runtime.fileExists(packagePath)) return undefined;
  try {
    return JSON.parse(runtime.readFile(packagePath)) as PackageConfiguration;
  } catch {
    return undefined;
  }
}

function firstLine(stdout: string, stderr: string): string {
  return `${stdout}\n${stderr}`.trim().split(/\r?\n/)[0] || 'versión no disponible';
}

function ok(id: string, message: string): DoctorCheck {
  return { id, status: 'ok', message };
}

function warning(id: string, message: string, detail?: string): DoctorCheck {
  return { id, status: 'warning', message, ...(detail ? { detail } : {}) };
}

function errorCheck(id: string, message: string, detail: string): DoctorCheck {
  return { id, status: 'error', message, detail };
}
