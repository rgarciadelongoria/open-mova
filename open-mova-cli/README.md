# Open Mova CLI

CLI para crear y mantener aplicaciones basadas en Open Mova. Forma parte del monorepo `open-mova`.

## Estado actual

Este repositorio contiene el esqueleto inicial del CLI. Solo incluye el comando `info`, que muestra la carpeta actual y comprueba si contiene un workspace Angular. Todavía no crea aplicaciones ni descarga plantillas.

## Desarrollo

Requiere Node.js 20 o posterior.

```bash
# Desde la raíz del monorepo
npm --prefix open-mova-cli install
npm run start:cli -- info
npm run typecheck
npm run build:cli
```

También se puede probar contra una carpeta concreta cambiando primero el directorio:

```bash
cd /ruta/a/una/aplicacion
/ruta/a/open-mova/node_modules/.bin/tsx /ruta/a/open-mova/open-mova-cli/src/cli.ts info
```

## Estructura

- `src/cli.ts`: punto de entrada y configuración general del programa.
- `src/commands/`: un archivo por comando para mantener cada responsabilidad aislada.
- `dist/`: salida compilada, no incluida en Git.

El siguiente comando natural será `mova create`, que generará una aplicación a partir de una plantilla versionada del framework.
