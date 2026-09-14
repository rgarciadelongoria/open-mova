<p align="center">
  <img src="../assets/brand/open-mova-logo-title-rectangle.png" alt="Open Mova" width="720">
</p>

# Open Mova CLI

CLI de terminal para crear y mantener aplicaciones Open Mova. Se ejecuta desde la raíz de cada aplicación con el comando `mova`.

El CLI descarga la shell, el core y la plantilla de microfrontales desde tags estables del repositorio de Open Mova. No contiene copias de esas plantillas. Cada aplicación guarda en `mova.config.json` el tag y el commit con los que fue creada.

## Índice de comandos

- [`mova create`](#mova-create)
- [`mova mf create`](#mova-mf-create)
- [`mova mf add`](#mova-mf-add)
- [`mova start`](#mova-start)
- [`mova build`](#mova-build)
- [`mova info`](#mova-info)
- [`mova shell versions`](#mova-shell-versions)
- [`mova cap add`](#mova-cap-add)
- [`mova cap sync`](#mova-cap-sync)
- [`mova cap open`](#mova-cap-open)

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

## Comandos

### `mova create`

Crea una aplicación completa. Descarga una shell versionada, el core y un MF inicial `home`.

```bash
mova create mi-aplicacion
mova create mi-aplicacion --directory ../apps/mi-aplicacion
mova create mi-aplicacion --shell-version v0.1.4
mova create mi-aplicacion --empty
```

Sin `--shell-version` se usa el tag estable más reciente (`vMAJOR.MINOR.PATCH`). `--empty` omite el MF inicial.

### `mova mf create`

Crea un microfrontal local, lo registra y actualiza la configuración de federación de la shell.

```bash
cd mi-aplicacion
mova mf create catalog
mova mf create catalog --route productos --port 4500
mova mf create catalog --directory ../provider-mf-catalog
mova mf create catalog --demo
```

Por defecto se crea en `mfs/catalog`, con perfil mínimo, ruta `/catalog` y un puerto libre desde `4300`. `--demo` añade ejemplos de Device y Camera. Se puede fijar la plantilla con `--template-version v0.1.4`.

### `mova mf add`

Registra un microfrontal existente, sin crearlo de nuevo.

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

### `mova start`

Arranca los MFs locales registrados y después la shell. Los MFs configurados solo con una URL remota no se arrancan localmente.

```bash
mova start
mova start --shell-only
```

### `mova build`

Compila los microfrontales locales y la shell.

```bash
mova build
```

### `mova info`

Muestra la aplicación detectada, la versión de shell y sus microfrontales. También funciona desde subdirectorios como `mfs/catalog`.

```bash
mova info
```

### `mova shell versions`

Lista los tags estables disponibles para crear aplicaciones.

```bash
mova shell versions
```

### `mova cap add`

Compila la aplicación y añade una plataforma nativa. Configura antes el `appId` definitivo en `capacitor.config.ts`.

```bash
mova cap add android
mova cap add ios
```

### `mova cap sync`

Sincroniza la shell compilada, los recursos y los plugins con la plataforma. Sin plataforma, sincroniza todas las plataformas añadidas.

```bash
mova cap sync android
mova cap sync
```

### `mova cap open`

Abre el proyecto nativo en Android Studio o Xcode.

```bash
mova cap open android
mova cap open ios
```

## Flujo habitual

```bash
mova create mi-aplicacion
cd mi-aplicacion
npm install
npm --prefix packages/core install
npm --prefix packages/core run build
npm --prefix mfs/home install
mova start
```

Los microfrontales siempre se cargan remotamente mediante Native Federation. En producción, cada MF debe estar publicado en HTTPS y registrado con su `productionRemoteEntry`. Capacitor no copia los MFs al paquete nativo: la shell los carga desde sus URLs en ejecución.

## Limitaciones actuales

El CLI todavía no actualiza automáticamente la shell de una aplicación creada ni publica microfrontales. Los comandos móviles requieren una versión de shell que incluya Capacitor.
