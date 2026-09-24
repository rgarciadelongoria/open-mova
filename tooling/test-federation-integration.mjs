import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { configureDownloadedMicrofrontend } from '../open-mova-cli/dist/application/microfrontend-profile.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const servers = [];
const templateRoot = join(repositoryRoot, 'open-mova-mf-template');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'open-mova-two-remotes-'));
const calculatorRoot = join(temporaryRoot, 'calculator');

try {
  cpSync(templateRoot, calculatorRoot, {
    recursive: true,
    filter: (source) => !['node_modules', 'dist', '.angular'].includes(basename(source)),
  });
  configureDownloadedMicrofrontend(calculatorRoot, 'calculator', 4400, 'calculator');
  symlinkSync(join(templateRoot, 'node_modules'), join(calculatorRoot, 'node_modules'), 'dir');

  servers.push(startServer('microfrontal', templateRoot));
  servers.push(startServer('calculadora', calculatorRoot));
  servers.push(startServer('shell', join(repositoryRoot, 'open-mova-shell')));

  await Promise.all([
    waitForUrl('http://localhost:4300/remoteEntry.json'),
    waitForUrl('http://localhost:4400/remoteEntry.json'),
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
        name: 'Explora el framework desde un microfrontal real.',
      })
      .waitFor()
      .catch(async (error) => {
        console.error('Errores del navegador:', runtimeErrors);
        console.error('HTML de la shell:', (await page.content()).slice(0, 3000));
        for (const server of servers) console.error(server.logs?.slice(-3));
        throw error;
      });

    await page.goto('http://localhost:4200/demo/device');
    await page.getByRole('heading', { name: 'Device' }).waitFor();
    await page.getByRole('heading', { name: 'Leer información del dispositivo' }).waitFor();

    await page.goto('http://localhost:4200/demo/componentes');
    await page.getByRole('heading', { name: 'Calculadora remota' }).waitFor();
    await page.getByRole('button', { name: '8', exact: true }).click();
    await page.getByRole('button', { name: 'Multiplicar' }).click();
    await page.getByRole('button', { name: '3', exact: true }).click();
    await page.getByRole('button', { name: 'Igual' }).click();
    await page.getByText('8 × 3 = 24').waitFor();
    await page.getByRole('button', { name: 'Apagar calculadora' }).click();
    await page.getByText('La calculadora está apagada.').waitFor();
    await page.getByText('La lista se ha limpiado al apagar la calculadora.').waitFor();
    await assert.equal(await page.getByRole('button', { name: 'Sumar' }).isDisabled(), true);
    await page.getByRole('button', { name: 'Encender calculadora' }).click();
    await page.getByText('La calculadora está apagada.').waitFor({ state: 'hidden' });
    await assert.equal(await page.getByRole('button', { name: 'Sumar' }).isEnabled(), true);

    await page.getByRole('button', { name: '8', exact: true }).click();
    await page.getByRole('button', { name: 'Dividir' }).click();
    await page.getByRole('button', { name: '3', exact: true }).click();
    await page.getByRole('button', { name: 'Igual' }).click();
    await page.getByText('8 ÷ 3 = 2.6666666666666665').waitFor();

    await page.getByRole('button', { name: '8', exact: true }).click();
    await page.getByRole('button', { name: 'Dividir' }).click();
    await page.getByRole('button', { name: '0', exact: true }).click();
    await page.getByRole('button', { name: 'Igual' }).click();
    await page.getByRole('alert').getByText('No se puede dividir entre cero.').waitFor();
    await page.getByRole('link', { name: 'Inicio' }).click();
    await page.getByRole('link', { name: 'Componentes remotos' }).click();
    await page.getByRole('heading', { name: 'Calculadora remota' }).waitFor();
    assert.deepEqual(runtimeErrors, [], runtimeErrors.join('\n'));

    await page.route('http://localhost:4400/assets/open-mova.manifest.json', (route) =>
      route.fulfill({ status: 503, body: 'Remoto no disponible' }),
    );
    await page.goto('http://localhost:4200/demo/componentes');
    await page.getByRole('heading', { name: 'Dos microfrontales, una pantalla.' }).waitFor();
    await page
      .getByRole('alert')
      .getByText(/no publica su manifiesto de compatibilidad/)
      .waitFor();

    console.log('La shell carga dos remotos y conecta las entradas y salidas de la calculadora.');
  } finally {
    await browser.close();
  }
} finally {
  for (const server of servers) stopServer(server);
  rmSync(temporaryRoot, { recursive: true, force: true });
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
  child.logs = output;

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
