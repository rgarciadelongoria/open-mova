# Open Mova Shell

Workspace Angular del framework Open Mova. Contiene una shell común y plantillas de microfrontales independientes mediante Native Federation.

Forma parte del monorepo, pero es autónomo: sus dependencias y su `package-lock.json` pertenecen exclusivamente a este proyecto. Puedes instalarlo desde la raíz con `npm --prefix open-mova-shell install`.

## Estructura

- `apps/shell`: host técnico del framework. No contiene lógica de negocio ni pantallas propias.
- `apps/shell/src/app/application.config.ts`: configuración de los microfrontales que utiliza esta aplicación.
- `apps/shell/src/app/app.routes.ts`: convierte esa configuración en rutas Angular de forma automática.
- `apps/shell/src/assets/federation.manifest.json`: nombres y URLs de los remotos.
- `templates/first-microfrontend`: primer microfrontal de referencia.
- `templates/second-microfrontend`: segundo microfrontal de referencia.
- `AGENTS.md`: convenciones de arquitectura, estilo y mantenimiento.

## Ejecutar la shell con los dos microfrontales

Requiere Node.js 20 o posterior. Ejecuta cada proceso en un terminal independiente:

```bash
npm run start:first
npm run start:second
npm start
```

Las URLs son:

- Shell: `http://localhost:4200`
- First microfrontend: `http://localhost:4300`
- Second microfrontend: `http://localhost:4400`

Abre `http://localhost:4200`. La shell redirige a `/first` y carga el primer microfrontal. También puedes abrir directamente:

- `http://localhost:4200/first/first-route`
- `http://localhost:4200/first/second-route`
- `http://localhost:4200/second/first-route`
- `http://localhost:4200/second/second-route`

## Cómo se configura un microfrontal

Cada microfrontal expone sus rutas en su propio `federation.config.js`:

```js
exposes: {
  './Routes': './templates/first-microfrontend/src/app/app.routes.ts',
}
```

La shell no importa ese archivo directamente. Primero encuentra el remoto mediante `federation.manifest.json`:

```json
{
  "first-microfrontend": "http://localhost:4300/remoteEntry.json",
  "second-microfrontend": "http://localhost:4400/remoteEntry.json"
}
```

Después, `application.config.ts` define la ruta pública de cada microfrontal y el módulo de rutas que expone:

```ts
{
  path: 'first',
  remote: 'first-microfrontend',
  exposedModule: './Routes',
}
```

Para añadir un tercero manualmente:

1. Crea `templates/third-microfrontend` siguiendo la estructura de uno de los existentes.
2. Cambia su nombre y las rutas de su `federation.config.js`.
3. Expón `./Routes` desde el archivo de rutas del nuevo microfrontal.
4. Añade su URL al manifiesto de la shell.
5. Añade una entrada a `apps/shell/src/app/application.config.ts`.
6. Añade un script `start:third` en `package.json` si quieres lanzarlo con un comando propio.

No es necesario modificar `app.routes.ts` ni `app.component.ts` de la shell. Esa es la responsabilidad de la configuración.

## Rutas internas

Cada microfrontal es dueño de sus rutas internas. Por ejemplo, `first-microfrontend` expone:

```text
/first-route
/second-route
```

Como la shell lo monta bajo `/first`, las URLs completas son `/first/first-route` y `/first/second-route`. El segundo microfrontal sigue el mismo patrón bajo `/second`.

La navegación de cada microfrontal vive en su propio componente layout, dentro de `app.routes.ts`. La shell carga ese conjunto de rutas mediante `./Routes`; por eso los enlaces aparecen también cuando el microfrontal se ejecuta dentro de la shell.

## Verificación

```bash
npm run typecheck
npm run build
npm run build:first
npm run build:second
```

El typecheck valida los tres proyectos. El build utiliza Native Federation; conviene ejecutarlo con la versión de Node recomendada por Angular antes de integrarlo en CI.

Capacitor, autenticación y plugins nativos quedan fuera de esta fase.
