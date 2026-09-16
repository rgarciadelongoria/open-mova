import { intersects, validRange } from 'semver';
import type { OpenMovaApplicationConfiguration } from '../types.js';

export function areCoreRangesCompatible(first: string, second: string): boolean {
  return validRange(first) !== null && validRange(second) !== null && intersects(first, second);
}

export function findIncompatibleMicrofrontends(
  configuration: OpenMovaApplicationConfiguration,
  shellCoreVersion: string,
): readonly string[] {
  return configuration.microfrontends
    .filter(
      (microfrontend) =>
        !areCoreRangesCompatible(shellCoreVersion, microfrontend.compatibility.requiredCoreVersion),
    )
    .map(
      (microfrontend) =>
        `mova.config.json#microfrontends.${microfrontend.name}.compatibility ` +
        `(shell ${shellCoreVersion}, MF ${microfrontend.compatibility.requiredCoreVersion})`,
    );
}
