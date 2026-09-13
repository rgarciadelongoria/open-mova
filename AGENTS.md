# Guía de mantenimiento de Open Mova

## Estructura del monorepo

- `open-mova-shell/` contiene el workspace Angular, la shell técnica y las plantillas de microfrontales.
- `open-mova-cli/` contiene el CLI de Open Mova.
- La raíz contiene solo configuración compartida del monorepo, documentación y automatizaciones comunes.

## Principios

- Mantener un único repositorio Git en la raíz; los proyectos internos no deben tener directorios `.git` propios.
- Mantener `open-mova-shell` y `open-mova-cli` como proyectos npm autónomos, cada uno con su `package.json`, `package-lock.json` y `node_modules`.
- Mantener las dependencias y los comandos específicos dentro del proyecto que los necesita.
- No introducir lógica Angular en la raíz ni lógica de la shell en el CLI.
- Actualizar el README raíz cuando cambie la forma de preparar o ejecutar el monorepo.

## Estilo y verificación

- Usar código explícito, formateado y fácil de mantener.
- Escribir comentarios breves solo cuando expliquen una decisión que no sea evidente.
- Ejecutar las comprobaciones relevantes desde la raíz antes de finalizar un cambio transversal.
- No incluir secretos ni artefactos generados en Git. La raíz no debe tener dependencias ni `node_modules` propios.
