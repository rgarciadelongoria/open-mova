export interface MicrofrontendDefinition {
  readonly path: string;
  readonly remote: string;
  readonly exposedModule: './Routes';
}

// Este fichero lo mantiene el CLI a partir de mova.config.json.
export const microfrontends: readonly MicrofrontendDefinition[] = [];
