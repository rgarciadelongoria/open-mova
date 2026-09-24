import { join } from 'node:path';
import type { DoctorCheck } from './doctor.js';
import type { DoctorRuntime } from './doctor-runtime.js';
import type { NativeCapabilityDefinition } from './shell-configuration.js';

interface AndroidDoctorOptions {
  readonly applicationRoot: string;
  readonly runtime: DoctorRuntime;
  readonly capabilities: readonly NativeCapabilityDefinition[];
  readonly configuredGoogleMapsKey?: string;
}

export function inspectAndroidProject(options: AndroidDoctorOptions): readonly DoctorCheck[] {
  const { applicationRoot, runtime } = options;
  const androidRoot = join(applicationRoot, 'android');

  if (!runtime.fileExists(androidRoot)) {
    return [
      warning(
        'android-project',
        'No se ha añadido la plataforma Android.',
        'Ejecuta mova cap add android cuando quieras preparar la aplicación nativa.',
      ),
    ];
  }

  const checks: DoctorCheck[] = [];
  checks.push(checkAndroidStudio(runtime));
  const sdkRoot = runtime.environment['ANDROID_SDK_ROOT'] ?? runtime.environment['ANDROID_HOME'];
  checks.push(checkAndroidSdk(runtime, sdkRoot));
  checks.push(checkCommand(runtime, 'adb', ['version'], 'Android Platform Tools (adb)', true));
  checks.push(checkJava(runtime));

  const variables = readOptional(runtime, join(androidRoot, 'variables.gradle'));
  const projectSdk = parseAndroidSdkVersions(variables);
  checks.push(...checkAndroidProjectSdk(runtime, sdkRoot, projectSdk));
  checks.push(...checkGradle(androidRoot, runtime));
  checks.push(...checkCapabilityRequirements(options, projectSdk.minimum));
  checks.push(checkBackgroundRunnerRepository(runtime, androidRoot, options.capabilities));
  checks.push(checkGoogleMapsKey(options, runtime));
  return checks;
}

function checkAndroidStudio(runtime: DoctorRuntime): DoctorCheck {
  const configuredPath = runtime.environment['ANDROID_STUDIO_PATH'];
  if (configuredPath && runtime.fileExists(configuredPath)) {
    return ok('android-studio', 'Android Studio detectado mediante ANDROID_STUDIO_PATH.');
  }

  const result = runtime.command('studio', ['--version']);
  if (!result.error && result.status === 0) {
    return ok('android-studio', `Android Studio: ${firstLine(result)}.`);
  }

  return warning(
    'android-studio',
    'No se ha podido detectar Android Studio.',
    'Instálalo o define ANDROID_STUDIO_PATH. El lanzador "studio" no suele estar en PATH.',
  );
}

function checkAndroidSdk(runtime: DoctorRuntime, sdkRoot: string | undefined): DoctorCheck {
  return sdkRoot && runtime.fileExists(sdkRoot)
    ? ok('android-sdk', `Android SDK: ${sdkRoot}.`)
    : error(
        'android-sdk',
        'No se ha detectado Android SDK.',
        'Instala el Android SDK y define ANDROID_SDK_ROOT (o ANDROID_HOME).',
      );
}

function checkJava(runtime: DoctorRuntime): DoctorCheck {
  const result = runtime.command('java', ['-version']);
  const version = parseJavaVersion(`${result.stdout}\n${result.stderr}`);
  if (result.error || result.status !== 0 || !version) {
    return error(
      'android-jdk',
      'No se ha detectado un JDK compatible.',
      'Instala JDK 17 o posterior y añádelo a PATH.',
    );
  }
  if (version < 17) {
    return error(
      'android-jdk',
      `JDK ${version} no es compatible con Android Gradle Plugin actual.`,
      'Instala JDK 17 o posterior y configura JAVA_HOME.',
    );
  }
  return ok('android-jdk', `JDK ${version} detectado (requisito: 17 o posterior).`);
}

