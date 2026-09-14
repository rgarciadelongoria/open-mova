<p align="center">
  <img src="../assets/brand/open-mova-logo-title-rectangle.png" alt="Open Mova" width="720">
</p>

# Open Mova Shell

La shell es el host técnico de Open Mova. Carga los microfrontales mediante
Native Federation y ofrece el punto de integración para capacidades comunes del
framework.

No contiene lógica de negocio ni una interfaz de usuario propia. Su componente
solo incluye un `router-outlet`, que es el lugar donde se montan las rutas de
los microfrontales.

Este directorio es la fuente de la shell que el CLI descarga desde los tags
estables del repositorio. No existe una segunda plantilla de shell en el CLI.

## Responsabilidades

- Inicializar Native Federation.
- Leer el manifiesto de remotos.
- Convertir la configuración de microfrontales en rutas Angular.
- Proporcionar las capacidades nativas Device y Camera por inyección de dependencias.

Los microfrontales no forman parte del código fuente de la shell. Cada uno se
desarrolla y se instala como un proyecto independiente.

## Estructura principal

```text
open-mova-shell/
├── src/
│   ├── app/
│   │   ├── app.component.ts          # Contenedor de rutas
│   │   ├── app.routes.ts             # Carga las rutas remotas
│   │   └── application.config.ts    # Registro de microfrontales
│   ├── assets/
│   │   └── federation.manifest.json # URLs de los remotos
│   ├── bootstrap.ts
│   ├── index.html
│   └── main.ts
├── angular.json
├── capacitor.config.ts
└── federation.config.js
```

En `application.config.ts`, `path` es la ruta pública, `remote` es el nombre
del remoto y `exposedModule` indica el módulo de rutas que se carga:

```ts
{
  path: 'demo',
  remote: 'demo-microfrontend',
  exposedModule: './Routes',
}
```

El manifiesto relaciona ese remoto con su servidor:

```json
{
  "demo-microfrontend": "http://localhost:4300/remoteEntry.json"
}
```

La lógica de `app.routes.ts` recorre el registro y crea las rutas
automáticamente.

## Desarrollo

Desde la raíz del monorepo, prepara primero core:

```bash
npm --prefix open-mova-core install
npm --prefix open-mova-core run build
npm --prefix open-mova-shell install
```

Comandos propios de la shell:

```bash
cd open-mova-shell
npm start
npm run typecheck
npm run build
```

La shell se sirve en [http://localhost:4200](http://localhost:4200). Para ver
los microfrontales cargados hay que iniciar también sus proyectos. Desde la
raíz del monorepo, se pueden usar dos terminales:

```bash
npm run start:demo
npm start
```

## Capacitor

`capacitor.config.ts` identifica la aplicación y apunta a `dist/browser`, donde
se genera la shell web. Cambia `appId` y `appName` antes de crear una aplicación
nativa propia. Los microfrontales siguen cargándose por HTTPS: sus ficheros no
se incluyen en la app nativa.

Desde este proyecto se pueden usar los comandos oficiales tras compilar:

```bash
npm run build
npx cap add android     # o ios
npx cap sync android    # después de cada build o cambio de plugins
npx cap open android
```

Antes de sincronizar una app de producción, sustituye las URLs `localhost` del
manifiesto compilado por URLs HTTPS versionadas. En aplicaciones creadas con
Open Mova, `mova cap sync` hace esa sustitución a partir de `mova.config.json`.

La shell registra `NATIVE_CAPABILITIES` en `src/app/app.config.ts`. La
implementación de `src/native-capabilities.ts` usa los plugins oficiales de
Capacitor; el contrato y el token Angular viven en `@open-mova/core`.
Shell y MF comparten core como singleton de
Native Federation; no se publica ningún objeto global en `window`.
Camera funciona también en web, aunque depende de las capacidades del
navegador. En iOS hay que añadir a `Info.plist` los textos de uso
`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` y
`NSPhotoLibraryAddUsageDescription` antes de publicar. Los proyectos nativos
requieren las herramientas de Android Studio o Xcode, respectivamente.
Los servidores de los remotos deben permitir la carga desde el origen de la
WebView mediante CORS. Solo registra microfrontales de confianza: compartir
un token por DI no aísla permisos entre remotos en la misma página.
