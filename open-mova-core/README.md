<p align="center">
  <img src="https://raw.githubusercontent.com/rgarciadelongoria/open-mova/main/assets/brand/open-mova-logo-title-rectangle.png" alt="Open Mova" width="720">
</p>

# Open Mova Core

`open-mova-core` es la librería base del framework. Su objetivo es contener
contratos, tipos y utilidades transversales que puedan utilizar la shell y los
microfrontales.

Define el contrato `NativeCapabilities` v1, el token de DI Angular y
`injectNativeCapabilities()`. No depende de Capacitor: los plugins reales solo
se instalan y se ejecutan dentro de la shell.

## Instalación

El microfrontal y la shell deben usar una versión compatible de Angular.

```bash
npm install @open-mova/core
```

## Qué debe contener

Puede contener, por ejemplo:

- Contratos para servicios comunes.
- Tipos de configuración compartidos.
- Interfaces para capacidades nativas.
- Utilidades que no pertenezcan a una aplicación concreta.

## Qué no debe contener

El core no debe incluir:

- Componentes ni lógica de interfaz de una aplicación.
- Dependencias de Capacitor.
- Lógica de negocio de un proveedor.
- Configuración de la shell.
- Código específico de un microfrontal.

La separación permite definir un contrato en el core y dejar que la shell
aporte su implementación. Por ejemplo, el core podría definir una interfaz de
almacenamiento y la shell implementarla más adelante con una API web o nativa.

## Desarrollo

Este proyecto es autónomo y tiene sus propias dependencias:

```bash
cd open-mova-core
npm install
npm run typecheck
npm run build
```

El paquete se identifica como `@open-mova/core`. Cuando se añada una pieza
pública, debe exportarse desde `src/index.ts`.

## Capacidades nativas

Cada plugin oficial se representa como una capacidad con tres operaciones
comunes:

- `isAvailable()` comprueba si el plugin está disponible en la plataforma.
- `invoke(nombre, opciones)` ejecuta una operación del plugin.
- `subscribe(evento, listener, contexto?)` registra un evento y devuelve un handle con
  `remove()` para cancelarlo.

`NATIVE_CAPABILITY_API` contiene la lista completa y versionada de operaciones
y eventos soportados. El microfrontal de demostración la reutiliza para que su
referencia interactiva no pueda quedarse desactualizada respecto al contrato.
El tercer argumento de `subscribe()` solo es necesario en capacidades con
instancias, como Google Maps, donde se pasa `{ id: 'mapa-principal' }`.

El contrato expone una capacidad por cada plugin oficial soportado:
`actionSheet`, `app`, `appLauncher`, `backgroundRunner`,
`barcodeScanner`, `browser`, `calendar`, `camera`, `clipboard`, `contacts`,
`cookies`, `device`, `dialog`, `fileTransfer`, `fileViewer`, `filesystem`,
`geolocation`, `googleMaps`, `haptics`, `healthFitness`, `http`,
`inAppBrowser`, `keyboard`, `localLlm`, `localNotifications`, `motion`,
`network`, `preferences`, `privacyScreen`, `pushNotifications`,
`screenOrientation`, `screenReader`, `share`, `splashScreen`, `statusBar`,
`systemBars`, `textZoom` y `toast`. La lista completa de métodos y eventos de
cada capacidad se encuentra en `NATIVE_CAPABILITY_API`.

Las opciones y el resultado no exponen tipos de Capacitor. Esto evita que el MF
se acople a su versión; algunas operaciones avanzadas pueden requerir valores
propios de plataforma, como `Date` o `Blob`. Las operaciones más estables y
habituales conservan métodos explícitos: `device.getInfo()`,
`camera.takePhoto()` y `camera.choosePhoto()`.