function checkAndroidProjectSdk(
  runtime: DoctorRuntime,
  sdkRoot: string | undefined,
  versions: AndroidSdkVersions,
): readonly DoctorCheck[] {
  const checks: DoctorCheck[] = [];
  checks.push(
    versions.compile
      ? ok('android-compile-sdk', `compileSdk ${versions.compile} configurado.`)
      : warning(
          'android-compile-sdk',
          'No se ha podido leer compileSdkVersion.',
          'Revísalo en android/variables.gradle.',
        ),
  );
  checks.push(
    versions.target
      ? ok('android-target-sdk', `targetSdk ${versions.target} configurado.`)
      : warning(
          'android-target-sdk',
          'No se ha podido leer targetSdkVersion.',
          'Revísalo en android/variables.gradle.',
        ),
  );
  checks.push(
    versions.minimum
      ? ok('android-min-sdk', `minSdk ${versions.minimum} configurado.`)
      : warning(
          'android-min-sdk',
          'No se ha podido leer minSdkVersion.',
          'Revísalo en android/variables.gradle.',
        ),
  );

  if (!sdkRoot || !runtime.fileExists(sdkRoot)) return checks;
  if (versions.compile) {
    const platformPath = join(sdkRoot, 'platforms', `android-${versions.compile}`);
    checks.push(
      runtime.fileExists(platformPath)
        ? ok('android-sdk-platform', `Está instalada la plataforma Android ${versions.compile}.`)
        : error(
            'android-sdk-platform',
            `No está instalada la plataforma Android ${versions.compile}.`,
            `Instálala desde SDK Manager: Android API ${versions.compile}.`,
          ),
    );
  }
  if (versions.buildTools) {
    const buildToolsPath = join(sdkRoot, 'build-tools', versions.buildTools);
    checks.push(
      runtime.fileExists(buildToolsPath)
        ? ok('android-build-tools', `Build Tools ${versions.buildTools} instaladas.`)
        : error(
            'android-build-tools',
            `No están instaladas Build Tools ${versions.buildTools}.`,
            `Instálalas desde SDK Manager: Android SDK Build-Tools ${versions.buildTools}.`,
          ),
    );
  }
  return checks;
}

