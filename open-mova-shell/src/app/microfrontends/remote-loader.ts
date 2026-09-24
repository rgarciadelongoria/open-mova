import { loadRemoteModule } from '@angular-architects/native-federation';
import { reflectComponentType, type Type } from '@angular/core';
import type { Routes } from '@angular/router';
import {
  checkCoreCompatibility,
  OPEN_MOVA_CORE_VERSION,
  parseMicrofrontendManifest,
} from '@open-mova/core';
import { microfrontends, type MicrofrontendDefinition } from '../application.config';

let federationManifest: Promise<Record<string, string>> | undefined;

export async function loadCompatibleRemoteRoutes(
  microfrontend: MicrofrontendDefinition,
): Promise<Routes> {
  if (!microfrontend.exposedModule) {
    throw new Error(`El MF ${microfrontend.remote} no expone rutas.`);
  }
  const remoteModule = await loadCompatibleRemoteModule(microfrontend, microfrontend.exposedModule);
  if (!Array.isArray(remoteModule['routes'])) {
    throw new Error(`El MF ${microfrontend.remote} no expone una lista de rutas válida.`);
  }
  return remoteModule['routes'] as Routes;
}

export async function loadCompatibleRemoteComponent(name: string): Promise<Type<unknown>> {
  const separator = name.indexOf('.');
  const remoteName = name.slice(0, separator);
  const alias = name.slice(separator + 1);
  const microfrontend = microfrontends.find((entry) => entry.name === remoteName);
  const exposedModule = microfrontend?.components?.[alias];
  if (!microfrontend || !exposedModule || separator < 1) {
    throw new Error(`El componente remoto ${name} no está registrado en esta aplicación.`);
  }
  const remoteModule = await loadCompatibleRemoteModule(microfrontend, exposedModule);
  const candidates = Object.values(remoteModule).filter(
    (value): value is Type<unknown> =>
      typeof value === 'function' && reflectComponentType(value as Type<unknown>) !== null,
  );
  if (candidates.length !== 1) {
    throw new Error(
      `La exposición ${exposedModule} de ${microfrontend.remote} debe exportar un único componente Angular.`,
    );
  }
  return candidates[0];
}

async function loadCompatibleRemoteModule(
  microfrontend: MicrofrontendDefinition,
  exposedModule: string,
): Promise<Record<string, unknown>> {
  const remoteEntry = await findRemoteEntry(microfrontend.remote);
  assertAllowedRemoteOrigin(remoteEntry, microfrontend);
  const manifestUrl = new URL('assets/open-mova.manifest.json', remoteEntry).toString();
  const response = await fetch(manifestUrl);

  if (!response.ok) {
    throw new Error(
      `El MF ${microfrontend.remote} no publica su manifiesto de compatibilidad (${response.status}).`,
    );
  }

  const manifest = parseMicrofrontendManifest(await response.json());
  if (manifest.remoteName !== microfrontend.remote) {
    throw new Error(
      `El remoto esperado es ${microfrontend.remote}, pero su manifiesto declara ${manifest.remoteName}.`,
    );
  }
  if (manifest.core.requiredVersion !== microfrontend.requiredCoreVersion) {
    throw new Error(
      `La aplicación espera Core ${microfrontend.requiredCoreVersion} para ${microfrontend.remote}, ` +
        `pero el remoto publica ${manifest.core.requiredVersion}. Regenera la configuración de la shell.`,
    );
  }

  const compatibility = checkCoreCompatibility(
    manifest.core.requiredVersion,
    OPEN_MOVA_CORE_VERSION,
  );
  if (!compatibility.compatible) {
    throw new Error(compatibility.reason);
  }

  return (await loadRemoteModule(microfrontend.remote, exposedModule)) as Record<string, unknown>;
}

function assertAllowedRemoteOrigin(
  remoteEntry: string,
  microfrontend: MicrofrontendDefinition,
): void {
  let origin: string;

  try {
    origin = new URL(remoteEntry).origin;
  } catch {
    throw new Error(`La URL del remoto ${microfrontend.remote} no es válida.`);
  }

  if (!microfrontend.allowedOrigins.includes(origin)) {
    throw new Error(
      `El origen ${origin} del remoto ${microfrontend.remote} no está permitido por esta aplicación.`,
    );
  }
}

async function findRemoteEntry(remoteName: string): Promise<string> {
  const manifestUrl = new URL('assets/federation.manifest.json', document.baseURI);
  federationManifest ??= fetch(manifestUrl).then(async (response) => {
    if (!response.ok) throw new Error('No se puede leer el manifiesto de federación de la shell.');
    return (await response.json()) as Record<string, string>;
  });

  const remoteEntry = (await federationManifest)[remoteName];
  if (!remoteEntry) {
    throw new Error(`No existe una URL de federación para el remoto ${remoteName}.`);
  }
  return remoteEntry;
}
