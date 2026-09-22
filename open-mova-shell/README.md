<p align="center">
  <img src="../assets/brand/open-mova-logo-title-rectangle.png" alt="Open Mova" width="720">
</p>

<div align="center">

| Dependencia       | Versión        |
| ----------------- | -------------- |
| Node.js           | 22 o posterior |
| npm               | 10 o posterior |
| Angular           | `^21.2.23`     |
| Native Federation | `^21.2.6`      |
| Capacitor         | `^8.5.2`       |
| TypeScript        | `^5.9.3`       |

</div>

# Open Mova Shell

La shell es el host técnico de Open Mova. Carga los microfrontales mediante
Native Federation y ofrece el punto de integración para capacidades comunes del
framework.

No contiene lógica de negocio ni una interfaz de usuario propia. Su componente
solo incluye un `router-outlet`, que es el lugar donde se montan las rutas de
los microfrontales.

Este directorio es la fuente de la shell que el CLI descarga desde los tags
estables del repositorio. No existe una segunda plantilla de shell en el CLI.

> [!WARNING]
> Como norma general, no necesitas modificar la shell a mano. Configura la
> aplicación con `open-mova-cli`: añade microfrontales, activa capacidades y
> prepara los entornos de desarrollo o producción desde sus comandos. Solo en
> casos concretos tendrás que revisar `capacitor.config.ts` o ajustar los
> proyectos nativos de `android/` e `ios/` para sus necesidades específicas.

## Responsabilidades

- Inicializar Native Federation.
- Leer el manifiesto de remotos.
- Rechazar remotos cuyo origen no esté permitido por la aplicación.
- Convertir la configuración de microfrontales en rutas Angular.
- Implementar los plugins oficiales de Capacitor y proporcionarlos por
  inyección de dependencias.
- Instalar y registrar únicamente las capacidades elegidas por cada
  aplicación.

Los microfrontales no forman parte del código fuente de la shell. Cada uno se
desarrolla y se instala como un proyecto independiente.

## Estructura principal

```text
open-mova-shell/
├── src/
│   ├── app/
│   │   ├── app.component.ts          # Contenedor con el router-outlet
│   │   ├── app.config.ts             # Providers Angular y capacidades nativas
│   │   ├── app.routes.ts             # Carga las rutas remotas
│   │   └── application.config.ts     # Registro de microfrontales
│   ├── assets/
│   │   └── federation.manifest.json # URLs de los remotos
│   └── native-capabilities/
│       ├── camera/                    # Una carpeta por capacidad nativa
│       ├── device/
│       ├── filesystem/
│       ├── …
│       ├── create-native-plugin-capability.ts # Adaptador común de Capacitor
│       └── native-capabilities.provider.ts    # Provider común de Angular
│   ├── bootstrap.ts
│   ├── index.html
│   └── main.ts
├── angular.json
├── capacitor.config.ts
├── native-capabilities.catalog.json # Paquetes y requisitos por capacidad
└── federation.config.js
```

Hay dos ficheros de configuración con responsabilidades diferentes:

- `app.config.ts` configura Angular. Aquí se registran el router y el provider
  que conecta las capacidades nativas mediante inyección de dependencias.
- `application.config.ts` describe qué microfrontales debe cargar esta shell.
  No contiene lógica de negocio ni componentes de interfaz.

En `application.config.ts`, `path` es el prefijo público de la aplicación,
`remote` es el nombre utilizado en el manifiesto y `exposedModule` indica el
módulo de rutas que expone el microfrontal:

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
automáticamente. Si el MF expone `first-route` y se registra con `path: 'demo'`,
la URL resultante será `/demo/first-route`. Las rutas internas pertenecen al
MF; la shell solo aporta el prefijo y lo monta en su `router-outlet`.

Cada entrada generada también declara `allowedOrigins`. Antes de descargar un
`remoteEntry.json`, la shell comprueba que su origen esté en esa lista. El CLI
la genera a partir del remoto local y de `security.trustedRemoteOrigins` de la
aplicación. Consulta la guía de [remotos en producción](../docs/production-remotes.md)
para CSP, CORS, rollback y límites de confianza.

## Desarrollo de la shell

La shell requiere Node.js 22 o una versión compatible con el toolchain actual.
Desde la raíz del monorepo instala sus dependencias de forma independiente:

```bash
npm --prefix open-mova-shell install
```

Después, ejecuta los comandos dentro de este proyecto:

