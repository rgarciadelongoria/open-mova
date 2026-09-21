# Guía de mantenimiento de Open Mova

## Estructura del monorepo

- `open-mova-shell/` contiene únicamente el workspace Angular y la shell técnica.
- `open-mova-core/` contiene la librería base y sus contratos reutilizables.
- `open-mova-cli/` contiene el CLI de Open Mova.
- `open-mova-mf-template/` es la única fuente del microfrontal de referencia; el CLI aplica un perfil demo o mínimo.
- `tooling/` contiene exclusivamente herramientas internas de calidad y pruebas end-to-end.
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

## Versionado y publicaciones

- La versión de `package.json` en la raíz es la versión del **framework** o
  workspace. Toda release incrementa esta versión y crea un tag Git anotado
  exactamente igual, con el formato `vX.Y.Z`.
- El tag del framework es la fuente que consulta el CLI para descargar shell y
  template. Una release puede cambiar shell, template, configuración o
  documentación aunque no publique ningún paquete npm.
- No sincronizar mecánicamente las versiones de todos los proyectos con la
  versión del workspace.
- `@open-mova/core` tiene versión propia y solo se incrementa y publica en npm
  cuando cambia su API, contrato o comportamiento distribuido.
- `@open-mova/cli` tiene versión propia y solo se incrementa y publica en npm
  cuando cambia el comportamiento de la herramienta de terminal.
- Los `package.json` de shell y template se incrementan únicamente cuando
  cambia su propio proyecto; no se publican en npm.
- Antes de una release, identificar los proyectos afectados y elegir para cada
  uno su incremento semver. Actualizar sus lockfiles cuando cambie la versión
  de ese paquete.
- Siempre que se solicite subir la versión del framework, revisar todos los
  `VERSIONS.md` del repositorio y actualizar las versiones de dependencias y
  proyectos que hayan cambiado. La tabla del README raíz debe reflejar siempre
  las versiones actuales del framework y de cada proyecto, sin incrementar
  versiones de proyectos que no hayan sido afectados.
- Una versión de framework no obliga a publicar core ni CLI. Del mismo modo,
  no publicar una versión de npm vacía solo para igualarla al tag del
  workspace.

## Estilo y verificación

- Usar código explícito, formateado y fácil de mantener.
- Escribir comentarios breves solo cuando expliquen una decisión que no sea evidente.
- Ejecutar las comprobaciones relevantes desde la raíz antes de finalizar un cambio transversal.
- No incluir secretos ni artefactos generados en Git. La raíz no debe tener dependencias ni `node_modules` propios.

## Interfaz del CLI

- Centralizar la presentación de terminal en `open-mova-cli/src/ui/terminal.ts`; no introducir secuencias ANSI ni estilos aislados en cada comando.
- Usar una jerarquía coherente: encabezado para una operación, éxito para acciones completadas, información para progreso, aviso para decisiones o requisitos y error para fallos.
- Respetar `NO_COLOR`, terminales no interactivos y `TERM=dumb`. Las salidas que deban ser procesables, como `mova config show`, deben conservar JSON puro en `stdout`.
- Antes de una operación de actualización que escriba archivos, mostrar el plan, advertir que se cree un commit o rama segura y pedir confirmación explícita. `--yes` queda reservado para automatizaciones controladas.

## Gestión de issues

- Cuando se solicite implementar una issue, leer primero su descripción y comentarios en GitHub.
- Tras implementar, verificar y subir la solución, comentar la issue con un resumen, el commit y el tag o publicación npm cuando corresponda.
- Cerrar la issue después de publicar la solución. Si queda bloqueada o requiere una decisión del usuario, mantenerla abierta y explicar el motivo.
