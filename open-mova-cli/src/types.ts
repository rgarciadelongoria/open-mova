export interface OpenMovaApplicationConfiguration {
  readonly schemaVersion: 2;
  readonly name: string;
  readonly shell?: {
    readonly repository: string;
    readonly version: string;
    readonly commit: string;
  };
  /** Configuración opcional de las capacidades nativas de la aplicación. */
  readonly native?: NativeConfiguration;
  readonly microfrontends: readonly MicrofrontendConfiguration[];
}

export interface NativeConfiguration {
  readonly googleMaps?: {
    /** Clave de Android Maps. También puede venir de OPEN_MOVA_GOOGLE_MAPS_ANDROID_API_KEY. */
    readonly androidApiKey?: string;
  };
}

export interface MicrofrontendConfiguration {
  readonly name: string;
  readonly route: string;
  readonly remoteName: string;
  readonly exposedModule: './Routes';
  readonly developmentRemoteEntry: string;
  readonly productionRemoteEntry?: string;
  readonly sourcePath?: string;
  readonly compatibility: {
    /** Rango de @open-mova/core declarado y publicado por el microfrontal. */
    readonly requiredCoreVersion: string;
  };
  readonly template?: {
    readonly repository: string;
    readonly version: string;
    readonly commit: string;
    readonly project: 'open-mova-mf-template';
    readonly profile: 'minimal' | 'demo';
  };
}
