const VALID_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeName(value: string, label: string): string {
  const normalized = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  if (!VALID_NAME.test(normalized)) {
    throw new Error(
      `${label} debe contener letras, números y guiones. Valor recibido: "${value}".`,
    );
  }

  return normalized;
}

export function toDisplayName(value: string): string {
  return value
    .split('-')
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
}

export function toPascalCase(value: string): string {
  return value
    .split('-')
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join('');
}

export function toRemoteName(name: string): string {
  return `${name}-microfrontend`;
}
