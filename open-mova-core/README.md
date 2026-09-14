# Open Mova Core

`open-mova-core` es la librería base del framework. Su objetivo es contener
contratos, tipos y utilidades transversales que puedan utilizar la shell y los
microfrontales.

Actualmente define el contrato `NativeCapabilities` v1 para Device y Camera,
el token de DI Angular y `injectNativeCapabilities()`. No depende de Capacitor.

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

La shell proporciona el token `NATIVE_CAPABILITIES` y el MF accede a él por DI:

```ts
import { injectNativeCapabilities } from '@open-mova/core';

const native = injectNativeCapabilities(); // Dentro de un contexto de inyección Angular.
const device = await native.device.getInfo();
const photo = await native.camera.takePhoto();
const selected = await native.camera.choosePhoto();
```

`photo.webPath` sirve para mostrar la imagen; `photo.uri` puede existir en
móvil. `choosePhoto()` devuelve `undefined` si la galería devuelve una lista
vacía; cancelar el diálogo puede rechazar la promesa según la plataforma.
Angular muestra un error de provider ausente si la shell no ofrece el contrato.
Los MF que usan capacidades nativas dependen de `@open-mova/core`; en el
monorepo se instala por ruta local tras compilar la librería. Shell y MF deben
compartir una sola instancia de core mediante Native Federation.
