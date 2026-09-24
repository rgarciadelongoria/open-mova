<p align="center">
  <img src="https://raw.githubusercontent.com/rgarciadelongoria/open-mova/main/assets/brand/open-mova-logo-title-rectangle.png" alt="Open Mova" width="720">
</p>

<div align="center">

| Dependencia | Versión        |
| ----------- | -------------- |
| Node.js     | 22 o posterior |
| npm         | 10 o posterior |
| TypeScript  | `^5.9.3`       |
| Commander   | `^14.0.0`      |
| semver      | `^7.8.5`       |

</div>

# Open Mova CLI

CLI de terminal para crear y mantener aplicaciones Open Mova. Se ejecuta desde la raíz de cada aplicación con el comando `mova`.

El CLI descarga la shell y la plantilla de microfrontales desde tags estables
del repositorio de Open Mova. Core se instala desde npm como dependencia de la
shell y de cada MF. Cada aplicación guarda en `mova.config.json` el tag y el
commit con los que fue creada.

Las aplicaciones nuevas empiezan sin plugins específicos de Capacitor. Solo se
instalan cuando se habilita explícitamente una capacidad con `mova cap enable`.

## Índice de comandos

- [`mova --help` y `mova --version`](#mova---help-y-mova---version)
- [`mova create`](#mova-create)
- [`mova config`](#mova-config)
- [`mova config show`](#mova-config-show)
- [`mova config validate`](#mova-config-validate)
- [`mova mf`](#mova-mf)
- [`mova mf create`](#mova-mf-create)
- [`mova mf add`](#mova-mf-add)
- [`mova mf component add`](#mova-mf-component-add)
- [`mova mf build`](#mova-mf-build)
- [`mova mf deploy`](#mova-mf-deploy)
- [`mova mf update`](#mova-mf-update)
- [`mova start`](#mova-start)
- [`mova build`](#mova-build)
- [`mova info`](#mova-info)
- [`mova doctor`](#mova-doctor)
- [`mova update`](#mova-update)
- [`mova shell`](#mova-shell)
- [`mova shell versions`](#mova-shell-versions)
- [`mova cap`](#mova-cap)
- [`mova cap list`](#mova-cap-list)
- [`mova cap enable`](#mova-cap-enable)
- [`mova cap disable`](#mova-cap-disable)
- [`mova cap doctor`](#mova-cap-doctor)
- [`mova cap permissions`](#mova-cap-permissions)
- [`mova cap add`](#mova-cap-add)
- [`mova cap sync`](#mova-cap-sync)
- [`mova cap open`](#mova-cap-open)

## Instalación

Requiere Node.js 22 o posterior.

```bash
npm install --global @open-mova/cli
mova --help
```

## Instalación para desarrollar el CLI

Requiere Node.js 22.

```bash
cd open-mova-cli
npm install
npm run typecheck
npm run build
npm link
```

`npm link` enlaza la versión local del comando `mova`; no publica el paquete.
La [guía de publicación npm](../docs/npm-publishing.md) explica la publicación
automática tras una CI correcta en `main`.

## Comandos

### `mova --help` y `mova --version`

Muestra la ayuda del CLI o la versión instalada.

```bash
mova --help
mova --version
mova mf --help
mova cap --help
```

#### Parámetros

- `--help`: muestra los comandos y opciones disponibles. También puede usarse
  en un grupo, por ejemplo `mova mf --help`.
- `--version`: muestra la versión instalada del CLI.

### `mova create`

Crea una aplicación completa. Descarga una shell versionada y genera dos MF
desde la misma plantilla: `mfs/home` (rutas y ejemplos) y `mfs/calculator`
(solo el componente de calculadora). La aplicación se crea sin plugins específicos de Capacitor;
activa solo los que necesites con `mova cap enable`.

Ambos MF incluyen por defecto la URL HTTPS de su demo oficial publicada en
GitHub Pages. Esto permite probar la aplicación compilada sin desplegar los
remotos propios. Sustituye esas URLs antes de publicar una aplicación real.

```bash
mova create mi-aplicacion
mova create mi-aplicacion --directory ../apps/mi-aplicacion
mova create mi-aplicacion --shell-version v0.1.9
mova create mi-aplicacion --empty
```

#### Parámetros

- `<name>`: nombre de la aplicación nueva. Se usa para identificarla y, por
  defecto, también como nombre del directorio que se crea.
- `-d, --directory <path>`: ubicación donde crearla. Puede ser una ruta
  relativa al directorio actual o una ruta absoluta; el directorio de destino
  no debe existir ya.
- `--shell-version <tag>`: tag estable de la shell que se descargará, por
  ejemplo `v0.2.19`. Si se omite, se elige el tag estable más reciente.
- `--empty`: crea solo la shell, sin los MF `home` y `calculator` de ejemplo.

Al terminar, el CLI muestra los comandos siguientes y pregunta si quieres instalar
las dependencias ahora. La opción por defecto es **No**: pulsa Enter para salir
sin instalar nada. Si respondes Sí, ejecuta `npm install` en la aplicación y,
salvo con `--empty`, también en `mfs/home` y `mfs/calculator`. En terminales no interactivos omite
la pregunta y la instalación. Si falla una instalación, la aplicación queda
creada y el CLI indica el comando para reanudarla manualmente.

### `mova config`

Consulta la configuración efectiva de la aplicación sin editar los ficheros
TypeScript generados por el CLI.

```bash
mova config
mova config show
mova config validate
```

`show` imprime el contenido validado de `mova.config.json`. `validate` confirma
el esquema que utiliza el CLI e informa de las migraciones que se aplicarían al
ejecutar `mova update`, sin modificar archivos.

#### Parámetros

`mova config`, `mova config show` y `mova config validate` no reciben
parámetros. `show` y `validate` son subcomandos; se pueden consultar con
`mova config --help`.

### `mova mf`

Es el grupo de comandos para crear y registrar microfrontales en la aplicación.
Usa `mova mf --help` para consultar sus subcomandos.

#### Parámetros

No recibe parámetros propios; elige un subcomando como `create`, `add`,
`component add`, `update`, `build` o `deploy`.

### `mova mf create`

Crea un microfrontal local, lo registra y actualiza la configuración de federación de la shell.

```bash
cd mi-aplicacion
mova mf create catalog
mova mf create catalog --route productos --port 4500
mova mf create catalog --routes-only --route productos
mova mf create catalog --component-only --component-name ficha
mova mf create catalog --component-name ficha
mova mf create catalog --directory ../provider-mf-catalog
mova mf create catalog --demo
```

#### Parámetros

- `<name>`: nombre del MF que se creará y registrará en la aplicación.
- `-d, --directory <path>`: carpeta de destino relativa a la raíz de la
  aplicación. Por defecto es `mfs/<name>`.
- `--route <path>`: ruta pública para cargar las rutas del MF desde la shell.
  Si se omite en el perfil mínimo, se usa el nombre del MF.
- `--port <number>`: puerto de desarrollo del MF local. Si se omite, el CLI
  selecciona uno libre a partir del puerto `4300`.
- `--production-remote-entry <url>`: URL HTTPS de `remoteEntry.json` que se
  usará como remoto de producción.
- `--template-version <tag>`: tag del framework del que descargar la plantilla
  del MF. Si se omite, se selecciona el tag estable más reciente; con `--demo`
  se usa por defecto la versión de la shell de esta aplicación.
- `--demo`: crea el perfil de demostración en vez del perfil mínimo. Debe usar
  el mismo tag que la shell y no se combina con las opciones de perfil mínimo.
- `--routes-only`: crea únicamente la exposición de rutas; no se combina con
  `--component-only` ni con `--component-name`.
- `--component-only`: crea únicamente un componente, sin ruta pública. No se
  combina con `--routes-only` ni con `--route`.
- `--component-name <name>`: nombre del componente de inicio y su alias en el
  MF. Por ejemplo, `ficha` genera el alias `catalog.ficha` y la exposición
  `./Ficha`; solo se aplica al perfil mínimo que incluye componentes.

Por defecto se crea en `mfs/catalog`, con una ruta `/catalog` y un componente
Angular mínimo `catalog.main`, en un puerto libre desde `4300`.
`--routes-only` genera únicamente rutas; `--component-only` genera únicamente
el componente, sin ruta pública. `--route` cambia el nombre de la ruta cuando
existe; `--component-name` cambia el nombre, alias y módulo del componente
(por ejemplo, `ficha` produce `catalog.ficha` y `./Ficha`). No combines
`--route` con `--component-only` ni `--component-name` con `--routes-only`.

`--demo` usa las páginas de
demostración de capacidades nativas y el ejemplo anfitrión de componente
remoto; para que este último cargue, la aplicación debe tener registrado el MF
que expone el alias `calculator.main` (por ejemplo, el que genera `mova create`).
El perfil demo no se combina con `--routes-only`, `--component-only` ni
`--component-name`.
`--template-version <tag>` permite elegir una versión de la plantilla que
incluya el perfil solicitado; los tags antiguos solo admiten `--routes-only`.

Los ejemplos mínimos no contienen lógica de negocio. Puedes añadir otras
exposiciones más adelante con `mova mf component add`. Si ya tienes un
proveedor local o publicado, regístralo con `mova mf add`.

### `mova mf add`

Registra un microfrontal existente, sin crearlo de nuevo.

#### Parámetros

- `[source-path]`: ruta a un MF local ya creado, relativa a la raíz de la
  aplicación (o absoluta). Omítela cuando registres un MF publicado por URL.
- `--name <name>`: nombre con el que se registra en `mova.config.json`. Es
  necesario si no se puede inferir de `source-path`.
- `--route <path>`: ruta que la shell usará para cargar las rutas expuestas. Se
  omite para registrar un MF solo de componentes.
- `--remote <name>`: nombre del remoto tal como aparece en
  `federation.config.js` del proveedor.
- `--remote-entry <url>`: URL de `remoteEntry.json`; úsala para un proveedor
  remoto sin proyecto local.
- `--port <number>`: puerto donde se ejecuta el proyecto local durante
  `mova start`.
- `--production-remote-entry <url>`: URL HTTPS de producción que se usa al
  compilar con `mova build --production`.
- `--core-version <range>`: rango semver de `@open-mova/core` que necesita un
  remoto sin proyecto local. En un MF local el CLI lo obtiene del proyecto.
- `--component <alias=module>`: registra un módulo de componente expuesto por
  el proveedor, por ejemplo `ficha=./ProductCard`. Se puede repetir para
  registrar varios componentes.

```bash
mova mf add ../provider-mf-catalog
mova mf add ../provider-mf-catalog --name catalog --route productos \
  --remote catalog-microfrontend --port 4500
```

Para registrar solo un MF ya publicado:

```bash
mova mf add --name catalog --route productos \
  --remote catalog-microfrontend \
  --remote-entry https://cdn.example.com/catalog/remoteEntry.json
```

El CLI actualiza `mova.config.json`, `src/assets/federation.manifest.json` y `src/app/application.config.ts`.

Un remoto puede exponer rutas, componentes o ambas cosas; no son tipos
excluyentes. Para registrar un proveedor **solo de componentes**, omite
`--route` y declara al menos un alias:

```bash
mova mf add ../provider-calculator --name calculator --component main=./Calculator
mova mf add --name calculator --remote calculator-microfrontend \
  --remote-entry https://cdn.example.com/calculator/remoteEntry.json \
  --core-version '^0.2.6' --component main=./Calculator
```

Para registrar un remoto **con rutas y componentes**, añade `--route <ruta>`
al comando y declara uno o más alias `--component`. El MF debe exponer
efectivamente `./Routes` y cada módulo indicado en su `federation.config.js`.

```bash
mova mf add ../provider-catalog --name catalog --route productos \
  --component ficha=./ProductCard
```

En el código Angular anfitrión, importa `MovaRemoteComponent` desde
`@open-mova/core/remote-components` y úsalo en una plantilla, por ejemplo:

```html
<mova-remote-component
  name="catalog.ficha"
  [inputs]="{ productId: 'sku-123' }"
  (remoteEvent)="onRemoteEvent($event)"
/>
```

El anfitrión recibe los outputs del componente como eventos `{ name, value }`.
Core proporciona el contenedor y su contrato; el formato y significado de los
datos intercambiados siguen siendo responsabilidad de la aplicación.

Para un MF remoto que no tenga un proyecto local, declara explícitamente su
rango de Core:

```bash
mova mf add --name catalog --route catalog \
  --remote catalog-microfrontend \
  --remote-entry https://cdn.example.com/catalog/remoteEntry.json \
  --core-version '^0.2.2'
```

### `mova mf component add`

Añade un alias de componente a un MF ya registrado, sin registrar otro remoto:

```bash
mova mf component add catalog ficha --module ./ProductCard
```

El consumidor usará `catalog.ficha`; el módulo debe estar expuesto por el MF.
Los datos de negocio que intercambian los componentes pertenecen a tu app, no
a Core.

#### Parámetros

- `<mf>`: nombre del MF que ya está registrado en la aplicación.
- `<alias>`: nombre local para referirse al componente; el consumidor lo usa
  como `<mf>.<alias>`.
- `--module <module>`: exposición del componente en el proveedor, por ejemplo
  `./ProductCard`. Debe coincidir con un módulo expuesto por su
  `federation.config.js`.

### `mova mf update`

Actualiza un MF local que fue creado desde una plantilla de Open Mova. Compara
la plantilla original, el proyecto actual y la nueva versión en tres pasos:
solo aplica cambios que no hayan sido personalizados y deja los conflictos
para revisión.

```bash
mova mf update home --check
mova mf update home --to v0.2.2
```

#### Parámetros

- `<name>`: nombre del MF local que se va a actualizar.
- `--check`: calcula y muestra el plan y los posibles conflictos, pero no
  modifica archivos.
- `--to <tag>`: versión concreta de la plantilla a la que actualizar. Si se
  omite, el CLI elige la versión estable más reciente.

El comando conserva el nombre, la ruta (si existe), el puerto, el perfil y las
dependencias propias del proveedor. Si cambia `package.json`, elimina el
lockfile para que ejecutes `npm install` en el MF.

### `mova mf build`

Compila únicamente un MF local y comprueba que Native Federation haya generado
`dist/browser/remoteEntry.json`.

```bash
mova mf build home
mova mf build calculator
```

#### Parámetros

- `<name>`: nombre del MF local registrado que se compilará.

No compila la shell. Es útil para validar o preparar el artefacto de un
proveedor de forma independiente. Un MF registrado solo por URL remota no se
puede compilar desde la aplicación.

### `mova start`

Arranca los MFs locales registrados y después la shell. Los MFs configurados solo con una URL remota no se arrancan localmente.

```bash
mova start
mova start --shell-only
```

#### Parámetros

- `--shell-only`: inicia únicamente la shell. Sin esta opción, `mova start`
  inicia también todos los MF registrados que tengan un directorio local; los
  remotos registrados solo mediante URL no se arrancan.

### `mova build`

Compila los microfrontales locales y la shell. Con `--production`, exige URLs
HTTPS versionadas y orígenes de confianza, y deja el manifiesto de producción
en `dist/browser`.

```bash
mova build
mova build --production
```

#### Parámetros

- `--production`: además de compilar los MF locales y la shell, escribe en el
  artefacto final el manifiesto con las URLs HTTPS de producción y valida los
  orígenes de confianza. Sin esta opción, usa la configuración de desarrollo.

Consulta la guía de [remotos en producción](../docs/production-remotes.md)
antes de desplegar la shell.

### `mova mf deploy`

Genera el artefacto de un MF local para que el CI de su proveedor lo publique.
No elige CDN, hosting ni modifica la URL de producción de la aplicación.

```bash
mova mf deploy home
mova mf deploy calculator
```

#### Parámetros

- `<name>`: nombre del MF local que se compilará y preparará para publicar.

El comando compila cada MF y deja el resultado en `mfs/<nombre>/dist/browser` junto
con `open-mova-deployment.json`. El pipeline debe publicar **todo** ese
directorio, conservando los nombres de los assets y de `remoteEntry.json`.
Después se registra la URL HTTPS versionada resultante como
`productionRemoteEntry` en `mova.config.json`.

### `mova info`

Muestra la aplicación detectada, la versión de shell y sus microfrontales. También funciona desde subdirectorios como `mfs/catalog`.

```bash
mova info
```

#### Parámetros

No recibe parámetros. Busca la aplicación desde el directorio actual y también
puede ejecutarse desde un subdirectorio de la aplicación.

### `mova doctor`

Diagnostica el entorno de desarrollo y la aplicación encontrada desde el
directorio actual. Comprueba las herramientas básicas, las dependencias, la
configuración de la shell y los microfrontales, las URLs de producción y la
compatibilidad de Core.

Si la aplicación contiene plataformas Capacitor, también revisa los
requisitos disponibles de Android o iOS, como el SDK, `adb`, emuladores,
Xcode, CocoaPods, claves y descripciones de permisos.

```bash
mova doctor
```

#### Parámetros

No recibe parámetros. El diagnóstico se basa en el entorno y la aplicación que
encuentra desde el directorio actual.

Los avisos informan de elementos opcionales o todavía no configurados. Los
errores hacen que el comando termine con un código distinto de cero, por lo
que también puede utilizarse en scripts de validación.

### `mova update`

Actualiza los archivos técnicos de la shell usando como referencia el tag con
el que se creó la aplicación. No modifica los microfrontales ni sobrescribe
archivos personalizados: los muestra como conflictos.

```bash
mova update --check
mova update
mova update --to v0.2.0
mova update --yes
```

#### Parámetros

- `--check`: muestra el plan, migraciones y conflictos sin escribir archivos.
- `--to <tag>`: selecciona el tag estable de shell al que actualizar. Si se
  omite, se usa el último tag disponible.
- `-y, --yes`: aplica el plan sin pedir confirmación interactiva. Resérvalo
  para automatizaciones controladas; no evita la comprobación de conflictos ni
  el requisito de Git limpio.

`--check` solo muestra el plan. Para aplicar cambios, el proyecto debe estar en
un repositorio Git limpio. Si cambia `package.json`, el CLI elimina el lockfile
obsoleto y pide ejecutar `npm install`; después se debe comprobar con
`mova build`. Antes de escribir archivos, el CLI muestra un aviso y pide
confirmación para que guardes el estado actual en un commit o rama segura.
`--yes` omite la pregunta únicamente para automatizaciones controladas.

### `mova shell versions`

Lista los tags estables disponibles para crear aplicaciones.

```bash
mova shell versions
```

#### Parámetros

No recibe parámetros. Lista los tags estables que el CLI puede usar para crear
o actualizar una aplicación.

### `mova shell`

Es el grupo de comandos relacionado con las versiones de la shell. Actualmente
su subcomando disponible es `mova shell versions`.

#### Parámetros

No recibe parámetros propios; usa el subcomando `versions` para consultar los
tags estables.

### `mova cap add`

Compila la shell, añade una plataforma nativa y aplica su configuración inicial.
El `appId` y el `appName` se generan al crear la aplicación; revísalos en
`capacitor.config.ts` si necesitas personalizarlos antes de distribuirla.

```bash
mova cap add android
mova cap add ios
```

#### Parámetros

- `<platform>`: plataforma nativa que se creará. Valores admitidos: `android`
  o `ios`.

### `mova cap list`

Muestra el catálogo de capacidades nativas. `✓` indica que la capacidad está
habilitada y `○` que está disponible pero no instalada.

```bash
mova cap list
```

#### Parámetros

No recibe parámetros. El estado se obtiene de `mova.config.json` y de las
dependencias instaladas.

### `mova cap enable`

Habilita una o varias capacidades. Instala únicamente sus paquetes npm,
actualiza `mova.config.json`, regenera el provider Angular y sincroniza las
plataformas nativas que ya existan.

```bash
mova cap enable camera device geolocation
```

#### Parámetros

- `<capabilities...>`: uno o varios nombres del catálogo de capacidades
  oficiales. El comando instala solo los plugins necesarios, guarda la
  selección y sincroniza las plataformas nativas que ya estén añadidas.

La configuración activa queda registrada en `mova.config.json`:

```json
{
  "native": {
    "capabilities": ["camera", "device"]
  }
}
```

El CLI usa el catálogo de la shell para conocer el paquete y la configuración
requerida de cada capacidad. El provider Angular se genera automáticamente;
no es necesario editar la shell a mano.

### `mova cap disable`

Deshabilita capacidades y elimina los paquetes que ninguna otra capacidad
activa necesita. El contrato de Core permanece disponible, pero
`isAvailable()` devuelve `false` y cualquier operación explica cómo volver a
habilitar la capacidad.

```bash
mova cap disable geolocation
```

#### Parámetros

- `<capabilities...>`: una o varias capacidades habilitadas que se quieren
  desactivar. Se eliminan los plugins que ya no sean necesarios para ninguna
  otra capacidad activa.

### `mova cap doctor`

Muestra plataformas compatibles, permisos, SDK mínimo y configuración manual
de las capacidades activas.

```bash
mova cap doctor
mova cap doctor android
mova cap doctor ios
```

#### Parámetros

- `[platform]`: filtro opcional de plataforma. Valores admitidos: `android` o
  `ios`. Si se omite, muestra requisitos de ambas plataformas.

### `mova cap permissions`

Muestra, para las capacidades habilitadas, los permisos de Android e iOS, las
credenciales configurables y los requisitos adicionales declarados en el
catálogo de la shell.

```bash
mova cap permissions
mova cap permissions android
mova cap permissions ios
```

#### Parámetros

- `[platform]`: filtro opcional para mostrar solo requisitos de `android` o
  `ios`. Si se omite, muestra los permisos y credenciales declarados para
  todas las plataformas.

El comando no modifica permisos ni instala plugins; sirve para revisar la
configuración antes de `mova cap sync` y abrir el proyecto nativo.

### `mova cap sync`

Sincroniza la shell compilada, los recursos y los plugins con la plataforma. Sin plataforma, sincroniza todas las plataformas añadidas.

```bash
mova cap sync android
mova cap sync
```

#### Parámetros

- `[platform]`: plataforma que se sincronizará (`android` o `ios`). Si se
  omite, sincroniza todas las plataformas nativas añadidas al proyecto.

En Android, el CLI aplica los requisitos declarados por las capacidades
activas: permisos, SDK mínimo, el repositorio AAR de Background Runner y la
entrada obligatoria de Google Maps. Para usar mapas reales, define una clave
restringida antes de sincronizar:

```bash
OPEN_MOVA_GOOGLE_MAPS_ANDROID_API_KEY=tu_clave mova cap sync android
```

Como alternativa, guarda `native.googleMaps.androidApiKey` en
`mova.config.json`. Sin una clave configurada la aplicación sigue arrancando,
pero Google Maps no estará operativo.

```json
{
  "native": {
    "googleMaps": {
      "androidApiKey": "tu_clave"
    }
  }
}
```

### `mova cap open`

Abre el proyecto nativo en Android Studio o Xcode.

```bash
mova cap open android
mova cap open ios
```

#### Parámetros

- `<platform>`: proyecto nativo que se abrirá. Valores admitidos: `android`
  (Android Studio) o `ios` (Xcode).

### `mova cap`

Es el grupo de comandos para preparar y abrir los proyectos nativos de
Capacitor. También permite seleccionar capacidades mediante `list`, `enable`,
`disable`, `doctor` y `permissions`. Consulta todos sus comandos con
`mova cap --help`.

#### Parámetros

No recibe parámetros propios; utiliza uno de los subcomandos descritos arriba,
como `list`, `enable`, `sync` u `open`.

## Flujo habitual

```bash
mova create mi-aplicacion
cd mi-aplicacion
# Si aceptaste la instalación durante `mova create`, omite los tres comandos siguientes.
npm install
npm --prefix mfs/home install
npm --prefix mfs/calculator install
mova cap enable camera device
mova start
```

Los microfrontales siempre se cargan remotamente mediante Native Federation. En producción, cada MF debe estar publicado en HTTPS y registrado con su `productionRemoteEntry`. Capacitor no copia los MFs al paquete nativo: la shell los carga desde sus URLs en ejecución.

## Flujo para publicar

> [!WARNING]
> Este flujo prepara artefactos, pero el CLI no publica archivos por sí mismo
> en GitHub Pages, un CDN o un hosting. Necesitas un proveedor de hosting y
> debes publicar el contenido completo de cada directorio `dist/browser`.

La publicación se hace en dos partes: primero se generan y publican los
microfrontales, y después se genera y publica la shell con las URLs definitivas
de esos remotos.

### 1. Preparar la aplicación

Desde la raíz de la aplicación:

```bash
mova doctor
npm install
npm --prefix mfs/home install
npm --prefix mfs/calculator install
```

Ejecuta también `npm --prefix mfs/<nombre> install` para cada MF local. Los MFs
que solo estén registrados mediante una URL remota no se compilan ni se
publican desde esta aplicación.

### 2. Generar cada microfrontal

Para cada MF local, utiliza:

```bash
mova mf deploy home
mova mf deploy calculator
```

El comando compila el MF y genera:

```text
mfs/home/dist/browser/
├── remoteEntry.json
├── open-mova-deployment.json
└── ...assets y chunks...
```

El fichero `open-mova-deployment.json` describe el remoto, sus rutas o
componentes expuestos y la versión compatible de Core. No debes publicar solo
`remoteEntry.json`: también son necesarios todos los chunks y assets que ese
fichero referencia.

### 3. Publicar los microfrontales

Publica el contenido de cada `mfs/<nombre>/dist/browser/` en una URL HTTPS estable y
versionada, por ejemplo:

```text
https://cdn.example.com/mi-aplicacion/home/0.1.0/
```

El remoto deberá quedar accesible como:

```text
https://cdn.example.com/mi-aplicacion/home/0.1.0/remoteEntry.json
```

Comprueba que el hosting permite CORS para el dominio de la shell y que
`open-mova.manifest.json`, `remoteEntry.json`, los chunks y sus mapas se sirven
con las rutas correctas. No uses una URL de `localhost` en producción.

> [!WARNING]
> No sobrescribas una versión ya publicada. Las URLs versionadas permiten
> mantener la caché, volver a una versión anterior y actualizar la shell sin
> reconstruir los microfrontales.

### 4. Registrar las URLs de producción

Después de publicar cada MF, configura su URL final en `mova.config.json`:

```json
{
  "microfrontends": [
    {
      "name": "home",
      "productionRemoteEntry": "https://cdn.example.com/mi-aplicacion/home/0.1.0/remoteEntry.json"
    },
    {
      "name": "calculator",
      "productionRemoteEntry": "https://cdn.example.com/mi-aplicacion/calculator/0.1.0/remoteEntry.json"
    }
  ]
}
```

La URL debe ser HTTPS y su origen debe estar incluido en los orígenes de
confianza de la aplicación. Conserva la misma versión de Core que declara el
MF; si el remoto requiere otra versión incompatible, la shell lo rechazará al
cargarlo.

### 5. Generar la shell de producción

Cuando todas las URLs estén configuradas, ejecuta:

```bash
mova build --production
```

Este comando vuelve a compilar los MFs locales y la shell, valida las URLs y
genera el manifiesto de producción en:

```text
dist/browser/
└── assets/federation.manifest.json
```

La shell utilizará ese manifiesto para cargar los remotos desde sus URLs
HTTPS. Publica todo el contenido de `dist/browser/`, conservando la estructura
de directorios y los nombres de los assets.

> [!WARNING]
> Ejecuta `mova build --production` después de registrar o cambiar una URL de
> producción. Si publicas una shell antigua, seguirá apuntando al manifiesto
> anterior aunque los MFs ya estén disponibles.

### Resumen

```bash
mova doctor
npm install
npm --prefix mfs/home install
npm --prefix mfs/calculator install
mova mf deploy home
mova mf deploy calculator
# Publicar ambos dist/browser/ y registrar sus productionRemoteEntry
mova build --production
# Publicar dist/browser/ de la shell
```

## Flujo para Android

> [!WARNING]
> Antes de empezar debes tener instalado Android Studio, el Android SDK, las
> Build Tools, Platform Tools (`adb`) y un emulador o un dispositivo Android.
> También necesitas Node.js 22, npm y Git. Android Studio incluye un JDK
> compatible, por lo que normalmente no necesitas instalar otro manualmente.

Desde el directorio donde quieras crear la aplicación:

```bash
mova create mi-aplicacion
cd mi-aplicacion
npm install
npm --prefix mfs/home install
npm --prefix mfs/calculator install
```

Comprueba que cada microfrontal tiene un `productionRemoteEntry` HTTPS en
`mova.config.json`. Android no puede utilizar las URLs de desarrollo de
`localhost` como si fuera el navegador del ordenador.

Añade la plataforma Android. El comando compila la shell, ejecuta Capacitor y
aplica la configuración específica de los plugins instalados:

```bash
mova cap add android
```

Antes o después de añadir la plataforma puedes habilitar solo lo que use la
aplicación:

```bash
mova cap enable camera device
mova cap doctor android
```

Si utilizas Google Maps, proporciona la clave antes de sincronizar:

```bash
OPEN_MOVA_GOOGLE_MAPS_ANDROID_API_KEY=tu_clave mova cap sync android
```

También puedes guardarla en `mova.config.json`, como se explica en la sección
[`mova cap sync`](#mova-cap-sync). Para volver a sincronizar después de
cambiar la shell, los plugins o la configuración:

```bash
mova cap sync android
```

Abre el proyecto nativo en Android Studio:

```bash
mova cap open android
```

En Android Studio selecciona un emulador o dispositivo, espera a que termine
la sincronización de Gradle y pulsa **Run**. Para probar una nueva versión del
MF remoto no hace falta recompilar Android si la URL publicada no cambia; la
shell lo cargará al iniciar la aplicación.

## Flujo para iOS

> [!WARNING]
> Antes de empezar debes tener instalado Xcode, sus Command Line Tools y
> CocoaPods. Necesitas macOS, Node.js 22, npm y Git. Para ejecutar la app en un
> dispositivo físico necesitarás también una cuenta de Apple y la firma
> configurada en Xcode; el simulador no requiere un dispositivo registrado.

Desde el directorio donde quieras crear la aplicación:

```bash
mova create mi-aplicacion
cd mi-aplicacion
npm install
npm --prefix mfs/home install
npm --prefix mfs/calculator install
```

Comprueba que cada microfrontal tiene un `productionRemoteEntry` HTTPS en
`mova.config.json`. La aplicación iOS seguirá cargando esos microfrontales
remotos desde la shell; no se copian dentro del proyecto nativo.

Añade y sincroniza la plataforma iOS:

```bash
mova cap add ios
mova cap sync ios
```

Activa previamente las capacidades que necesites y revisa sus requisitos:

```bash
mova cap enable camera device
mova cap doctor ios
```

Revisa en Xcode los permisos y la configuración nativa que necesiten los
plugins utilizados, por ejemplo las descripciones de cámara, fotos,
geolocalización o notificaciones en `Info.plist` y los entitlements
correspondientes.

Abre el proyecto en Xcode:

```bash
mova cap open ios
```

En Xcode selecciona un simulador o dispositivo, elige el esquema de la app y
pulsa **Run**. Después de cambiar la shell o los plugins, ejecuta de nuevo
`mova cap sync ios` antes de volver a abrir o ejecutar el proyecto.
