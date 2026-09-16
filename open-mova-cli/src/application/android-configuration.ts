import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OpenMovaApplicationConfiguration } from '../types.js';

interface PackageConfiguration {
  readonly dependencies?: Readonly<Record<string, string>>;
}

export function configureAndroidProject(
  applicationRoot: string,
  configuration: OpenMovaApplicationConfiguration,
): void {
  const packageConfiguration = readPackageConfiguration(applicationRoot);

  configureMinimumSdk(applicationRoot, packageConfiguration);
  configureBackgroundRunner(applicationRoot, packageConfiguration);
  configureGoogleMaps(applicationRoot, configuration, packageConfiguration);
}

function configureGoogleMaps(
  applicationRoot: string,
  configuration: OpenMovaApplicationConfiguration,
  packageConfiguration: PackageConfiguration,
): void {
  if (!packageConfiguration.dependencies?.['@capacitor/google-maps']) return;

  const manifestPath = join(
    applicationRoot,
    'android',
    'app',
    'src',
    'main',
    'AndroidManifest.xml',
  );
  if (!existsSync(manifestPath)) {
    throw new Error('No se encuentra AndroidManifest.xml para configurar Google Maps.');
  }

  const manifest = readFileSync(manifestPath, 'utf8');
  const apiKeyMetadata = 'android:name="com.google.android.geo.API_KEY"';
  if (!manifest.includes(apiKeyMetadata)) {
    const applicationCloseTag = '</application>';
    if (!manifest.includes(applicationCloseTag)) {
      throw new Error('No se ha encontrado el elemento application en AndroidManifest.xml.');
    }

    const metadata = [
      '        <meta-data',
      `            ${apiKeyMetadata}`,
      '            android:value="@string/open_mova_google_maps_api_key" />',
    ].join('\n');
    writeFileSync(
      manifestPath,
      manifest.replace(applicationCloseTag, `${metadata}\n    ${applicationCloseTag}`),
      'utf8',
    );
  }

  const valuesDirectory = join(applicationRoot, 'android', 'app', 'src', 'main', 'res', 'values');
  mkdirSync(valuesDirectory, { recursive: true });

  const apiKey =
    process.env['OPEN_MOVA_GOOGLE_MAPS_ANDROID_API_KEY'] ??
    configuration.native?.googleMaps?.androidApiKey ??
    // Google Maps aborta la aplicación si falta por completo esta entrada.
    'OPEN_MOVA_GOOGLE_MAPS_API_KEY_NOT_CONFIGURED';
  const resource = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<resources>',
    `    <string name="open_mova_google_maps_api_key" translatable="false">${escapeXml(apiKey)}</string>`,
    '</resources>',
    '',
  ].join('\n');
  writeFileSync(join(valuesDirectory, 'open_mova_google_maps.xml'), resource, 'utf8');
}

function configureMinimumSdk(
  applicationRoot: string,
  packageConfiguration: PackageConfiguration,
): void {
  if (!packageConfiguration.dependencies?.['@capacitor/local-llm']) return;

  const variablesPath = join(applicationRoot, 'android', 'variables.gradle');
  if (!existsSync(variablesPath)) {
    throw new Error('No se encuentra android/variables.gradle para configurar Local LLM.');
  }

  const variables = readFileSync(variablesPath, 'utf8');
  const minimumSdkPattern = /minSdkVersion\s*=\s*(\d+)/;
  const currentMinimumSdk = Number(minimumSdkPattern.exec(variables)?.[1]);

  if (!Number.isFinite(currentMinimumSdk)) {
    throw new Error('No se ha encontrado minSdkVersion en android/variables.gradle.');
  }
  if (currentMinimumSdk >= 28) return;

  writeFileSync(variablesPath, variables.replace(minimumSdkPattern, 'minSdkVersion = 28'), 'utf8');
}

function configureBackgroundRunner(
  applicationRoot: string,
  packageConfiguration: PackageConfiguration,
): void {
  if (!packageConfiguration.dependencies?.['@capacitor/background-runner']) return;

  const gradlePath = join(applicationRoot, 'android', 'app', 'build.gradle');
  if (!existsSync(gradlePath)) {
    throw new Error('No se encuentra android/app/build.gradle para configurar Background Runner.');
  }

  const repositoryEntry =
    "dirs '../../node_modules/@capacitor/background-runner/android/src/main/libs', 'libs'";
  const gradle = readFileSync(gradlePath, 'utf8');
  if (gradle.includes(repositoryEntry)) return;

  const flatDirectory = /flatDir\s*\{/;
  if (!flatDirectory.test(gradle)) {
    throw new Error('No se ha encontrado el bloque flatDir en android/app/build.gradle.');
  }

  writeFileSync(
    gradlePath,
    gradle.replace(flatDirectory, (match) => `${match}\n        ${repositoryEntry}`),
    'utf8',
  );
}

function readPackageConfiguration(applicationRoot: string): PackageConfiguration {
  return JSON.parse(
    readFileSync(join(applicationRoot, 'package.json'), 'utf8'),
  ) as PackageConfiguration;
}

function escapeXml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[character] ?? character,
  );
}
