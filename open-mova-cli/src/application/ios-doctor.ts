import { join } from 'node:path';
import type { DoctorCheck } from './doctor.js';
import type { DoctorRuntime } from './doctor-runtime.js';
import type { NativeCapabilityDefinition } from './shell-configuration.js';

interface IosDoctorOptions {
  readonly applicationRoot: string;
  readonly runtime: DoctorRuntime;
  readonly capabilities: readonly NativeCapabilityDefinition[];
}

export function inspectIosProject(options: IosDoctorOptions): readonly DoctorCheck[] {
  const { applicationRoot, runtime } = options;
  const iosRoot = join(applicationRoot, 'ios');

  if (!runtime.fileExists(iosRoot)) {
    return [
      warning(
        'ios-project',
        'No se ha añadido la plataforma iOS.',
        'Ejecuta mova cap add ios desde macOS cuando quieras preparar la aplicación nativa.',
      ),
    ];
  }

  if (runtime.platform !== 'darwin') {
    return [
      error(
        'ios-platform',
        'La compilación y el diagnóstico completo de iOS requieren macOS.',
        'Abre el proyecto desde un equipo macOS con Xcode y CocoaPods instalados.',
      ),
    ];
  }

  const checks: DoctorCheck[] = [];
  checks.push(checkCommand(runtime, 'xcodebuild', ['-version'], 'Xcode', true));
  checks.push(checkCommand(runtime, 'xcode-select', ['-p'], 'Xcode Command Line Tools', true));
  checks.push(checkCommand(runtime, 'pod', ['--version'], 'CocoaPods', true));
  checks.push(...checkPods(runtime, iosRoot));
  checks.push(...checkIosRequirements(options));
  return checks;
}

function checkPods(runtime: DoctorRuntime, iosRoot: string): readonly DoctorCheck[] {
  const podfile = join(iosRoot, 'App', 'Podfile');
  const lockfile = join(iosRoot, 'App', 'Podfile.lock');
  return [
    runtime.fileExists(podfile)
      ? ok('ios-podfile', 'Podfile encontrado.')
      : error(
          'ios-podfile',
          'No se encuentra ios/App/Podfile.',
          'Ejecuta mova cap sync ios para regenerar la configuración de Pods.',
        ),
    runtime.fileExists(lockfile)
      ? ok('ios-pod-lock', 'Podfile.lock encontrado; los Pods fueron resueltos anteriormente.')
      : warning(
          'ios-pod-lock',
          'No se encuentra Podfile.lock; no se puede confirmar la resolución de Pods.',
          'Ejecuta mova cap sync ios o pod install desde ios/App antes de abrir Xcode.',
        ),
  ];
}

