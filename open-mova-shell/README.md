# Open Mova Shell

Proyecto Angular del framework Open Mova. La shell es un contenedor técnico: carga microfrontales y centraliza capacidades comunes, pero no contiene lógica de negocio ni pantallas propias.

Es un proyecto autónomo dentro del monorepo. Instala sus dependencias desde la raíz con:

```bash
npm --prefix open-mova-shell install
```

## Estructura

- `src/`: código de la shell.
- `src/app/application.config.ts`: registro de los microfrontales que la shell puede cargar.
- `src/app/app.routes.ts`: convierte ese registro en rutas Angular automáticamente.
- `src/assets/federation.manifest.json`: URLs de los `remoteEntry.json`.
- `federation.config.js`: configuración Native Federation de la shell.

La shell no contiene el código de los microfrontales. `open-mova-mf-first` y `open-mova-mf-second` son proyectos independientes que exponen sus rutas mediante Native Federation.

## Ejecutar con los microfrontales

Desde la raíz del monorepo, abre tres terminales:

```bash
npm run start:first
npm run start:second
npm start
```

Las URLs son:

- Shell: `http://localhost:4200`
- First microfrontend: `http://localhost:4300`
- Second microfrontend: `http://localhost:4400`

La shell redirige a `/first/first-route`. También puedes abrir directamente:

- `http://localhost:4200/first/first-route`
- `http://localhost:4200/first/second-route`
- `http://localhost:4200/second/first-route`
- `http://localhost:4200/second/second-route`

## Añadir un microfrontal

Para añadir un tercer microfrontal:

1. Crea un proyecto independiente en la raíz, por ejemplo `open-mova-mf-third`.
2. Configura Native Federation y expón `./Routes` desde su `federation.config.js`.
3. Añade su `remoteEntry.json` al manifiesto de `src/assets/federation.manifest.json`.
4. Añade su ruta pública a `src/app/application.config.ts`.
5. Añade un comando en el `package.json` raíz si quieres iniciarlo desde el monorepo.

No es necesario modificar la lógica de `app.routes.ts` de la shell.

## Verificación

```bash
npm run typecheck
npm run build:shell
```

Capacitor, autenticación y plugins nativos quedan fuera de esta fase.
