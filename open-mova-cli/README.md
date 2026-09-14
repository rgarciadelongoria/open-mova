# Open Mova CLI

CLI para crear y mantener aplicaciones basadas en Open Mova. La herramienta se
ejecuta desde el terminal con el comando `mova`.

## Qué gestiona

El CLI crea una aplicación host descargando `open-mova-shell/` desde un tag del
repositorio público y mantiene su composición de microfrontales. Descarga
también `open-mova-mf-template/` para crear los MF y, en las versiones que lo
requieren, `open-mova-core/`. No contiene plantillas de código propias.

La fuente de configuración es `mova.config.json`. Al crear o registrar un
microfrontal, el CLI actualiza también estos ficheros de la shell:

- `src/assets/federation.manifest.json`: relaciona el remoto con su
  `remoteEntry.json` de desarrollo.
- `src/app/application.config.ts`: relaciona la URL pública con el remoto y
  sus rutas expuestas.

Por ese motivo, no hay que editar esos dos ficheros manualmente en una
aplicación creada por el CLI.

## Capacitor y microfrontales remotos

La aplicación creada incluye Capacitor en la shell. Antes de preparar Android
o iOS, cambia `appId` en `capacitor.config.ts` por el identificador definitivo
de tu aplicación. Publica cada microfrontal por separado y añade su URL HTTPS
versionada a `mova.config.json`. Al crear o registrar un MF puedes indicar
`--production-remote-entry https://cdn.example.com/home/1.0.0/remoteEntry.json`.
Para el MF `home` que se crea con la aplicación, añade la propiedad manualmente:

```json
{
  "name": "home",
  "remoteName": "home-microfrontend",
  "developmentRemoteEntry": "http://localhost:4300/remoteEntry.json",
  "productionRemoteEntry": "https://cdn.example.com/home/1.0.0/remoteEntry.json"
}
```

Esta entrada es un fragmento de `microfrontends`, no el fichero completo. El
CLI mantiene la URL local para `mova start`. Para preparar el proyecto nativo:

```bash
cd mi-aplicacion
mova cap add android      # compila la shell y crea android/
mova cap sync android     # recompila y sincroniza assets y plugins
mova cap open android     # abre Android Studio
```

Se puede usar `ios` en lugar de `android` en macOS con Xcode. El comando `sync`
sin plataforma sincroniza todas las plataformas ya añadidas. El CLI exige una
URL HTTPS para cada MF y escribe el manifiesto de producción solo en el
resultado compilado. No compila ni copia los MFs al paquete nativo; estos deben
estar publicados y accesibles en ejecución. Para Camera en iOS, añade a
`ios/App/App/Info.plist` textos de uso para cámara y fototeca antes de publicar.

## Desarrollo del CLI

Requiere Node.js 22 para las aplicaciones generadas con Capacitor 8.

```bash
cd open-mova-cli
npm install
npm run typecheck
npm run build
```

Para usar el comando `mova` durante el desarrollo desde cualquier directorio:

```bash
npm link
```

`npm link` crea un enlace local global; no publica el paquete en npm. Para
eliminarlo más tarde se puede ejecutar `npm unlink -g @open-mova/cli`.

## Comandos

### Crear una aplicación

Ejecuta el comando desde el directorio donde quieras crear el proyecto:

```bash
mova create mi-aplicacion
```

Requiere Git y acceso al repositorio. El CLI consulta los tags estables
`vMAJOR.MINOR.PATCH` y usa el más reciente por número de versión. No utiliza
la rama `main`. Para verlos o elegir uno:

```bash
mova shell versions
mova create mi-aplicacion --shell-version v0.1.4
```

La app guarda en `mova.config.json` la URL del repositorio, el tag y el commit
exacto de la shell descargada. El número de versión de la propia app en
`package.json` es independiente de la versión de la shell. El CLI no modifica
aplicaciones ya creadas cuando aparece un tag nuevo.

La aplicación creada contiene la shell en su propia raíz y un microfrontal
inicial llamado `home` dentro de `mfs/home`. Ambos proceden del mismo tag;
el CLI descarga también `core` para que los ejemplos nativos puedan compilar:

