<p align="center">
  <img src="https://raw.githubusercontent.com/rgarciadelongoria/open-mova/main/assets/brand/open-mova-logo-title-rectangle.png" alt="Open Mova" width="720">
</p>

<div align="center">

| Dependencia | Versión                 |
| ----------- | ----------------------- |
| Node.js     | 22 o posterior          |
| npm         | 10 o posterior          |
| Angular     | `^21.2.23`              |
| TypeScript  | `^5.9.3`                |
| Capacitor   | No depende directamente |

</div>

# Open Mova Core

`open-mova-core` es la librería base del framework. Su objetivo es contener
contratos, tipos y utilidades transversales que puedan utilizar la shell y los
microfrontales.

Define el contrato `NativeCapabilities` v1, el token de DI Angular y
`injectNativeCapabilities()`. No depende de Capacitor: los plugins reales solo
se instalan y se ejecutan dentro de la shell.

También define el contrato de compatibilidad de los microfrontales y el formato
de su manifiesto. Core describe la API pública; la aplicación decide qué
capacidades instala y el CLI prepara la shell para ellas.

## Instalación

El microfrontal y la shell deben usar una versión compatible de Angular.

```bash
npm install @open-mova/core
```

## Desarrollo

Este proyecto es autónomo y tiene sus propias dependencias:

```bash
cd open-mova-core
npm install
npm run typecheck
npm run build
```

El paquete se identifica como `@open-mova/core`. Los contratos generales se
exportan desde `src/index.ts`. Los componentes Angular de carga remota tienen
una entrada independiente (`@open-mova/core/remote-components`) para mantener
los contratos utilizables también en herramientas Node sin compilación Angular.

## Componentes remotos

`MovaRemoteComponent` muestra un componente expuesto por un microfrontal remoto.
La shell proporciona mediante DI el `REMOTE_COMPONENT_RESOLVER`, que valida y
carga el remoto. El componente contenedor admite entradas, emite sus salidas y
muestra estados de carga y error. Core no conoce el significado de esos datos:
los contratos de negocio pertenecen a cada aplicación.

Importa el componente desde la entrada Angular específica y colócalo en la
plantilla del anfitrión:

```ts
import { Component } from '@angular/core';
import {
  MovaRemoteComponent,
  type RemoteComponentEvent,
} from '@open-mova/core/remote-components';

@Component({
  standalone: true,
  imports: [MovaRemoteComponent],
  template: `
    <mova-remote-component
      name="catalog.ficha"
      [inputs]="{ productId: 'sku-123' }"
      (remoteEvent)="onRemoteEvent($event)"
    />
  `,
})
export class CatalogPage {
  onRemoteEvent(event: RemoteComponentEvent): void {
    // El formato y significado del evento los acuerdan los proyectos de la app.
  }
}
```

`name` combina el nombre del MF registrado y el alias del componente. `inputs`
se asigna a los inputs Angular del componente remoto; sus outputs se reenvían
como `{ name, value }` por `remoteEvent`. El anfitrión registra previamente el
remoto y el alias con `mova mf add` o `mova mf component add`. La shell aporta
el resolver; no se importa código de Capacitor ni se define un contrato de
negocio en Core.

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

Que una capacidad forme parte del contrato no significa que esté instalada en
todas las aplicaciones. Una aplicación nueva puede empezar con:

```json
{
  "native": {
    "capabilities": []
  }
}
```

Cuando el proveedor activa una capacidad con `mova cap enable camera`, el CLI
instala el plugin correspondiente y la shell proporciona su implementación.
Si la capacidad no está activada, sigue existiendo en el contrato para que la
API sea estable, pero `isAvailable()` devuelve `false` y sus operaciones
informan de cómo habilitarla. El microfrontal no debe importar directamente
ningún paquete `@capacitor/*`.

Las opciones y el resultado no exponen tipos de Capacitor. Esto evita que el MF
se acople a su versión; algunas operaciones avanzadas pueden requerir valores
propios de plataforma, como `Date` o `Blob`. Las operaciones más estables y
habituales conservan métodos explícitos: `device.getInfo()`,
`camera.takePhoto()` y `camera.choosePhoto()`.

La shell y los microfrontales comparten Core como singleton mediante Native
Federation. Por eso los contratos deben ser pequeños, estables y compatibles
con versiones anteriores siempre que sea posible. Un cambio incompatible
requiere aumentar la versión del contrato y coordinar la versión de Core con
la shell y los microfrontales que lo consuman.
