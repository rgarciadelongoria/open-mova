# Remotos en producción

Open Mova carga microfrontales remotos mediante Native Federation. Un remoto es
código JavaScript que se ejecuta dentro de la misma página que la shell; no se
ejecuta en un sandbox ni en un proceso aislado.

Esta guía define cómo publicar esos remotos de forma versionada, qué controles
aplica el framework y qué debe configurar la infraestructura que los sirve.

## URL versionada e inmutable

Publica cada versión en una ruta nueva e inmutable. No reutilices una URL para
contenido diferente, ya que los navegadores y CDN pueden mantenerla en caché.

```text
https://cdn.example.com/catalog/1.4.0/remoteEntry.json
```

Guarda la URL en el microfrontal de `mova.config.json`:

```json
{
  "security": {
    "trustedRemoteOrigins": ["https://cdn.example.com"]
  },
  "microfrontends": [
    {
      "name": "catalog",
      "route": "catalog",
      "remoteName": "catalog-microfrontend",
      "exposedModule": "./Routes",
      "developmentRemoteEntry": "http://localhost:4300/remoteEntry.json",
      "productionRemoteEntry": "https://cdn.example.com/catalog/1.4.0/remoteEntry.json",
      "compatibility": {
        "requiredCoreVersion": "^0.2.2"
      }
    }
  ]
}
```

`trustedRemoteOrigins` contiene solo orígenes HTTPS: protocolo, host y puerto,
sin una ruta. Al registrar un remoto HTTPS con `mova mf add`, la CLI incorpora
su origen a esta lista. Revísala en cada cambio: es la lista de proveedores a
los que la aplicación autoriza a ejecutar código.

## Controles de Open Mova

La shell generada recibe la lista de orígenes permitidos para cada remoto. Antes
de descargar su manifiesto o importar sus rutas, comprueba el origen de
`remoteEntry.json`; si no está permitido, muestra un error y no carga el MF.

Para generar el artefacto web de producción:

```bash
mova doctor
mova build --production
```

El segundo comando exige que cada MF tenga un `productionRemoteEntry` HTTPS y
que su origen figure en `security.trustedRemoteOrigins`. Después reemplaza el
manifiesto local del directorio `dist/browser` por las URLs de producción.

`mova cap sync` aplica la misma validación antes de preparar Android o iOS. El
manifiesto de desarrollo conserva los remotos locales y se usa con `mova start`.

## CSP y CORS

La validación de Open Mova no reemplaza los controles del servidor. La shell
debe publicarse con una política CSP que permita únicamente sus remotos de
confianza. Como punto de partida, adapta este encabezado a tu dominio:

```text
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.example.com;
  connect-src 'self' https://cdn.example.com;
  img-src 'self' data: https:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'none'
```

Revísala con el equipo de seguridad antes de desplegarla. Angular y los estilos
del producto pueden requerir nonces o hashes para retirar `unsafe-inline`.

El servidor del MF debe permitir que la shell descargue los módulos desde otro
origen. Para una shell en `https://app.example.com`, el CDN del MF debe enviar,
como mínimo:

```text
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, OPTIONS
```

No uses `Access-Control-Allow-Origin: *` si el proveedor sirve otros recursos
que no deban ser públicos. Los ficheros versionados pueden usar una caché larga
e inmutable; no sobrescribas una versión publicada.

## Rollback

Un rollback no modifica el MF ya publicado. Conserva la versión anterior en el
CDN y cambia `productionRemoteEntry` para apuntar, por ejemplo, de `1.4.0` a
`1.3.2`. Después valida y genera de nuevo la shell:

```bash
mova doctor
mova build --production
```

Despliega el nuevo artefacto de la shell. Android e iOS requieren además:

```bash
mova cap sync
```

Este mecanismo hace explícita la versión que utiliza cada aplicación y permite
volver atrás sin depender de invalidaciones de caché del remoto.

## Confianza entre proveedores

Native Federation y la inyección de dependencias evitan acoplamientos técnicos,
pero no son una frontera de seguridad. Un MF remoto puede leer el DOM, observar
la memoria JavaScript accesible y usar cualquier API expuesta a la misma página.

Solo registra orígenes de proveedores que controles o en los que confíes. Antes
de exponer autenticación, datos personales o capacidades nativas, define:

- Qué proveedor mantiene cada origen y cómo publica sus versiones.
- Qué datos recibe el MF y durante cuánto tiempo.
- Qué capacidades nativas puede solicitar la aplicación.
- Cómo se revoca un remoto comprometido y se despliega el rollback.

No entregues tokens globales a un MF de un proveedor no confiable. La lista de
orígenes y CSP reducen cargas accidentales, pero no convierten un remoto de
confianza parcial en código aislado.
