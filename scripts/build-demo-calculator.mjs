import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { configureDownloadedMicrofrontend } from '../open-mova-cli/dist/application/microfrontend-profile.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const template = join(root, 'open-mova-mf-template');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'open-mova-pages-calculator-'));
const calculator = join(temporaryRoot, 'calculator');

try {
  cpSync(template, calculator, {
    recursive: true,
    filter: (source) => !['node_modules', 'dist', '.angular'].includes(basename(source)),
  });
  configureDownloadedMicrofrontend(calculator, 'calculator', 4400, 'calculator');
  symlinkSync(join(template, 'node_modules'), join(calculator, 'node_modules'), 'dir');
  const build = spawnSync(
    process.execPath,
    [join(template, 'node_modules/@angular/cli/bin/ng.js'), 'build', 'mova-mf-calculator'],
    { cwd: calculator, stdio: 'inherit' },
  );
  if (build.error) throw build.error;
  if (build.status !== 0)
    throw new Error(`El build de calculator terminó con código ${build.status}.`);

  cpSync(join(calculator, 'dist/browser'), join(template, 'dist/browser/calculator'), {
    recursive: true,
  });
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