```bash
cd open-mova-shell
npm start
npm run typecheck
npm run build
```

`npm start` sirve la shell en
[http://localhost:4200](http://localhost:4200). La shell no incluye ni inicia
microfrontales por sí misma. Para comprobar la integración local hay que
arrancar también un servidor remoto que coincida con el manifiesto; la demo del
monorepo se inicia desde la raíz con:

```bash
npm run start:demo
npm start
```

El comando anterior es una comodidad del monorepo. En una aplicación creada
con el CLI, `mova start` coordina la shell y los MFs declarados en su
configuración.

## Capacitor

`capacitor.config.ts` identifica la aplicación y apunta a `dist/browser`, donde
se genera la shell web. Cambia `appId` y `appName` antes de crear una aplicación
nativa propia. Los microfrontales siguen cargándose por HTTPS: sus ficheros no
se incluyen en la app nativa.

Desde este proyecto se pueden usar los comandos oficiales de Capacitor tras
compilar. Este flujo sirve para desarrollar la shell; en una aplicación creada
con Open Mova se recomienda usar los comandos equivalentes del CLI:

```bash
npm run build
npx cap add android     # o ios
npx cap sync android    # después de cada build o cambio de plugins
npx cap open android
```

Antes de sincronizar una app de producción, sustituye las URLs `localhost` del
manifiesto compilado por URLs HTTPS versionadas. En aplicaciones creadas con
Open Mova, `mova cap sync` hace esa sustitución a partir de `mova.config.json`.

La shell registra `NATIVE_CAPABILITIES` en `src/app/app.config.ts`. Una shell
nueva no instala plugins específicos. `mova cap enable camera` añade el
paquete necesario y regenera `native-capabilities.provider.ts` para importar
solo su adaptador. Las capacidades deshabilitadas conservan el contrato, pero
devuelven `isAvailable() === false` y un error accionable si se invocan.

La implementación de `src/native-capabilities/` usa los plugins oficiales de
Capacitor; el contrato y el token Angular viven en `@open-mova/core`.
La shell es quien proporciona las implementaciones reales por DI. El MF solo
inyecta el contrato de `@open-mova/core`, por lo que no importa Capacitor ni
necesita conocer cómo se ejecuta cada plugin.

Shell y MF comparten core como singleton de Native Federation; no se publica
ningún objeto global en `window`.
Camera funciona también en web, aunque depende de las capacidades del
navegador. En iOS hay que añadir a `Info.plist` los textos de uso
`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` y
`NSPhotoLibraryAddUsageDescription` antes de publicar. Los proyectos nativos
requieren las herramientas de Android Studio o Xcode, respectivamente.
Los servidores de los remotos deben permitir la carga desde el origen de la
WebView mediante CORS. Solo registra microfrontales de confianza: compartir
un token por DI no aísla permisos entre remotos en la misma página.

## Catálogo de capacidades

La shell contiene adaptadores para el catálogo oficial de Capacitor v8. Cada
adaptador vive en su propio directorio y
`native-capabilities.catalog.json` declara su paquete, versión, plataformas,
permisos y requisitos. El provider reúne solo los adaptadores habilitados en
un único objeto `NativeCapabilities`. El MF consume ese contrato a través de
`@open-mova/core`; nunca importa `@capacitor/*` ni accede a `window`.

El adaptador común ofrece `isAvailable()`, `invoke()` y `subscribe()` a todos
los plugins. La cámara y el dispositivo mantienen, además, sus atajos
`takePhoto()`, `choosePhoto()` y `getInfo()` para no complicar los casos más
frecuentes.

La superficie completa de métodos y eventos se declara una sola vez en
`@open-mova/core` mediante `NATIVE_CAPABILITY_API`. Google Maps utiliza un
adaptador específico porque su API crea mapas con estado: `create` registra la
instancia por `id` y las siguientes operaciones y suscripciones reciben ese
identificador en las opciones.

Aunque estén instalados, algunos plugins necesitan configuración específica de
la aplicación nativa antes de utilizarse: permisos de cámara, ubicación,
calendario, contactos, notificaciones o salud; credenciales para Google Maps;
y configuración del proveedor para Push Notifications. `npx cap sync` copia
los plugins a Android e iOS, pero no puede inventar esos permisos, claves ni
entitlements. Comprueba siempre `isAvailable()` y configura solo las
capacidades que la aplicación vaya a usar.
