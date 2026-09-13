export interface OpenMovaApplicationConfiguration {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly microfrontends: readonly MicrofrontendConfiguration[];
}

export interface MicrofrontendConfiguration {
  readonly name: string;
  readonly route: string;
  readonly remoteName: string;
  readonly exposedModule: './Routes';
  readonly developmentRemoteEntry: string;
  readonly sourcePath?: string;
}
