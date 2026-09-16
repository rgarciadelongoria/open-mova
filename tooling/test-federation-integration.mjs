import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const servers = [];

try {
  servers.push(startServer('microfrontal', join(repositoryRoot, 'open-mova-mf-template')));
  servers.push(startServer('shell', join(repositoryRoot, 'open-mova-shell')));

  await Promise.all([
    waitForUrl('http://localhost:4300/remoteEntry.json'),
    waitForUrl('http://localhost:4200/demo/inicio'),
  ]);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const runtimeErrors = [];
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(message.text());
    });

    await page.goto('http://localhost:4200/demo/inicio');
    await page
      .getByRole('heading', {
        name: 'Una guía interactiva que también es un microfrontal.',
      })
      .waitFor();

    await page.goto('http://localhost:4200/demo/device');
    await page.getByRole('heading', { name: 'Device' }).waitFor();
    await page.getByText('API COMPLETA').waitFor();

    assert.deepEqual(runtimeErrors, [], runtimeErrors.join('\n'));
    console.log('La shell carga el MF, sus rutas y las capacidades por DI correctamente.');
  } finally {
    await browser.close();
  }
} finally {
  for (const server of servers) stopServer(server);
}

function startServer(label, cwd) {
  const output = [];
  // La prueba necesita servidores HTTP, pero no observadores de cambios.
  // Desactivar watch evita consumir descriptores de archivo innecesarios en CI.
  const child = spawn(npm, ['start', '--', '--watch=false'], {
    cwd,
    detached: process.platform !== 'win32',
    env: { ...process.env, CI: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => output.push(chunk.toString()));
  child.stderr.on('data', (chunk) => output.push(chunk.toString()));
  child.once('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${label} terminó con código ${code}.\n${output.join('')}`);
    }
  });

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
    await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 500));
  }

  throw new Error(`Tiempo agotado esperando ${url}.`);
}

function stopServer(server) {
  if (!server.pid || server.exitCode !== null) return;

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F']);
  } else {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      server.kill('SIGTERM');
    }
  }
}