function checkIosRequirements(options: IosDoctorOptions): readonly DoctorCheck[] {
  const { applicationRoot, capabilities, runtime } = options;
  const infoPlist = readOptional(runtime, join(applicationRoot, 'ios', 'App', 'App', 'Info.plist'));
  const podfile = readOptional(runtime, join(applicationRoot, 'ios', 'App', 'Podfile'));
  const deploymentTarget = parseDeploymentTarget(podfile);
  // Capacitor 8 requiere como base iOS 15; el catálogo puede elevarlo por capacidad.
  const requiredTarget = maximumVersion([
    '15.0',
    ...capabilities.map((capability) => capability.minimumIosVersion),
  ]);
  const requiredPermissions = [
    ...new Set(capabilities.flatMap((capability) => capability.permissions?.ios ?? [])),
  ];
  const requiredEntitlements = [
    ...new Set(capabilities.flatMap((capability) => capability.entitlements?.ios ?? [])),
  ];
  const entitlements = readEntitlements(applicationRoot, runtime);
  const checks: DoctorCheck[] = [];

  checks.push(
    deploymentTarget
      ? ok('ios-deployment-target', `iOS ${deploymentTarget} configurado como versión mínima.`)
      : warning(
          'ios-deployment-target',
          'No se ha podido detectar la versión mínima de iOS.',
          'Declárala en ios/App/Podfile antes de compilar la aplicación.',
        ),
  );
  if (requiredTarget) {
    checks.push(
      deploymentTarget && compareVersions(deploymentTarget, requiredTarget) >= 0
        ? ok(
            'ios-capability-target',
            `Las capacidades requieren iOS ${requiredTarget}; el proyecto usa ${deploymentTarget}.`,
          )
        : error(
            'ios-capability-target',
            `Las capacidades requieren iOS ${requiredTarget}, pero el proyecto usa ${deploymentTarget ?? 'un valor no detectado'}.`,
            'Actualiza la versión de plataforma en ios/App/Podfile y ejecuta mova cap sync ios.',
          ),
    );
  }

  const missingPermissions = requiredPermissions.filter(
    (permission) => !infoPlist?.includes(`<key>${permission}</key>`),
  );
  checks.push(
    !infoPlist
      ? error(
          'ios-info-plist',
          'No se encuentra ios/App/App/Info.plist.',
          'Ejecuta mova cap sync ios.',
        )
      : missingPermissions.length === 0
        ? ok('ios-info-plist', 'Info.plist contiene los permisos de las capacidades habilitadas.')
        : error(
            'ios-info-plist',
            'Info.plist no contiene todas las descripciones de uso requeridas.',
            `Faltan: ${missingPermissions.join(', ')}. Añádelas sin incluir secretos.`,
          ),
  );

  if (requiredEntitlements.length > 0) {
    const missingEntitlements = requiredEntitlements.filter(
      (entitlement) => !entitlements.includes(`<key>${entitlement}</key>`),
    );
    checks.push(
      missingEntitlements.length === 0
        ? ok('ios-entitlements', 'Los entitlements requeridos están configurados.')
        : error(
            'ios-entitlements',
            'Faltan entitlements requeridos por las capacidades habilitadas.',
            `Faltan: ${missingEntitlements.join(', ')}. Actívalos en Signing & Capabilities de Xcode.`,
          ),
    );
  }

  if (capabilities.some((capability) => capability.name === 'googleMaps')) {
    checks.push(
      warning(
        'ios-google-maps-key',
        'Google Maps requiere una clave configurada en el proyecto iOS.',
        'Compruébala en la configuración nativa de iOS. El diagnóstico no lee ni muestra secretos.',
      ),
    );
  }
  return checks;
}

function readEntitlements(applicationRoot: string, runtime: DoctorRuntime): string {
  const candidates = [
    join(applicationRoot, 'ios', 'App', 'App', 'App.entitlements'),
    join(applicationRoot, 'ios', 'App', 'App.entitlements'),
  ];
  return candidates
    .filter((path) => runtime.fileExists(path))
    .map((path) => runtime.readFile(path))
    .join('\n');
}

function checkCommand(
  runtime: DoctorRuntime,
  command: string,
  args: readonly string[],
  label: string,
  required: boolean,
): DoctorCheck {
  const result = runtime.command(command, args);
  if (!result.error && result.status === 0) {
    const version =
      `${result.stdout}\n${result.stderr}`.trim().split(/\r?\n/)[0] || 'versión no disponible';
    return ok(`ios-command:${command}`, `${label}: ${version}.`);
  }
  return required
    ? error(
        `ios-command:${command}`,
        `${label} no está disponible.`,
        `Instala ${label} y vuelve a ejecutar mova doctor ios.`,
      )
    : warning(`ios-command:${command}`, `${label} no está disponible.`);
}

function parseDeploymentTarget(podfile: string | undefined): string | undefined {
  return /platform\s*:ios\s*,\s*['"]([\d.]+)['"]/.exec(podfile ?? '')?.[1];
}

function maximumVersion(versions: readonly (string | undefined)[]): string | undefined {
  return versions
    .filter((version): version is string => Boolean(version))
    .sort(compareVersions)
    .at(-1);
}

function compareVersions(first: string, second: string): number {
  const firstParts = first.split('.').map(Number);
  const secondParts = second.split('.').map(Number);
  return Math.max(firstParts.length, secondParts.length)
    ? (firstParts[0] ?? 0) - (secondParts[0] ?? 0) || (firstParts[1] ?? 0) - (secondParts[1] ?? 0)
    : 0;
}

function readOptional(runtime: DoctorRuntime, path: string): string | undefined {
  return runtime.fileExists(path) ? runtime.readFile(path) : undefined;
}

function ok(id: string, message: string): DoctorCheck {
  return { id, status: 'ok', message };
}

function warning(id: string, message: string, detail?: string): DoctorCheck {
  return { id, status: 'warning', message, ...(detail ? { detail } : {}) };
}

function error(id: string, message: string, detail: string): DoctorCheck {
  return { id, status: 'error', message, detail };
}
