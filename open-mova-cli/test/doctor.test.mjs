import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { inspectDevelopmentEnvironment } from '../dist/application/doctor.js';

test('diagnostica dependencias, Core y remotos de una aplicación', (context) => {
  const root = mkdtempSync(join(tmpdir(), 'open-mova-doctor-test-'));
  context.after(() => rmSync(root, { recursive: true, force: true }));

  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      dependencies: { '@open-mova/core': '^0.2.2' },
    }),
  );
  writeFileSync(
    join(root, 'mova.config.json'),
    JSON.stringify({
      schemaVersion: 1,
      name: 'demo-app',
      shell: {
        repository: 'https://example.com/open-mova.git',
        version: 'v0.2.1',
        commit: '0123456789abcdef',
      },
      microfrontends: [
        {
          name: 'home',
          route: 'home',
          remoteName: 'home-microfrontend',
          exposedModule: './Routes',
          developmentRemoteEntry: 'http://localhost:4300/remoteEntry.json',
          productionRemoteEntry: 'https://cdn.example.com/home/remoteEntry.json',
          sourcePath: 'mfs/home',
        },
      ],
    }),
  );
  mkdirSync(join(root, 'node_modules'));
  mkdirSync(join(root, 'mfs', 'home', 'node_modules'), { recursive: true });
  writeFileSync(
    join(root, 'mfs', 'home', 'package.json'),
    JSON.stringify({
      dependencies: { '@open-mova/core': '^0.2.2' },
    }),
  );

  const report = inspectDevelopmentEnvironment(root);
  const checks = new Map(report.checks.map((check) => [check.id, check]));

  assert.equal(checks.get('application')?.status, 'ok');
  assert.equal(checks.get('configuration')?.status, 'ok');
  assert.equal(checks.get('dependencies:shell')?.status, 'ok');
  assert.equal(checks.get('microfrontend:home:core')?.status, 'ok');
  assert.equal(checks.get('microfrontend:home:production')?.status, 'ok');
});

test('cruza los requisitos Android del catálogo con SDK, JDK, permisos y Gradle', (context) => {
  const root = createNativeApplication(context, ['camera', 'backgroundRunner', 'localLlm']);
  write(
    root,
    'native-capabilities.catalog.json',
    JSON.stringify({
      schemaVersion: 1,
      capabilities: [
        {
          name: 'camera',
          package: '@capacitor/camera',
          platforms: ['android', 'ios'],
          permissions: {
            android: ['android.permission.CAMERA'],
            ios: ['NSCameraUsageDescription'],
          },
        },
        {
          name: 'backgroundRunner',
          package: '@capacitor/background-runner',
          platforms: ['android', 'ios'],
        },
        {
          name: 'localLlm',
          package: '@capacitor/local-llm',
          platforms: ['android'],
          minimumAndroidSdk: 28,
        },
      ],
    }),
  );
  mkdir(root, 'android/app/src/main/res/values');
  mkdir(root, 'android/gradle/wrapper');
  mkdir(root, 'sdk/platforms/android-35');
  mkdir(root, 'sdk/build-tools/35.0.0');
  write(
    root,
    'android/variables.gradle',
    [
      'ext {',
      '  minSdkVersion = 24',
      '  targetSdkVersion = 35',
      '  compileSdkVersion = 35',
      "  buildToolsVersion = '35.0.0'",
      '}',
    ].join('\n'),
  );
  write(
    root,
    'android/gradle/wrapper/gradle-wrapper.properties',
    'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.11.1-bin.zip\n',
  );
  write(root, 'android/build.gradle', "classpath 'com.android.tools.build:gradle:8.7.3'\n");
  write(
    root,
    'android/app/build.gradle',
    "flatDir { dirs '../../node_modules/@capacitor/background-runner/android/src/main/libs', 'libs' }\n",
  );
  write(
    root,
    'android/app/src/main/AndroidManifest.xml',
    '<manifest><uses-permission android:name="android.permission.CAMERA" /><application /></manifest>',
  );

  const report = inspectDevelopmentEnvironment(root, {
    platform: 'android',
    runtime: createRuntime(root, 'linux'),
  });
  const checks = new Map(report.checks.map((check) => [check.id, check]));

  assert.equal(checks.get('android-jdk')?.status, 'ok');
  assert.equal(checks.get('android-sdk-platform')?.status, 'ok');
  assert.equal(checks.get('android-gradle-plugin')?.status, 'ok');
  assert.equal(checks.get('android-permissions')?.status, 'ok');
  assert.equal(checks.get('android-background-runner')?.status, 'ok');
  assert.equal(checks.get('android-capability-min-sdk')?.status, 'error');
  assert.match(checks.get('android-capability-min-sdk')?.message ?? '', /minSdk 28/);
});

