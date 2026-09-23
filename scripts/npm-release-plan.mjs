import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, readlinkSync } from 'node:fs';
import { join } from 'node:path';

export function parseStableVersion(version) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version);
  if (!match) throw new Error(`Versión npm no válida para publicación estable: ${version}`);
  return match.slice(1).map(Number);
}

function compareVersions(left, right) {
  const a = parseStableVersion(left);
  const b = parseStableVersion(right);
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return Math.sign(a[index] - b[index]);
  }
  return 0;
}

export function planNpmRelease(version, publishedVersions) {
  parseStableVersion(version);
  const stableVersions = publishedVersions.filter((item) =>
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(item),
  );
  const highest = stableVersions.sort(compareVersions).at(-1);

  if (highest && compareVersions(version, highest) < 0) {
    throw new Error(`La versión local ${version} es anterior a ${highest}, ya publicada en npm.`);
  }
  if (publishedVersions.includes(version)) return 'compare';
  return 'publish';
}

export function packageFiles(directory) {
  const files = new Map();
  function visit(current, relative) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) visit(path, name);
      else if (entry.isFile())
        files.set(name, createHash('sha256').update(readFileSync(path)).digest('hex'));
      else if (entry.isSymbolicLink()) files.set(name, `link:${readlinkSync(path)}`);
      else throw new Error(`Tipo de archivo inesperado en el paquete: ${name}`);
    }
  }
  visit(directory, '');
  return [...files].sort(([left], [right]) => left.localeCompare(right));
}

export function packagesMatch(left, right) {
  return JSON.stringify(packageFiles(left)) === JSON.stringify(packageFiles(right));
}
