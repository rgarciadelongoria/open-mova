# Open Mova

Framework para aplicaciones web y móviles con Angular, Native Federation y
Capacitor. Cada aplicación tiene una shell técnica y carga microfrontales
**remotos**; no se empaquetan dentro de la shell. Este repositorio es un
monorepo Git, pero cada proyecto npm instala sus dependencias por separado.

## Proyectos

```text
open-mova/
├── open-mova-shell/        # Contenedor y capacidades nativas
├── open-mova-core/         # Contratos y acceso Angular por DI
├── open-mova-mf-template/  # Única fuente de microfrontal y demo local
└── open-mova-cli/          # Comandos mova
```

La shell y el microfrontal de referencia se descargan desde los tags estables
`vX.Y.Z` del repositorio al crear proyectos con el CLI. El perfil **demo**
incluye rutas `inicio`, `device` y `camera`; el perfil **minimal** deja solo
una ruta inicial. No hay plantillas Angular duplicadas dentro del CLI.

## Preparación

Requiere Node.js 22, npm y Git. Desde la raíz:

```bash
npm --prefix open-mova-core install
npm run build:core
npm --prefix open-mova-mf-template install
npm --prefix open-mova-shell install
npm --prefix open-mova-cli install
```

El `package.json` raíz solo coordina comandos; no tiene dependencias ni
`node_modules` propios.

## Demostración local

Inicia el microfrontal y la shell en terminales distintas:

```bash
npm run start:demo
```

```bash
npm start
```

Abre `http://localhost:4200/demo/inicio`, `/demo/device` o `/demo/camera`.
El remoto publica `remoteEntry.json` en el puerto 4300. La shell lee la URL
desde `open-mova-shell/src/assets/federation.manifest.json` y la ruta desde
`open-mova-shell/src/app/application.config.ts`. Esas entradas son solo para
el desarrollo de este monorepo; una app creada por el CLI recibe su propia
configuración en `mova.config.json`.

## Comandos de coordinación

| Comando | Función |
| --- | --- |
| `npm start` | Iniciar shell en 4200. |
| `npm run start:demo` | Iniciar remoto en 4300. |
| `npm run start:cli` | Ejecutar CLI en desarrollo. |
| `npm run typecheck` | Comprobar tipado de todos los proyectos. |
| `npm run build:core` | Compilar contratos. |
| `npm run build:shell` | Compilar shell. |
| `npm run build:demo` | Compilar microfrontal de referencia. |
| `npm run build:cli` | Compilar CLI. |

Consulta los README de cada proyecto para sus comandos y responsabilidades.
Para crear una aplicación o un microfrontal, empieza por
[`open-mova-cli/README.md`](open-mova-cli/README.md).

## Publicación de versiones

El CLI solo consume tags publicados. Tras modificar la shell, core o el
microfrontal de referencia, hay que publicar un nuevo tag estable para que
`mova create` y `mova mf create` puedan descargar ese código. Cada MF
generado registra el tag y commit de su origen en `mova.config.json`.
