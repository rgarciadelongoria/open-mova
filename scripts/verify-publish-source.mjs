import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';

const repository = 'rgarciadelongoria/open-mova';
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const run = event.workflow_run;

if (
  process.env.GITHUB_EVENT_NAME !== 'workflow_run' ||
  process.env.GITHUB_REPOSITORY !== repository ||
  run?.event !== 'push' ||
  run?.conclusion !== 'success' ||
  run?.head_branch !== 'main' ||
  run?.head_repository?.full_name !== repository ||
  !/^[0-9a-f]{40}$/.test(run?.head_sha ?? '')
) {
  throw new Error(
    'La publicación requiere una CI correcta de un push a main en el repositorio original.',
  );
}

function git(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0)
    throw new Error(result.stderr.trim() || 'No se pudo verificar el commit de main.');
  return result.stdout.trim();
}

if (git(['rev-parse', 'HEAD']) !== run.head_sha) {
  throw new Error('El checkout no corresponde al commit validado por CI.');
}

const main = git([
  'ls-remote',
  'https://github.com/rgarciadelongoria/open-mova.git',
  'refs/heads/main',
]).split(/\s+/)[0];
const current = main === run.head_sha;
appendFileSync(process.env.GITHUB_OUTPUT, `current=${current}\n`);
console.log(
  current
    ? `CI y main coinciden en ${main}.`
    : `Se omite ${run.head_sha}: main ya avanzó a ${main}.`,
);
