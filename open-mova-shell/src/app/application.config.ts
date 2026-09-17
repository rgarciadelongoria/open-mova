export interface MicrofrontendDefinition {
  readonly path: string;
  readonly remote: string;
  readonly exposedModule: string;
  readonly requiredCoreVersion: string;
  readonly allowedOrigins: readonly string[];
}

// Para añadir un microfrontal nuevo basta con añadir otra entrada aquí.
export const microfrontends: readonly MicrofrontendDefinition[] = [
  {
    path: 'demo',
    remote: 'demo-microfrontend',
    exposedModule: './Routes',
    requiredCoreVersion: '^0.2.2',
    allowedOrigins: ['http://localhost:4300', 'https://rgarciadelongoria.github.io'],
  },
];
