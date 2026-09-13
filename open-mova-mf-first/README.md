# Open Mova MF First

Primer microfrontal de demostración de Open Mova. Es un proyecto Angular
independiente que expone sus rutas mediante Native Federation para que la shell
pueda cargarlo.

No contiene código de la shell. Su responsabilidad es mostrar una pequeña
funcionalidad propia y publicar el módulo remoto que la shell consume.

## Estructura

```text
open-mova-mf-first/
├── src/
│   └── app/
│       ├── app.ts
│       ├── app.config.ts
│       └── app.routes.ts
├── angular.json
├── federation.config.js
├── package.json
├── tsconfig.json
└── tsconfig.app.json
```

En `federation.config.js` se exponen dos módulos:

```js
exposes: {
  './Component': './src/app/app.ts',
  './Routes': './src/app/app.routes.ts',
}
```

La shell utiliza `./Routes` para cargar las rutas del microfrontal.

## Rutas

El microfrontal contiene dos rutas internas:

```text
/first-route
/second-route
```

La shell lo monta bajo `/first`, por lo que las URLs completas son:

```text
/first/first-route
/first/second-route
```

## Desarrollo

Instala las dependencias dentro de este proyecto:

```bash
npm install
```

Comandos disponibles:

```bash
npm start
npm run typecheck
npm run build
```

El servidor de desarrollo utiliza el puerto `4300` y publica el artefacto
remoto en:

```text
http://localhost:4300/remoteEntry.json
```

Para verlo dentro de la shell, inicia también `open-mova-shell` y comprueba
`http://localhost:4200/first/first-route`.
