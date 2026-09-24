import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { configureDownloadedMicrofrontend } from '../open-mova-cli/dist/application/microfrontend-profile.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const templateRoot = join(repositoryRoot, 'open-mova-mf-template');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'open-mova-generated-profiles-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

try {
  for (const variant of [
    {
      name: 'both',
      profile: 'starter-both',
      componentName: 'product-card',
      exposures: ['./ProductCard', './Routes'],
    },
    { name: 'routes', profile: 'starter-routes', exposures: ['./Routes'] },
    {
      name: 'component',
      profile: 'starter-component',
      componentName: 'calculator',
      exposures: ['./Calculator'],
    },
  ]) {
    const projectRoot = join(temporaryRoot, variant.name);
    cpSync(templateRoot, projectRoot, {
      recursive: true,
      filter: (source) => !['node_modules', 'dist', '.angular'].includes(basename(source)),
    });
    configureDownloadedMicrofrontend(
      projectRoot,
      variant.name,
      4500,
      variant.profile,
      variant.componentName,
    );
    symlinkSync(join(templateRoot, 'node_modules'), join(projectRoot, 'node_modules'), 'dir');

    const build = spawnSync(npm, ['run', 'build'], {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 120_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    assert.equal(
      build.status,
      0,
      `${variant.name}: ${build.error?.message ?? build.signal ?? ''}\n${build.stderr}\n${build.stdout}`,
    );

    const browserOutput = join(projectRoot, 'dist/browser');
    const remoteEntry = JSON.parse(readFileSync(join(browserOutput, 'remoteEntry.json'), 'utf8'));
    assert.deepEqual(
      remoteEntry.exposes.map(({ key }) => key).sort(),
      variant.exposures.sort(),
      `${variant.name}: las exposiciones del build no coinciden`,
    );
    const compatibility = JSON.parse(
      readFileSync(join(browserOutput, 'assets/open-mova.manifest.json'), 'utf8'),
    );
    assert.equal(Boolean(compatibility.routes), variant.exposures.includes('./Routes'));
    assert.equal(
      Boolean(compatibility.components),
      variant.exposures.length > 1 || variant.name === 'component',
    );
    console.log(`${variant.name}: ${variant.exposures.join(', ')} compilados y publicados.`);
  }
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
