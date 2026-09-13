export interface OpenMovaApplicationConfiguration {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly shell?: {
    readonly repository: string;
    readonly version: string;
    readonly commit: string;
  };
  readonly microfrontends: readonly MicrofrontendConfiguration[];
}

export interface MicrofrontendConfiguration {
  readonly name: string;
  readonly route: string;
  readonly remoteName: string;
  readonly exposedModule: './Routes';
  readonly developmentRemoteEntry: string;
  readonly productionRemoteEntry?: string;
  readonly sourcePath?: string;
  readonly template?: {
    readonly repository: string;
    readonly version: string;
    readonly commit: string;
    readonly project: 'open-mova-mf-template';
    readonly profile: 'minimal' | 'demo';
  };
}
