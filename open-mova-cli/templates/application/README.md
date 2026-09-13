# __APPLICATION_NAME__

Aplicación creada con Open Mova. La shell está en `src/` y los microfrontales
locales se guardan en `mfs/`.

Instala las dependencias de la shell y de cada microfrontal antes de iniciar el
desarrollo.

Para móvil, cambia `appId` en `capacitor.config.ts`, configura una URL HTTPS
`productionRemoteEntry` para cada microfrontal en `mova.config.json` y ejecuta
`mova cap add android` (o `ios`). Después de cambiar la shell o los plugins,
usa `mova cap sync android` y abre el proyecto con `mova cap open android`.
Los microfrontales se siguen cargando remotamente y necesitan conexión.
