# Publicación de Core y CLI en npm

`@open-mova/core` y `@open-mova/cli` se publican de forma independiente. El
workflow `.github/workflows/publish-npm.yml` se activa cuando la integración
continua de un `push` a `main` termina correctamente. Comprueba que el commit
validado sigue siendo la punta de `main` y ejecuta Core antes que CLI.

Para cada paquete, instala dependencias con su lockfile, ejecuta typecheck,
pruebas y build, y comprueba el tarball. Compara la versión del `package.json`
con npm:

- Si es nueva, publica y verifica la versión y el contenido descargado.
- Si ya existe con el mismo contenido, la omite (también en reintentos).
- Si ya existe con contenido distinto o es anterior a la versión más reciente,
  falla: hay que incrementar la versión del proyecto afectado.

El workflow no modifica versiones, lockfiles ni tags del framework. Una release
de `@open-mova` puede no publicar ningún paquete npm. Antes de fusionar cambios
de Core o CLI destinados a distribución, incrementa su versión semver,
actualiza el lockfile y la tabla de proyectos del README raíz. No cambies la
versión de un proyecto que no haya cambiado.

## Configuración inicial en npm

Necesitas permisos de mantenimiento sobre ambos paquetes npm. Una vez que el
workflow exista en la rama `main`, configura **por separado** en los ajustes
de [`@open-mova/core`](https://www.npmjs.com/package/@open-mova/core) y
[`@open-mova/cli`](https://www.npmjs.com/package/@open-mova/cli) un Trusted
Publisher de tipo GitHub Actions con estos datos:

| Campo                | Valor                  |
| -------------------- | ---------------------- |
| Organization or user | `rgarciadelongoria`    |
| Repository           | `open-mova`            |
| Workflow filename    | `publish-npm.yml`      |
| Environment name     | Vacío                  |
| Allowed action       | Permitir `npm publish` |

Escribe solo el nombre del fichero, no la ruta `.github/workflows/`. No hace
falta crear un token npm ni guardarlo como secret de GitHub. El job publicador
usa OIDC y requiere Node.js 24 y npm 11.5.1 o posterior. Configura el Trusted
Publisher en los **dos** paquetes antes de esperar una publicación correcta.
La primera ejecución después de subir este workflow puede fallar si todavía
no has terminado esa configuración; después podrás reintentarla.

## Verificación y recuperación

Consulta el resumen de la ejecución **Publicar paquetes npm** en GitHub Actions
y comprueba las versiones con:

```bash
npm view @open-mova/core version
npm view @open-mova/cli version
```

Si faltaba configurar el Trusted Publisher, complétalo y vuelve a ejecutar el
workflow fallido desde GitHub Actions. Las versiones ya publicadas con el mismo
contenido se omiten. Si Core se publicó y CLI falló, un reintento omite Core e
intenta CLI. Si el contenido cambió sin incrementar la versión del paquete,
prepara un nuevo commit con la versión y lockfile corregidos; npm no permite
sobrescribir una versión publicada. Si falló la CI, corrige el problema y
vuelve a subir el código a `main`.
