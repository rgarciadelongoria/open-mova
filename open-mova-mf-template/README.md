# Microfrontal de referencia

Este es el único proyecto fuente de microfrontal que utiliza el CLI. Se publica
junto con la shell en los tags `vX.Y.Z` del monorepo. La shell de desarrollo lo
carga como remoto en `/demo` desde el puerto `4300`.

Las rutas `inicio`, `device` y `camera` forman el perfil **demo**. Device y
Camera usan `injectNativeCapabilities()` de `@open-mova/core`; la implementación
de Capacitor vive en la
shell. Al ejecutar este proyecto solo, sin shell, los botones muestran un
error explicativo porque el bootstrap independiente proporciona un stub.

El CLI descarga este proyecto sin duplicar su configuración Angular. Para
`mova create`, lo copia como `mfs/home` con perfil demo. Para `mova mf create`,
lo personaliza con el perfil **minimal**: sustituye las rutas de demostración
por una única ruta inicial y quita la dependencia de core.

## Desarrollo local

```bash
npm --prefix ../open-mova-core install
npm --prefix ../open-mova-core run build
npm install
npm start
```

Después inicia la shell y abre `http://localhost:4200/demo/inicio`. Para
verificar este proyecto: `npm run typecheck` y `npm run build`.

## Estructura del código

Las rutas se mantienen en `src/app/app.routes.ts` y solo enlazan cada URL con
su componente. La implementación está separada por responsabilidad:

```text
src/app/
├── app.routes.ts
├── layout/
│   ├── demo-layout.component.ts
│   └── demo-layout.component.html
└── pages/
    ├── home/
    ├── device/
    │   ├── device-example.component.ts
    │   └── device-example.component.html
    └── camera/
        ├── camera-example.component.ts
        └── camera-example.component.html
```

Cada pantalla tiene su lógica en el fichero `.ts` y su vista en el `.html`.
Para añadir una nueva pantalla, crea su carpeta y componente, y añade después
una entrada en `app.routes.ts`.
