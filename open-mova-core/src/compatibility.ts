/** Versión del paquete que implementa este contrato en tiempo de ejecución. */
export const OPEN_MOVA_CORE_VERSION = '0.2.7';

/** Versión del formato del manifiesto publicado por cada microfrontal. */
export const MICROFRONTEND_MANIFEST_SCHEMA_VERSION = 1;

export interface OpenMovaMicrofrontendManifest {
  readonly schemaVersion: typeof MICROFRONTEND_MANIFEST_SCHEMA_VERSION;
  readonly name: string;
  readonly remoteName: string;
  readonly core: {
    readonly requiredVersion: string;
  };
}

export interface CompatibilityResult {
  readonly compatible: boolean;
  readonly reason?: string;
}

/**
 * Comprueba los rangos que genera Open Mova: versión exacta, caret y tilde.
 * Mantener el formato acotado permite usarlo también en el navegador sin
 * incorporar un segundo motor completo de semver al runtime compartido.
 */
export function checkCoreCompatibility(
  requiredVersion: string,
  availableVersion = OPEN_MOVA_CORE_VERSION,
): CompatibilityResult {
  const range = parseSupportedRange(requiredVersion);
  const available = parseVersion(availableVersion);

  if (!range || !available) {
    return {
      compatible: false,
      reason: `No se puede interpretar el rango ${requiredVersion} o la versión ${availableVersion}.`,
    };
  }

  const minimumComparison = compareVersions(available, range.minimum);
  const compatible = minimumComparison >= 0 && isBelowUpperBound(available, range);

  return compatible
    ? { compatible: true }
    : {
        compatible: false,
        reason: `Requiere @open-mova/core ${requiredVersion}, pero la shell proporciona ${availableVersion}.`,
      };
}

export function parseMicrofrontendManifest(value: unknown): OpenMovaMicrofrontendManifest {
  if (!isRecord(value) || value.schemaVersion !== MICROFRONTEND_MANIFEST_SCHEMA_VERSION) {
    throw new Error('El manifiesto del microfrontal tiene una versión no compatible.');
  }
  if (
    typeof value.name !== 'string' ||
    typeof value.remoteName !== 'string' ||
    !isRecord(value.core) ||
    typeof value.core.requiredVersion !== 'string'
  ) {
    throw new Error('El manifiesto del microfrontal está incompleto.');
  }

  return {
    schemaVersion: MICROFRONTEND_MANIFEST_SCHEMA_VERSION,
    name: value.name,
    remoteName: value.remoteName,
    core: { requiredVersion: value.core.requiredVersion },
  };
}

interface Version {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

interface SupportedRange {
  readonly operator: 'exact' | 'caret' | 'tilde';
  readonly minimum: Version;
}

function parseSupportedRange(value: string): SupportedRange | undefined {
  if (value.trim() === '*') {
    return {
      operator: 'caret',
      minimum: { major: 0, minor: 0, patch: 0 },
    };
  }
  const match = value.trim().match(/^(\^|~)?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return undefined;

  return {
    operator: match[1] === '^' ? 'caret' : match[1] === '~' ? 'tilde' : 'exact',
    minimum: {
      major: Number(match[2]),
      minor: Number(match[3]),
      patch: Number(match[4]),
    },
  };
}

function parseVersion(value: string): Version | undefined {
  const match = value.trim().match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  return match
    ? { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) }
    : undefined;
}

function isBelowUpperBound(version: Version, range: SupportedRange): boolean {
  if (
    range.operator === 'caret' &&
    range.minimum.major === 0 &&
    range.minimum.minor === 0 &&
    range.minimum.patch === 0
  ) {
    return true;
  }
  if (range.operator === 'exact') return compareVersions(version, range.minimum) === 0;

  if (range.operator === 'tilde') {
    return version.major === range.minimum.major && version.minor === range.minimum.minor;
  }

  if (range.minimum.major > 0) return version.major === range.minimum.major;
  if (range.minimum.minor > 0) {
    return version.major === 0 && version.minor === range.minimum.minor;
  }
  return compareVersions(version, range.minimum) === 0;
}

function compareVersions(first: Version, second: Version): number {
  return first.major - second.major || first.minor - second.minor || first.patch - second.patch;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
