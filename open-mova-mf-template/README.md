# Microfrontal de referencia

Este es el único proyecto fuente de microfrontal que utiliza el CLI. Se publica
junto con la shell en los tags `vX.Y.Z` del monorepo. La shell de desarrollo lo
carga como remoto en `/demo` desde el puerto `4300`.

Las rutas `inicio`, `device` y `camera` forman el perfil **demo**. Device y
Camera usan el contrato `@open-mova/core`; la implementación de Capacitor vive
en la shell. Al ejecutar este proyecto solo, sin shell, los botones muestran
un error explicativo porque no existe el puente nativo.

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
