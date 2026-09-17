import type { MicrofrontendConfiguration, OpenMovaApplicationConfiguration } from '../types.js';

/**
 * Construye el manifiesto de una entrega de producción. Las URLs se validan
 * antes de generar el artefacto para evitar cargar código desde otro origen.
 */
export function createProductionRemoteManifest(
  configuration: OpenMovaApplicationConfiguration,
): Record<string, string> {
  return Object.fromEntries(
    configuration.microfrontends.map((microfrontend) => {
      const remoteEntry = microfrontend.productionRemoteEntry;

      if (!remoteEntry || !isHttpsUrl(remoteEntry)) {
        throw new Error(
          `Configura productionRemoteEntry con HTTPS para el microfrontal "${microfrontend.name}" en mova.config.json.`,
        );
      }

      assertTrustedRemoteOrigin(remoteEntry, configuration, microfrontend.name);
      return [microfrontend.remoteName, remoteEntry];
    }),
  );
}

/** Orígenes admitidos por la shell para un remoto tanto en desarrollo como en producción. */
export function allowedRemoteOrigins(
  microfrontend: MicrofrontendConfiguration,
  configuration: OpenMovaApplicationConfiguration,
): readonly string[] {
  const developmentOrigin = getOrigin(microfrontend.developmentRemoteEntry);
  const trustedOrigins = configuration.security.trustedRemoteOrigins;

  return [...new Set([...(developmentOrigin ? [developmentOrigin] : []), ...trustedOrigins])];
}

export function isTrustedRemoteOrigin(
  remoteEntry: string,
  configuration: OpenMovaApplicationConfiguration,
): boolean {
  const origin = getOrigin(remoteEntry);
  return origin !== undefined && configuration.security.trustedRemoteOrigins.includes(origin);
}

export function getOrigin(value: string): string | undefined {
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function trustedOriginsForMicrofrontend(
  microfrontend: MicrofrontendConfiguration,
): readonly string[] {
  return [microfrontend.developmentRemoteEntry, microfrontend.productionRemoteEntry]
    .filter((entry): entry is string => entry !== undefined && isHttpsUrl(entry))
    .map((entry) => getOrigin(entry)!)
    .filter((origin, index, origins) => origins.indexOf(origin) === index);
}

function assertTrustedRemoteOrigin(
  remoteEntry: string,
  configuration: OpenMovaApplicationConfiguration,
  microfrontendName: string,
): void {
  if (isTrustedRemoteOrigin(remoteEntry, configuration)) return;

  const origin = getOrigin(remoteEntry) ?? remoteEntry;
  throw new Error(
    `El origen ${origin} del microfrontal "${microfrontendName}" no está en security.trustedRemoteOrigins.`,
  );
}
