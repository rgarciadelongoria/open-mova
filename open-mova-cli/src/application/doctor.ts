import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { findApplicationRoot, readApplicationConfigurationDocument } from './configuration.js';
import { npmCommand, useCommandShell } from '../utils/platform.js';
import { areCoreRangesCompatible } from './core-compatibility.js';
import { isHttpsUrl, isTrustedRemoteOrigin } from './remote-security.js';
import type { OpenMovaApplicationConfiguration } from '../types.js';

export type DoctorCheckStatus = 'ok' | 'warning' | 'error';

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

interface PackageConfiguration {
  readonly dependencies?: Readonly<Record<string, string>>;
}

export function inspectDevelopmentEnvironment(startDirectory: string): DoctorReport {
  const checks: DoctorCheck[] = [];
  const applicationRoot = findApplicationRoot(resolve(startDirectory));

  checks.push(checkNodeVersion());
  checks.push(checkCommand(npmCommand(), ['--version'], 'npm', true, 'npm', useCommandShell()));
  checks.push(checkCommand('git', ['--version'], 'Git', true));

  if (!applicationRoot) {
    checks.push({
      id: 'application',
      status: 'warning',
      message: 'No se ha encontrado una aplicación Open Mova.',
      detail: 'Ejecuta el comando dentro de un directorio que contenga mova.config.json.',
    });
    return { checks };
  }

  checks.push({
    id: 'application',
    status: 'ok',
    message: `Aplicación encontrada en ${applicationRoot}.`,
  });

  let configuration;
  try {
    const document = readApplicationConfigurationDocument(applicationRoot);
    configuration = document.configuration;
    checks.push({
      id: 'configuration',
      status: 'ok',
      message: 'mova.config.json tiene un formato válido.',
    });
    if (document.migrations.length > 0) {
      checks.push({
        id: 'configuration-migrations',
        status: 'warning',
        message: 'mova.config.json necesita migraciones.',
        detail: 'Ejecuta mova update para guardarlo con el esquema actual.',
      });
    }
  } catch (error) {
    checks.push({
      id: 'configuration',
      status: 'error',
      message: 'mova.config.json no es válido.',
      detail: error instanceof Error ? error.message : undefined,
    });
    return { applicationRoot, checks };
  }

  checks.push(checkDependencies(applicationRoot, 'shell'));
  checks.push(checkShellVersion(configuration.shell?.version));

  const shellPackage = readOptionalPackage(applicationRoot);
  const shellCoreVersion = shellPackage?.dependencies?.['@open-mova/core'];

  for (const microfrontend of configuration.microfrontends) {
    if (microfrontend.sourcePath) {
      const microfrontendRoot = resolve(applicationRoot, microfrontend.sourcePath);
      if (!existsSync(microfrontendRoot)) {
        checks.push({
          id: `microfrontend:${microfrontend.name}:source`,
          status: 'error',
          message: `No existe el directorio del MF ${microfrontend.name}.`,
          detail: microfrontendRoot,
        });
      } else {
        checks.push(checkDependencies(microfrontendRoot, `MF ${microfrontend.name}`));
        checks.push(
          checkCoreCompatibility(
            microfrontend.name,
            shellCoreVersion,
            readOptionalPackage(microfrontendRoot)?.dependencies?.['@open-mova/core'],
          ),
        );
      }
    }

    checks.push(checkProductionRemote(microfrontend, configuration));
  }

  const hasAndroid = existsSync(join(applicationRoot, 'android'));
  const hasIos = existsSync(join(applicationRoot, 'ios'));
  checks.push({
    id: 'capacitor-platforms',
    status: hasAndroid || hasIos ? 'ok' : 'warning',
    message:
      hasAndroid || hasIos
        ? `Plataformas añadidas: ${[hasAndroid && 'Android', hasIos && 'iOS'].filter(Boolean).join(', ')}.`
        : 'No hay plataformas nativas añadidas todavía.',
  });

  if (hasAndroid) {
    checks.push(checkAndroidSdk());
    checks.push(checkCommand('adb', ['version'], 'Android Platform Tools (adb)', true));
    checks.push(checkAndroidEmulators());
    checks.push(
      checkGoogleMapsKey(applicationRoot, configuration.native?.googleMaps?.androidApiKey),
    );
  }

  if (hasIos) {
    if (process.platform !== 'darwin') {
      checks.push({
        id: 'ios-platform',
        status: 'error',
        message: 'La compilación de iOS requiere macOS.',
      });
    } else {
      checks.push(checkCommand('xcodebuild', ['-version'], 'Xcode', true));
      checks.push(checkCommand('pod', ['--version'], 'CocoaPods', false));
    }
    checks.push(...checkIosUsageDescriptions(applicationRoot, shellPackage));
  }

  return { applicationRoot, checks };
}