test('detecta requisitos iOS ausentes sin mostrar secretos', (context) => {
  const root = createNativeApplication(context, ['camera', 'healthFitness', 'pushNotifications']);
  write(
    root,
    'native-capabilities.catalog.json',
    JSON.stringify({
      schemaVersion: 1,
      capabilities: [
        {
          name: 'camera',
          package: '@capacitor/camera',
          platforms: ['android', 'ios'],
          permissions: { ios: ['NSCameraUsageDescription'] },
        },
        {
          name: 'healthFitness',
          package: '@capacitor/health-fitness',
          platforms: ['ios'],
          entitlements: { ios: ['com.apple.developer.healthkit'] },
        },
        {
          name: 'pushNotifications',
          package: '@capacitor/push-notifications',
          platforms: ['ios'],
          entitlements: { ios: ['aps-environment'] },
        },
      ],
    }),
  );
  mkdir(root, 'ios/App/App');
  write(root, 'ios/App/Podfile', "platform :ios, '15.0'\n");
  write(root, 'ios/App/Podfile.lock', 'PODS:\n');
  write(root, 'ios/App/App/Info.plist', '<plist><dict></dict></plist>');
  write(
    root,
    'ios/App/App/App.entitlements',
    '<plist><dict><key>aps-environment</key></dict></plist>',
  );

  const report = inspectDevelopmentEnvironment(root, {
    platform: 'ios',
    runtime: createRuntime(root, 'darwin'),
  });
  const checks = new Map(report.checks.map((check) => [check.id, check]));

  assert.equal(checks.get('ios-command:xcodebuild')?.status, 'ok');
  assert.equal(checks.get('ios-command:pod')?.status, 'ok');
  assert.equal(checks.get('ios-info-plist')?.status, 'error');
  assert.equal(checks.get('ios-entitlements')?.status, 'error');
  assert.doesNotMatch(JSON.stringify(report), /OPEN_MOVA_GOOGLE_MAPS_ANDROID_API_KEY/);
});

test('marca un lockfile desincronizado como error bloqueante', (context) => {
  const root = createNativeApplication(context, []);
  write(
    root,
    'package-lock.json',
    JSON.stringify({ packages: { '': { dependencies: { '@capacitor/core': '^7.0.0' } } } }),
  );
  write(
    root,
    'native-capabilities.catalog.json',
    JSON.stringify({ schemaVersion: 1, capabilities: [] }),
  );

  const report = inspectDevelopmentEnvironment(root, { runtime: createRuntime(root, 'linux') });
  const lockfile = report.checks.find((check) => check.id === 'lockfile:shell');

  assert.equal(lockfile?.status, 'error');
  assert.match(lockfile?.detail ?? '', /npm install/);
});

function createNativeApplication(context, capabilities) {
  const root = mkdtempSync(join(tmpdir(), 'open-mova-doctor-native-'));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  mkdir(root, 'node_modules/@capacitor/camera');
  mkdir(root, 'node_modules/@capacitor/background-runner');
  mkdir(root, 'node_modules/@capacitor/local-llm');
  mkdir(root, 'node_modules/@capacitor/health-fitness');
  mkdir(root, 'node_modules/@capacitor/push-notifications');
  write(root, 'package-lock.json', '{}\n');
  write(
    root,
    'package.json',
    JSON.stringify({
      dependencies: {
        '@capacitor/core': '^8.5.2',
        '@open-mova/core': '^0.2.7',
        '@capacitor/camera': '^8.2.4',
        '@capacitor/background-runner': '^3.0.0',
        '@capacitor/local-llm': '^1.0.0',
        '@capacitor/health-fitness': '^1.0.1',
        '@capacitor/push-notifications': '^8.1.2',
      },
    }),
  );
  write(
    root,
    'mova.config.json',
    JSON.stringify({
      schemaVersion: 5,
      name: 'native-app',
      shell: {
        repository: 'https://example.com/open-mova.git',
        version: 'v0.2.20',
        commit: '0123456789abcdef',
      },
      native: { capabilities },
      security: { trustedRemoteOrigins: [] },
      microfrontends: [],
    }),
  );
  return root;
}

function createRuntime(root, platform) {
  const sdkRoot = join(root, 'sdk');
  return {
    platform,
    nodeVersion: '22.23.0',
    environment: { ANDROID_SDK_ROOT: sdkRoot },
    command(command) {
      const output = {
        npm: ['10.9.0', ''],
        git: ['git version 2.51.0', ''],
        studio: ['Android Studio 2026.1', ''],
        adb: ['Android Debug Bridge version 1.0.41', ''],
        java: ['', 'openjdk version "17.0.15"'],
        xcodebuild: ['Xcode 26.0', ''],
        'xcode-select': ['/Applications/Xcode.app/Contents/Developer', ''],
        pod: ['1.16.2', ''],
      }[command];
      return output
        ? { status: 0, stdout: output[0], stderr: output[1] }
        : { status: 1, stdout: '', stderr: '', error: `${command} no encontrado` };
    },
    fileExists(path) {
      return existsSync(path);
    },
    readFile(path) {
      return readFileSync(path, 'utf8');
    },
  };
}

function mkdir(root, path) {
  mkdirSync(join(root, path), { recursive: true });
}

function write(root, path, content) {
  const destination = join(root, path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, content);
}
