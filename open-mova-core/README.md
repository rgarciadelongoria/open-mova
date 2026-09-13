# Open Mova Core

`open-mova-core` es la librería base del framework. Su objetivo es contener
contratos, tipos y utilidades transversales que puedan utilizar la shell y los
microfrontales.

Actualmente define el contrato `NativeCapabilities` v1 para Device y Camera,
sin depender de Angular ni de Capacitor.

## Qué debe contener

Puede contener, por ejemplo:

- Contratos para servicios comunes.
- Tipos de configuración compartidos.
- Interfaces para capacidades nativas.
- Utilidades que no pertenezcan a una aplicación concreta.

## Qué no debe contener

El core no debe incluir:

- Componentes ni lógica de interfaz Angular.
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

Un microfrontal puede consultar las capacidades que publica la shell:

```ts
import { getNativeCapabilities } from '@open-mova/core';

const device = await getNativeCapabilities().device.getInfo();
const photo = await getNativeCapabilities().camera.takePhoto();
const selected = await getNativeCapabilities().camera.choosePhoto();
```

`photo.webPath` sirve para mostrar la imagen; `photo.uri` puede existir en
móvil. `choosePhoto()` devuelve `undefined` si la galería devuelve una lista
vacía; cancelar el diálogo puede rechazar la promesa según la plataforma.
El método lanza un error claro si la shell no publica el contrato v1. El MF
necesita declarar `@open-mova/core` como dependencia; en este monorepo se puede
instalar desde su ruta local tras compilar core. Para proveedores externos,
el paquete tendrá que publicarse en un registro accesible.
