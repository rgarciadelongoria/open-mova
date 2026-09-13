# Open Mova MF Second

Segundo microfrontal independiente de Open Mova. Su código, configuración Angular y dependencias viven exclusivamente en este proyecto.

## Desarrollo

```bash
npm install
npm start
```

El servidor queda disponible en `http://localhost:4400` y expone `remoteEntry.json` para que la shell pueda cargarlo.

## Rutas expuestas

El módulo `./Routes` contiene las rutas internas `first-route` y `second-route`. La shell lo monta bajo `/second`.