> Esta estructura corresponde a los tags cuya shell use `@open-mova/core`.

```text
mi-aplicacion/
├── src/                         # Shell técnica
├── mfs/
│   └── home/                    # Microfrontal inicial independiente
├── packages/
│   └── core/                    # Contrato y token de DI compartidos
├── mova.config.json             # Configuración de la composición
├── capacitor.config.ts          # Si la versión de shell incluye Capacitor
├── angular.json
└── package.json
```

Antes de arrancar hay que instalar las dependencias de cada proyecto:

```bash
cd mi-aplicacion
npm --prefix packages/core install
npm --prefix packages/core run build
npm install
npm --prefix mfs/home install
```

Para elegir un directorio concreto:

```bash
mova create mi-aplicacion --directory ../aplicaciones/mi-aplicacion
```

Para crear una shell sin microfrontal inicial:

```bash
mova create mi-aplicacion --empty
```

### Crear un microfrontal local

Ejecuta el comando desde la raíz de una aplicación Open Mova:

```bash
cd mi-aplicacion
mova mf create catalog
```

Por defecto se crea en `mfs/catalog`, se registra en la aplicación bajo la
ruta `/catalog` y utiliza el primer puerto libre desde el `4300`. El perfil
predeterminado es mínimo: una ruta inicial sin ejemplos ni dependencia de core.
El CLI descarga `open-mova-mf-template` desde el tag estable más reciente, o
desde el tag elegido con `--template-version vX.Y.Z`.

Se puede personalizar su ubicación, ruta o puerto:

```bash
mova mf create catalog \
  --directory ../provider-mf-catalog \
  --route productos \
  --port 4500
```

La ruta inicial del ejemplo anterior estaría en:

```text
/productos
```

Para crear otro microfrontal con los ejemplos `inicio`, `device` y `camera`,
usa `mova mf create catalog --demo`. Si la aplicación aún no tiene
`packages/core`, el CLI lo descarga del mismo tag. Antes de instalar ese MF,
compila core. El perfil
demo debe usar el mismo tag que la shell para mantener compatible el contrato.

### Registrar un microfrontal existente

Para vincular un proyecto local existente, indica su ruta desde la raíz de la
aplicación:

```bash
mova mf add ../provider-mf-catalog
```

El CLI comprueba que existe `package.json`, `angular.json` y
`federation.config.js`, e intenta leer de ellos el nombre remoto y el puerto.
Si hace falta, los valores se pueden indicar de forma explícita:

```bash
mova mf add ../provider-mf-catalog \
  --name catalog \
  --route productos \
  --remote catalog-microfrontend \
  --port 4500
```

Si el microfrontal ya está desplegado y no se quiere descargar su código
fuente, se registra directamente con la URL publicada:

```bash
mova mf add \
  --name catalog \
  --route productos \
  --remote catalog-microfrontend \
  --remote-entry https://cdn.example.com/catalog/remoteEntry.json
```

La URL del repositorio Git sirve para obtener el código fuente; la URL de
`remoteEntry.json` es la que utiliza la shell en tiempo de ejecución.

### Arrancar y compilar

Desde la raíz de la aplicación:

```bash
mova start
```

Inicia todos los microfrontales locales registrados y después la shell. Los
remotos registrados solo por URL se omiten, porque ya no tienen un proyecto
local que arrancar.

Para iniciar únicamente la shell:

```bash
mova start --shell-only
```

Para compilar los microfrontales locales y después la shell:

```bash
mova build
```

### Inspeccionar la aplicación activa

```bash
mova info
```

El CLI busca `mova.config.json` desde el directorio actual hacia sus
directorios padre. Por eso también funciona desde `mfs/catalog` y muestra la
aplicación a la que pertenece.

## Límites actuales

El CLI prepara Android/iOS cuando la versión de shell elegida incluye
Capacitor (`v0.1.2` en adelante). Los tags anteriores pueden crearse como
aplicaciones web, pero no disponen de los comandos móviles. El CLI aún no
actualiza automáticamente la shell de una aplicación existente ni publica
microfrontales.