function checkNodeVersion(): DoctorCheck {
  const majorVersion = Number(process.versions.node.split('.')[0]);
  return majorVersion >= 22
    ? { id: 'node', status: 'ok', message: `Node.js ${process.versions.node}.` }
    : {
        id: 'node',
        status: 'error',
        message: `Node.js ${process.versions.node} no es compatible.`,
        detail: 'Instala Node.js 22 o posterior.',
      };
}

function checkCommand(
  command: string,
  args: readonly string[],
  label: string,
  required: boolean,
  id = command,
  shell = false,
): DoctorCheck {
  // npm is a .cmd script on Windows and needs cmd.exe to execute it reliably.
  const result = spawnSync(command, [...args], { encoding: 'utf8', shell });
  const available = !result.error && result.status === 0;
  const version = available ? (result.stdout || result.stderr).trim().split(/\r?\n/)[0] : undefined;

  return {
    id: `command:${id}`,
    status: available ? 'ok' : required ? 'error' : 'warning',
    message: available ? `${label}: ${version}.` : `${label} no está disponible.`,
  };
}

function checkDependencies(directory: string, label: string): DoctorCheck {
  const packagePath = join(directory, 'package.json');
  if (!existsSync(packagePath)) {
    return {
      id: `dependencies:${label}`,
      status: 'error',
      message: `${label} no contiene package.json.`,
    };
  }

  return existsSync(join(directory, 'node_modules'))
    ? {
        id: `dependencies:${label}`,
        status: 'ok',
        message: `${label}: dependencias instaladas.`,
      }
    : {
        id: `dependencies:${label}`,
        status: 'warning',
        message: `${label}: faltan las dependencias.`,
        detail: `Ejecuta npm install en ${directory}.`,
      };
}

function checkShellVersion(version: string | undefined): DoctorCheck {
  return version && /^v\d+\.\d+\.\d+$/.test(version)
    ? { id: 'shell-version', status: 'ok', message: `Shell registrada: ${version}.` }
    : {
        id: 'shell-version',
        status: 'error',
        message: 'La aplicación no tiene una versión estable de shell registrada.',
      };
}

function checkCoreCompatibility(
  microfrontendName: string,
  shellVersion: string | undefined,
  microfrontendVersion: string | undefined,
): DoctorCheck {
  if (!microfrontendVersion) {
    return {
      id: `microfrontend:${microfrontendName}:core`,
      status: 'warning',
      message: `El MF ${microfrontendName} no declara @open-mova/core.`,
    };
  }
  if (microfrontendVersion === '*') {
    return {
      id: `microfrontend:${microfrontendName}:core`,
      status: 'warning',
      message: `El MF ${microfrontendName} necesita concretar su rango de @open-mova/core.`,
      detail: 'Ejecuta mova mf update o registra de nuevo el MF con --core-version.',
    };
  }
  if (!shellVersion || !areCoreRangesCompatible(shellVersion, microfrontendVersion)) {
    return {
      id: `microfrontend:${microfrontendName}:core`,
      status: 'error',
      message: `El MF ${microfrontendName} y la shell usan rangos distintos de @open-mova/core.`,
      detail: `Shell: ${shellVersion ?? 'no declarado'}; MF: ${microfrontendVersion}.`,
    };
  }
  return {
    id: `microfrontend:${microfrontendName}:core`,
    status: 'ok',
    message: `El MF ${microfrontendName} comparte ${microfrontendVersion} de @open-mova/core.`,
  };
}

function checkProductionRemote(
  microfrontend: OpenMovaApplicationConfiguration['microfrontends'][number],
  configuration: OpenMovaApplicationConfiguration,
): DoctorCheck {
  const remoteEntry = microfrontend.productionRemoteEntry;

  if (!remoteEntry || !isHttpsUrl(remoteEntry)) {
    return {
      id: `microfrontend:${microfrontend.name}:production`,
      status: 'warning',
      message: `El MF ${microfrontend.name} no tiene una URL HTTPS de producción válida.`,
    };
  }

  if (!isTrustedRemoteOrigin(remoteEntry, configuration)) {
    return {
      id: `microfrontend:${microfrontend.name}:production`,
      status: 'error',
      message: `El origen de producción del MF ${microfrontend.name} no es de confianza.`,
      detail:
        'Añádelo a security.trustedRemoteOrigins antes de generar el artefacto de producción.',
    };
  }

  return {
    id: `microfrontend:${microfrontend.name}:production`,
    status: 'ok',
    message: `El MF ${microfrontend.name} tiene una URL HTTPS de producción de confianza.`,
  };
}

