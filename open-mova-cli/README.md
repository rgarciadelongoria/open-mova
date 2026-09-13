# Open Mova CLI

CLI para crear y mantener aplicaciones basadas en Open Mova. La herramienta se
ejecuta desde el terminal con el comando `mova`.

## Qué gestiona

El CLI crea una aplicación host con una shell técnica y mantiene su composición
de microfrontales. No añade lógica de negocio a la shell ni modifica los
microfrontales existentes fuera de su configuración de registro.

La fuente de configuración es `mova.config.json`. Al crear o registrar un
microfrontal, el CLI actualiza también estos ficheros de la shell:

- `src/assets/federation.manifest.json`: relaciona el remoto con su
  `remoteEntry.json` de desarrollo.
- `src/app/application.config.ts`: relaciona la URL pública con el remoto y
  sus rutas expuestas.

Por ese motivo, no hay que editar esos dos ficheros manualmente en una
aplicación creada por el CLI.

## Desarrollo del CLI

Requiere Node.js 20 o posterior.

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

La aplicación creada contiene la shell en su propia raíz y un microfrontal
inicial llamado `home` dentro de `mfs/home`:

```text
mi-aplicacion/
├── src/                         # Shell técnica
├── mfs/
│   └── home/                    # Microfrontal inicial independiente
├── mova.config.json             # Configuración de la composición
├── angular.json
└── package.json
```

Antes de arrancar hay que instalar las dependencias de cada proyecto:

```bash
cd mi-aplicacion
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
ruta `/catalog` y utiliza el primer puerto libre desde el `4300`.

Se puede personalizar su ubicación, ruta o puerto:

```bash
mova mf create catalog \
  --directory ../provider-mf-catalog \
  --route productos \
  --port 4500
```

Las rutas internas del microfrontal son siempre `first-route` y
`second-route` al crearlo. En el ejemplo anterior sus URLs finales serían:

```text
/productos/first-route
/productos/second-route
```

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

Esta primera versión no gestiona todavía Capacitor, plataformas iOS/Android,
plugins nativos, publicación de microfrontales ni clonación desde una URL Git.
Para registrar código existente, utiliza por ahora una copia local del
repositorio o registra directamente un `remoteEntry.json` ya desplegado. Esas
capacidades se añadirán cuando quede definido el host móvil de cada aplicación.
