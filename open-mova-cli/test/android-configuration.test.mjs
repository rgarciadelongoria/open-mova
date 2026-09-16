import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { configureAndroidProject } from '../dist/application/android-configuration.js';

test('aplica los requisitos Android de los plugins instalados', (context) => {
  const root = mkdtempSync(join(tmpdir(), 'open-mova-android-test-'));
  context.after(() => rmSync(root, { recursive: true, force: true }));

  write(
    root,
    'package.json',
    JSON.stringify({
      dependencies: {
        '@capacitor/background-runner': '^3.0.0',
        '@capacitor/google-maps': '^8.0.0',
        '@capacitor/local-llm': '^1.0.0',
      },
    }),
  );
  write(
    root,
    'native-capabilities.catalog.json',
    JSON.stringify({
      schemaVersion: 1,
      capabilities: [
        {
          name: 'localLlm',
          minimumAndroidSdk: 28,
          platforms: ['android'],
          implementation: 'local-llm/local-llm.capability',
          exportName: 'localLlmCapability',
          package: '@capacitor/local-llm',
        },
        {
          name: 'googleMaps',
          platforms: ['android'],
          implementation: 'google-maps/google-maps.capability',
          exportName: 'googleMapsCapability',
          package: '@capacitor/google-maps',
        },
        {
          name: 'backgroundRunner',
          platforms: ['android'],
          implementation: 'background-runner/background-runner.capability',
          exportName: 'backgroundRunnerCapability',
          package: '@capacitor/background-runner',
          permissions: { android: ['android.permission.POST_NOTIFICATIONS'] },
        },
      ],
    }),
  );
  write(root, 'android/variables.gradle', 'ext {\n    minSdkVersion = 24\n}\n');
  write(root, 'android/app/build.gradle', 'repositories {\n    flatDir {\n    }\n}\n');
  write(
    root,
    'android/app/src/main/AndroidManifest.xml',
    '<manifest>\n    <application>\n    </application>\n</manifest>\n',
  );

  configureAndroidProject(root, {
    schemaVersion: 3,
    name: 'demo-app',
    native: {
      capabilities: ['backgroundRunner', 'googleMaps', 'localLlm'],
      googleMaps: { androidApiKey: 'key<&>"\'' },
    },
    microfrontends: [],
  });

  assert.match(read(root, 'android/variables.gradle'), /minSdkVersion = 28/);
  assert.match(
    read(root, 'android/app/build.gradle'),
    /@capacitor\/background-runner\/android\/src\/main\/libs/,
  );
  assert.match(
    read(root, 'android/app/src/main/AndroidManifest.xml'),
    /com\.google\.android\.geo\.API_KEY/,
  );
  assert.match(
    read(root, 'android/app/src/main/AndroidManifest.xml'),
    /android\.permission\.POST_NOTIFICATIONS/,
  );
  assert.match(
    read(root, 'android/app/src/main/res/values/open_mova_google_maps.xml'),
    /key&lt;&amp;&gt;&quot;&apos;/,
  );
});

function write(root, relativePath, content) {
  const path = join(root, relativePath);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content);
}

function read(root, relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}
