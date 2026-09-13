# Open Mova Shell

La shell es el host técnico de Open Mova. Carga los microfrontales mediante
Native Federation y ofrece el punto de integración para capacidades comunes del
framework.

No contiene lógica de negocio ni una interfaz de usuario propia. Su plantilla
solo incluye un `router-outlet`, que es el lugar donde se montan las rutas de
los microfrontales.

## Responsabilidades

- Inicializar Native Federation.
- Leer el manifiesto de remotos.
- Convertir la configuración de microfrontales en rutas Angular.
- Compartir, en el futuro, servicios transversales del framework.

Los microfrontales no forman parte del código fuente de la shell. Cada uno se
desarrolla y se instala como un proyecto independiente.

## Estructura principal

```text
open-mova-shell/
├── src/
│   ├── app/
│   │   ├── app.component.ts          # Contenedor de rutas
│   │   ├── app.routes.ts             # Carga las rutas remotas
│   │   └── application.config.ts    # Registro de microfrontales
│   ├── assets/
│   │   └── federation.manifest.json # URLs de los remotos
│   ├── bootstrap.ts
│   ├── index.html
│   └── main.ts
├── angular.json
└── federation.config.js
```

En `application.config.ts`, `path` es la ruta pública, `remote` es el nombre
del remoto y `exposedModule` indica el módulo de rutas que se carga:

```ts
{
  path: 'first',
  remote: 'first-microfrontend',
  exposedModule: './Routes',
}
```

El manifiesto relaciona ese remoto con su servidor:

```json
{
  "first-microfrontend": "http://localhost:4300/remoteEntry.json"
}
```

La lógica de `app.routes.ts` recorre el registro y crea las rutas
automáticamente.

## Desarrollo

Instala las dependencias desde la raíz del proyecto:

```bash
npm --prefix open-mova-shell install
```

Comandos propios de la shell:

```bash
cd open-mova-shell
npm start
npm run typecheck
npm run build
```

La shell se sirve en [http://localhost:4200](http://localhost:4200). Para ver
los microfrontales cargados hay que iniciar también sus proyectos. Desde la
raíz del monorepo, se pueden usar tres terminales:

```bash
npm run start:first
npm run start:second
npm start
```

## Límites actuales

Capacitor, autenticación, plugins nativos y servicios transversales todavía no
forman parte de esta shell. Cuando se incorporen, la shell será el punto de
integración y los contratos reutilizables vivirán en `open-mova-core`.
