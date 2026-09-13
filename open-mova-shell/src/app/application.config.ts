export interface MicrofrontendDefinition {
  readonly path: string;
  readonly remote: string;
  readonly exposedModule: string;
}

// Para añadir un microfrontal nuevo basta con añadir otra entrada aquí.
export const microfrontends: readonly MicrofrontendDefinition[] = [
  {
    path: 'first',
    remote: 'first-microfrontend',
    exposedModule: './Routes',
  },
  {
    path: 'second',
    remote: 'second-microfrontend',
    exposedModule: './Routes',
  },
];