function checkAndroidSdk(): DoctorCheck {
  const sdkRoot = process.env['ANDROID_SDK_ROOT'] ?? process.env['ANDROID_HOME'];
  return sdkRoot && existsSync(sdkRoot)
    ? { id: 'android-sdk', status: 'ok', message: `Android SDK: ${sdkRoot}.` }
    : {
        id: 'android-sdk',
        status: 'warning',
        message: 'No se ha detectado ANDROID_SDK_ROOT ni ANDROID_HOME.',
      };
}

function checkAndroidEmulators(): DoctorCheck {
  const result = spawnSync('emulator', ['-list-avds'], { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    return {
      id: 'android-emulators',
      status: 'warning',
      message: 'No se ha podido consultar el listado de emuladores Android.',
    };
  }
  const emulators = result.stdout.split(/\r?\n/).filter(Boolean);
  return emulators.length > 0
    ? {
        id: 'android-emulators',
        status: 'ok',
        message: `Emuladores Android disponibles: ${emulators.length}.`,
      }
    : {
        id: 'android-emulators',
        status: 'warning',
        message: 'No hay emuladores Android configurados.',
      };
}

function checkGoogleMapsKey(
  applicationRoot: string,
  configuredKey: string | undefined,
): DoctorCheck {
  const resourcePath = join(
    applicationRoot,
    'android',
    'app',
    'src',
    'main',
    'res',
    'values',
    'open_mova_google_maps.xml',
  );
  const resource = existsSync(resourcePath) ? readFileSync(resourcePath, 'utf8') : '';
  const hasKey = Boolean(
    process.env['OPEN_MOVA_GOOGLE_MAPS_ANDROID_API_KEY'] ||
    configuredKey ||
    (resource && !resource.includes('OPEN_MOVA_GOOGLE_MAPS_API_KEY_NOT_CONFIGURED')),
  );

  return hasKey
    ? { id: 'google-maps-key', status: 'ok', message: 'Google Maps tiene una clave configurada.' }
    : {
        id: 'google-maps-key',
        status: 'warning',
        message: 'Google Maps no tiene una clave Android configurada.',
      };
}

function checkIosUsageDescriptions(
  applicationRoot: string,
  packageConfiguration: PackageConfiguration | undefined,
): DoctorCheck[] {
  const plistPath = join(applicationRoot, 'ios', 'App', 'App', 'Info.plist');
  if (!existsSync(plistPath)) {
    return [
      {
        id: 'ios-info-plist',
        status: 'error',
        message: 'No se encuentra ios/App/App/Info.plist.',
      },
    ];
  }

  const plist = readFileSync(plistPath, 'utf8');
  const requiredKeys: string[] = [];
  if (packageConfiguration?.dependencies?.['@capacitor/camera']) {
    requiredKeys.push(
      'NSCameraUsageDescription',
      'NSPhotoLibraryUsageDescription',
      'NSPhotoLibraryAddUsageDescription',
    );
  }
  if (packageConfiguration?.dependencies?.['@capacitor/geolocation']) {
    requiredKeys.push('NSLocationWhenInUseUsageDescription');
  }

  const missingKeys = requiredKeys.filter((key) => !plist.includes(`<key>${key}</key>`));
  return missingKeys.length === 0
    ? [
        {
          id: 'ios-info-plist',
          status: 'ok',
          message: 'Info.plist contiene los permisos básicos requeridos.',
        },
      ]
    : [
        {
          id: 'ios-info-plist',
          status: 'warning',
          message: 'Info.plist no contiene todas las descripciones de uso necesarias.',
          detail: `Faltan: ${missingKeys.join(', ')}.`,
        },
      ];
}

function readOptionalPackage(directory: string): PackageConfiguration | undefined {
  const packagePath = join(directory, 'package.json');
  if (!existsSync(packagePath)) return undefined;

  try {
    return JSON.parse(readFileSync(packagePath, 'utf8')) as PackageConfiguration;
  } catch {
    return undefined;
  }
}
