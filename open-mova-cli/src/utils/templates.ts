import {
  cpSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function copyTemplate(
  templateName: 'application' | 'microfrontend',
  destination: string,
  replacements: Readonly<Record<string, string>>,
): void {
  const source = fileURLToPath(
    new URL(`../../templates/${templateName}`, import.meta.url),
  );

  cpSync(source, destination, { recursive: true });
  renameSync(join(destination, 'gitignore'), join(destination, '.gitignore'));
  replaceTokens(destination, replacements);
}

function replaceTokens(
  directory: string,
  replacements: Readonly<Record<string, string>>,
): void {
  for (const entry of readdirSync(directory)) {
    const entryPath = join(directory, entry);

    if (statSync(entryPath).isDirectory()) {
      replaceTokens(entryPath, replacements);
      continue;
    }

    let content = readFileSync(entryPath, 'utf8');

    for (const [token, value] of Object.entries(replacements)) {
      content = content.replaceAll(token, value);
    }

    writeFileSync(entryPath, content, 'utf8');
  }
}
