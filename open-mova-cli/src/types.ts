export interface OpenMovaApplicationConfiguration {
  readonly schemaVersion: 5;
  readonly name: string;
  readonly shell?: {
    readonly repository: string;
    readonly version: string;
    readonly commit: string;
  };
  /** Configuración opcional de las capacidades nativas de la aplicación. */
  readonly native?: NativeConfiguration;
  /** Orígenes HTTPS de confianza desde los que se pueden cargar remotos en producción. */
  readonly security: RemoteSecurityConfiguration;
  readonly microfrontends: readonly MicrofrontendConfiguration[];
}

export interface RemoteSecurityConfiguration {
  /** Un origen es protocolo, host y puerto, sin ruta: https://cdn.example.com. */
  readonly trustedRemoteOrigins: readonly string[];
}

export interface NativeConfiguration {
  /** Capacidades instaladas y proporcionadas por la shell. */
  readonly capabilities: readonly string[];
  readonly googleMaps?: {
    /** Clave de Android Maps. También puede venir de OPEN_MOVA_GOOGLE_MAPS_ANDROID_API_KEY. */
    readonly androidApiKey?: string;
  };
}

export interface MicrofrontendConfiguration {
  readonly name: string;
  readonly route?: string;
  readonly remoteName: string;
  readonly exposedModule?: './Routes';
  readonly components?: Readonly<Record<string, string>>;
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
    readonly profile:
      'minimal' | 'demo' | 'calculator' | 'starter-both' | 'starter-routes' | 'starter-component';
    readonly componentName?: string;
  };
}
