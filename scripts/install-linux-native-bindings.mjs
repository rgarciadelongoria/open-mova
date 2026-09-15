import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectName = process.argv[2];
const allowedProjects = new Set(['open-mova-shell', 'open-mova-mf-template']);

if (!allowedProjects.has(projectName)) {
  throw new Error(`Proyecto no válido: ${projectName ?? '(vacío)'}.`);
}

if (process.platform !== 'linux' || process.arch !== 'x64') {
  console.log('Los bindings adicionales solo son necesarios en Linux x64.');
  process.exit(0);
}

const templatePackage = JSON.parse(
  readFileSync(join(repositoryRoot, 'open-mova-mf-template', 'package.json'), 'utf8'),
);
const bindings = Object.entries(templatePackage.optionalDependencies ?? {})
  .filter(([name]) => name.includes('linux-x64') || name.startsWith('@emnapi/'))
  .map(([name, version]) => `${name}@${version}`);

if (bindings.length === 0) {
  throw new Error('No se han definido los bindings Linux de Native Federation.');
}

const result = spawnSync(
  'npm',
  [
    'install',
    '--no-save',
    '--no-package-lock',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    ...bindings,
  ],
  {
    cwd: join(repositoryRoot, projectName),
    stdio: 'inherit',
  },
);

if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error(`No se pudieron instalar los bindings Linux para ${projectName}.`);
}