function checkGradle(androidRoot: string, runtime: DoctorRuntime): readonly DoctorCheck[] {
  const wrapper = readOptional(
    runtime,
    join(androidRoot, 'gradle', 'wrapper', 'gradle-wrapper.properties'),
  );
  const gradleVersion = /gradle-([\d.]+)-(?:bin|all)\.zip/.exec(wrapper ?? '')?.[1];
  const buildFiles = [
    'build.gradle',
    'build.gradle.kts',
    'app/build.gradle',
    'app/build.gradle.kts',
  ]
    .map((path) => readOptional(runtime, join(androidRoot, path)) ?? '')
    .join('\n');
  const agpVersion =
    /com\.android\.tools\.build:gradle:([\d.]+)/.exec(buildFiles)?.[1] ??
    /id\(['"]com\.android\.application['"]\)\s+version\s+['"]([\d.]+)['"]/.exec(buildFiles)?.[1];

  const checks: DoctorCheck[] = [
    gradleVersion
      ? ok('android-gradle', `Gradle ${gradleVersion} configurado mediante Gradle Wrapper.`)
      : warning(
          'android-gradle',
          'No se ha podido detectar la versión de Gradle Wrapper.',
          'Comprueba android/gradle/wrapper/gradle-wrapper.properties.',
        ),
    agpVersion
      ? ok('android-gradle-plugin', `Android Gradle Plugin ${agpVersion} configurado.`)
      : warning(
          'android-gradle-plugin',
          'No se ha podido detectar Android Gradle Plugin.',
          'Comprueba android/build.gradle o android/build.gradle.kts.',
        ),
  ];

  if (gradleVersion && Number(gradleVersion.split('.')[0]) < 8) {
    checks.push(
      error(
        'android-gradle-compatibility',
        `Gradle ${gradleVersion} no es compatible con la shell actual.`,
        'Actualiza Gradle Wrapper a la serie 8 o posterior.',
      ),
    );
  }
  if (agpVersion && Number(agpVersion.split('.')[0]) < 8) {
    checks.push(
      error(
        'android-gradle-plugin-compatibility',
        `Android Gradle Plugin ${agpVersion} no es compatible con la shell actual.`,
        'Actualiza Android Gradle Plugin a la serie 8 o posterior.',
      ),
    );
  }
  return checks;
}

function checkCapabilityRequirements(
  options: AndroidDoctorOptions,
  configuredMinimumSdk: number | undefined,
): readonly DoctorCheck[] {
  const { applicationRoot, capabilities, runtime } = options;
  const requiredMinimumSdk = Math.max(
    0,
    ...capabilities.map((capability) => capability.minimumAndroidSdk ?? 0),
  );
  const requiredPermissions = [
    ...new Set(capabilities.flatMap((capability) => capability.permissions?.android ?? [])),
  ];
  const manifest = readOptional(
    runtime,
    join(applicationRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
  );
  const checks: DoctorCheck[] = [];

  if (requiredMinimumSdk > 0) {
    checks.push(
      configuredMinimumSdk && configuredMinimumSdk >= requiredMinimumSdk
        ? ok(
            'android-capability-min-sdk',
            `Las capacidades requieren minSdk ${requiredMinimumSdk}; el proyecto usa ${configuredMinimumSdk}.`,
          )
        : error(
            'android-capability-min-sdk',
            `Las capacidades requieren minSdk ${requiredMinimumSdk}, pero el proyecto usa ${configuredMinimumSdk ?? 'un valor no detectado'}.`,
            'Ejecuta mova cap sync android o actualiza android/variables.gradle.',
          ),
    );
  }

  const missingPermissions = requiredPermissions.filter(
    (permission) => !manifest?.includes(`android:name="${permission}"`),
  );
  checks.push(
    !manifest
      ? error(
          'android-permissions',
          'No se encuentra AndroidManifest.xml.',
          'Ejecuta mova cap sync android.',
        )
      : missingPermissions.length === 0
        ? ok(
            'android-permissions',
            'AndroidManifest.xml contiene los permisos de las capacidades habilitadas.',
          )
        : error(
            'android-permissions',
            'AndroidManifest.xml no contiene todos los permisos requeridos.',
            `Faltan: ${missingPermissions.join(', ')}. Ejecuta mova cap sync android.`,
          ),
  );
  return checks;
}

function checkBackgroundRunnerRepository(
  runtime: DoctorRuntime,
  androidRoot: string,
  capabilities: readonly NativeCapabilityDefinition[],
): DoctorCheck {
  if (!capabilities.some((capability) => capability.name === 'backgroundRunner')) {
    return ok('android-background-runner', 'Background Runner no está habilitado.');
  }
  const gradle = readOptional(runtime, join(androidRoot, 'app', 'build.gradle')) ?? '';
  const repository = '@capacitor/background-runner/android/src/main/libs';
  return gradle.includes(repository)
    ? ok(
        'android-background-runner',
        'Background Runner tiene configurado su repositorio de artefactos.',
      )
    : error(
        'android-background-runner',
        'Background Runner no tiene configurado su repositorio de artefactos.',
        'Ejecuta mova cap sync android para añadir el repositorio local requerido.',
      );
}

function checkGoogleMapsKey(options: AndroidDoctorOptions, runtime: DoctorRuntime): DoctorCheck {
  if (!options.capabilities.some((capability) => capability.name === 'googleMaps')) {
    return ok('android-google-maps-key', 'Google Maps no está habilitado.');
  }
  const resource = readOptional(
    runtime,
    join(
      options.applicationRoot,
      'android',
      'app',
      'src',
      'main',
      'res',
      'values',
      'open_mova_google_maps.xml',
    ),
  );
  const configured = Boolean(
    runtime.environment['OPEN_MOVA_GOOGLE_MAPS_ANDROID_API_KEY'] ||
    options.configuredGoogleMapsKey ||
    (resource && !resource.includes('OPEN_MOVA_GOOGLE_MAPS_API_KEY_NOT_CONFIGURED')),
  );
  return configured
    ? ok('android-google-maps-key', 'Google Maps tiene una clave Android configurada.')
    : error(
        'android-google-maps-key',
        'Google Maps no tiene una clave Android configurada.',
        'Define OPEN_MOVA_GOOGLE_MAPS_ANDROID_API_KEY o native.googleMaps.androidApiKey. El valor nunca se muestra.',
      );
}

function checkCommand(
  runtime: DoctorRuntime,
  command: string,
  args: readonly string[],
  label: string,
  required: boolean,
): DoctorCheck {
  const result = runtime.command(command, args);
  return !result.error && result.status === 0
    ? ok(`android-command:${command}`, `${label}: ${firstLine(result)}.`)
    : required
      ? error(
          `android-command:${command}`,
          `${label} no está disponible.`,
          `Instala ${label} y añádelo a PATH.`,
        )
      : warning(`android-command:${command}`, `${label} no está disponible.`);
}

interface AndroidSdkVersions {
  readonly minimum?: number;
  readonly target?: number;
  readonly compile?: number;
  readonly buildTools?: string;
}

function parseAndroidSdkVersions(variables: string | undefined): AndroidSdkVersions {
  if (!variables) return {};
  const numberFor = (name: string): number | undefined => {
    const value = new RegExp(`${name}\\s*=\\s*(\\d+)`).exec(variables)?.[1];
    return value ? Number(value) : undefined;
  };
  return {
    minimum: numberFor('minSdkVersion'),
    target: numberFor('targetSdkVersion'),
    compile: numberFor('compileSdkVersion'),
    buildTools: /buildToolsVersion\s*=\s*['"]([^'"]+)['"]/.exec(variables)?.[1],
  };
}

function parseJavaVersion(output: string): number | undefined {
  const match = /(?:version\s+")?(\d+)(?:\.\d+)?/.exec(output);
  return match ? Number(match[1]) : undefined;
}

function firstLine(result: { readonly stdout: string; readonly stderr: string }): string {
  return `${result.stdout}\n${result.stderr}`.trim().split(/\r?\n/)[0] || 'versión no disponible';
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
