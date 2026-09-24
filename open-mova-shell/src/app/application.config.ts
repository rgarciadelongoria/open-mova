export interface MicrofrontendDefinition {
  readonly name: string;
  readonly path?: string;
  readonly remote: string;
  readonly exposedModule?: string;
  readonly components?: Readonly<Record<string, string>>;
  readonly requiredCoreVersion: string;
  readonly allowedOrigins: readonly string[];
}

// Para añadir un microfrontal nuevo basta con añadir otra entrada aquí.
export const microfrontends: readonly MicrofrontendDefinition[] = [
  {
    name: 'demo',
    path: 'demo',
    remote: 'demo-microfrontend',
    exposedModule: './Routes',
    requiredCoreVersion: '^0.2.6',
    allowedOrigins: ['http://localhost:4300', 'https://rgarciadelongoria.github.io'],
  },
  {
    name: 'calculator',
    remote: 'calculator-microfrontend',
    components: { main: './Calculator' },
    requiredCoreVersion: '^0.2.6',
    allowedOrigins: ['http://localhost:4400', 'https://rgarciadelongoria.github.io'],
  },
];
