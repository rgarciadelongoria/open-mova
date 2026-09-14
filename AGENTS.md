# Guía de mantenimiento de Open Mova

## Estructura del monorepo

- `open-mova-shell/` contiene únicamente el workspace Angular y la shell técnica.
- `open-mova-core/` contiene la librería base y sus contratos reutilizables.
- `open-mova-cli/` contiene el CLI de Open Mova.
- `open-mova-mf-template/` es la única fuente del microfrontal de referencia; el CLI aplica un perfil demo o mínimo.
- La raíz contiene solo configuración compartida del monorepo, documentación y automatizaciones comunes.

## Principios

- Mantener un único repositorio Git en la raíz; los proyectos internos no deben tener directorios `.git` propios.
- Mantener `open-mova-shell` y `open-mova-cli` como proyectos npm autónomos, cada uno con su `package.json`, `package-lock.json` y `node_modules`.
- Mantener las dependencias y los comandos específicos dentro del proyecto que los necesita.
- No introducir lógica Angular en la raíz ni lógica de la shell en el CLI.
- El core puede depender de Angular, pero no de Capacitor ni de un microfrontal concreto.
- Compartir `@open-mova/core` como singleton en Native Federation; la shell proporciona el token nativo por DI, sin globals en `window`.
- La shell de `open-mova-shell/` es la única fuente de su código; el CLI la descarga de tags estables del repositorio y no mantiene una plantilla de shell.
- Al crear una aplicación, guardar el tag y el commit de la shell para que su origen quede identificado.
- Open Mova siempre utilizará microfrontales remotos mediante Native Federation.
- No implementar un modo monolítico ni empaquetar los microfrontales dentro de la shell.
- En aplicaciones Capacitor, la shell seguirá cargando los microfrontales desde sus URLs remotas.
- Actualizar el README raíz cuando cambie la forma de preparar o ejecutar el monorepo.

## Estilo y verificación

- Usar código explícito, formateado y fácil de mantener.
- Escribir comentarios breves solo cuando expliquen una decisión que no sea evidente.
- Ejecutar las comprobaciones relevantes desde la raíz antes de finalizar un cambio transversal.
- No incluir secretos ni artefactos generados en Git. La raíz no debe tener dependencias ni `node_modules` propios.
