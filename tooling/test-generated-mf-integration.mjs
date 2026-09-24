import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { configureDownloadedMicrofrontend } from '../open-mova-cli/dist/application/microfrontend-profile.js';
import { synchronizeShellConfiguration } from '../open-mova-cli/dist/application/shell-configuration.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'open-mova-generated-integration-'));
const shellRoot = join(temporaryRoot, 'shell');
const microfrontendRoot = join(temporaryRoot, 'catalog');
const componentOnlyRoot = join(temporaryRoot, 'widget');
const servers = [];
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

try {
  copyProject('open-mova-shell', shellRoot);
  copyProject('open-mova-mf-template', microfrontendRoot);
  configureDownloadedMicrofrontend(
    microfrontendRoot,
    'catalog',
    4500,
    'starter-both',
    'status-card',
  );

  const packageJson = JSON.parse(readFileSync(join(microfrontendRoot, 'package.json'), 'utf8'));
  synchronizeShellConfiguration(shellRoot, {
    schemaVersion: 5,
    name: 'generated-integration',
    native: { capabilities: [] },
    security: { trustedRemoteOrigins: [] },
    microfrontends: [
      {
        name: 'catalog',
        route: 'catalog',
        remoteName: 'catalog-microfrontend',
        exposedModule: './Routes',
        components: { 'status-card': './StatusCard' },
        developmentRemoteEntry: 'http://localhost:4500/remoteEntry.json',
        compatibility: { requiredCoreVersion: packageJson.dependencies['@open-mova/core'] },
      },
    ],
  });

  writeFileSync(
    join(shellRoot, 'src/app/app.routes.ts'),
    `import { Component } from '@angular/core';
import type { Routes } from '@angular/router';
import { MovaRemoteComponent } from '@open-mova/core/remote-components';
import { microfrontends } from './application.config';
import { loadCompatibleRemoteRoutes } from './microfrontends/remote-loader';

@Component({
  standalone: true,
  imports: [MovaRemoteComponent],
  template: '<h1>Anfitrión</h1><mova-remote-component name="catalog.status-card" />',
})
class HostComponent {}

export const routes: Routes = [
  { path: '', component: HostComponent },
  ...microfrontends.filter((mf) => mf.path).map((mf) => ({
    path: mf.path!,
    loadChildren: () => loadCompatibleRemoteRoutes(mf),
  })),
];
`,
  );

  servers.push(startServer('componente generado', microfrontendRoot));
  servers.push(startServer('shell', shellRoot));
  await Promise.all([
    waitForUrl('http://localhost:4500/remoteEntry.json'),
    waitForUrl('http://localhost:4200/assets/federation.manifest.json'),
  ]);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:4200/');
    await page.getByText('Componente remoto listo para desarrollar.').waitFor();
    assert.equal(await page.getByRole('alert').count(), 0);
    await page.goto('http://localhost:4200/catalog');
    await page.getByRole('heading', { name: 'Catalog' }).waitFor();

    copyProject('open-mova-mf-template', componentOnlyRoot);
    configureDownloadedMicrofrontend(
      componentOnlyRoot,
      'widget',
      4600,
      'starter-component',
      'badge',
    );
    servers.push(startServer('previsualización del componente', componentOnlyRoot));
    await waitForUrl('http://localhost:4600/');
    await page.goto('http://localhost:4600/');
    await page.getByText('Componente remoto listo para desarrollar.').waitFor();
    console.log('El mismo MF generado carga catalog.status-card y la ruta /catalog.');
  } finally {
    await browser.close();
  }
} finally {
  for (const server of servers) stopServer(server);
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function copyProject(project, destination) {
  cpSync(join(repositoryRoot, project), destination, {
    recursive: true,
    filter: (source) => !['node_modules', 'dist', '.angular'].includes(basename(source)),
  });
  symlinkSync(
    join(repositoryRoot, project, 'node_modules'),
    join(destination, 'node_modules'),
    'dir',
  );
}

function startServer(label, cwd) {
  const logs = [];
  const child = spawn(npm, ['start', '--', '--watch=false'], {
    cwd,
    detached: process.platform !== 'win32',
    env: { ...process.env, CI: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => logs.push(chunk.toString()));
  child.stderr.on('data', (chunk) => logs.push(chunk.toString()));
  child.logs = logs;
  child.label = label;
  return child;
}

async function waitForUrl(url) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // El servidor todavía está arrancando.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  for (const server of servers) console.error(server.label, server.logs.slice(-5));
  throw new Error(`No se pudo abrir ${url}.`);
}

function stopServer(server) {
  if (server.exitCode !== null) return;
  try {
    if (process.platform === 'win32') server.kill();
    else process.kill(-server.pid, 'SIGTERM');
  } catch {
    // El proceso ya había terminado.
  }
}
