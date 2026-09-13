# Open Mova Core

`open-mova-core` es la librería base del framework. Su objetivo es contener
contratos, tipos y utilidades transversales que puedan utilizar la shell y los
microfrontales.

Actualmente está vacía de forma intencionada: `src/index.ts` solo deja
preparado el punto de entrada público.

## Qué debe contener

En el futuro podrá contener, por ejemplo:

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
