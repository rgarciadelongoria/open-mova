# Próximos pasos de Open Mova

Este roadmap prioriza que el framework sea seguro de actualizar, predecible en
producción y sencillo de adoptar. No todos los puntos requieren una release al
mismo tiempo: cada uno debe convertirse en una issue pequeña antes de
implementarse.

## 1. Cerrar la release actual

- Publicar `@open-mova/cli@0.1.26` en npm y cerrar la issue de mejora visual
  del CLI cuando esté disponible.
- Verificar desde un directorio temporal que `npm create @open-mova/app` usa
  la versión publicada y puede crear, instalar y arrancar una aplicación.
- Documentar en las notas de release qué paquetes npm se han publicado y qué
  contiene el tag del framework.

## 2. Robustez de actualizaciones

- Añadir una copia de seguridad recuperable antes de que `mova update` aplique
  cambios, además de la confirmación actual.
- Mostrar un resumen final de archivos creados, modificados, conservados y en
  conflicto.
- Ampliar las migraciones de `mova.config.json` con pruebas de versiones
  antiguas reales, incluida la actualización de shell y de microfrontales.
- Definir una política de compatibilidad entre shell, `@open-mova/core`, CLI y
  microfrontales para saber qué combinaciones se soportan.

## 3. Despliegue de microfrontales

- Ofrecer plantillas de CI para publicar `dist/browser` de un microfrontal en
  GitHub Pages, un CDN o un hosting estático equivalente.
- Añadir un comando de comprobación que valide la URL publicada, CORS,
  `remoteEntry.json` y el manifiesto de compatibilidad antes de registrarla en
  producción.
- Incorporar una estrategia de versionado, caché y rollback de remotos para
  poder volver a una versión anterior sin reconstruir la shell.

## 4. Seguridad y experiencia de remotos

- Mostrar una pantalla de error técnica y accionable cuando un remoto no pueda
  cargarse, sea incompatible o no esté permitido por la política de orígenes.
- Registrar eventos de carga, versión y fallo de cada microfrontal para que una
  aplicación pueda enviarlos a su sistema de observabilidad.
- Reforzar la guía de producción con ejemplos de CSP, CORS, dominios de
  confianza y separación de responsabilidades entre proveedores.

## 5. Calidad y compatibilidad móvil

- Ejecutar en integración continua una matriz mínima con Android e iOS cuando
  la infraestructura lo permita, incluyendo `cap sync` y compilación nativa.
- Añadir pruebas unitarias para los adaptadores de capacidades de la shell y
  pruebas de contrato entre Core, shell y microfrontales.
- Mejorar `mova doctor` para detectar versiones incompatibles de SDK, Gradle,
  Xcode, CocoaPods, permisos y credenciales antes de abrir el proyecto nativo.

## 6. Capacidades de plataforma compartidas

- Diseñar autenticación como contrato de Core y provider de shell: obtención y
  renovación de token, interceptor HTTP y guards reutilizables, sin acoplar
  los microfrontales al proveedor de identidad.
- Añadir almacenamiento seguro, conectividad, telemetría y configuración
  remota siguiendo el mismo patrón: contrato en Core e implementación en la
  shell.
- Mantener las capacidades de Capacitor seleccionables por aplicación y añadir
  requisitos declarativos para permisos, claves y configuración nativa.

## 7. Experiencia para proveedores

- Convertir el microfrontal demo en una referencia de arquitectura: estructura
  de páginas, pruebas, manejo de errores y consumo de Core.
- Añadir guías cortas para crear, enlazar, actualizar y desplegar un
  microfrontal propio, tanto local como remoto.
- Preparar un proyecto de ejemplo con dos proveedores independientes para
  validar las reglas de compatibilidad, rutas y despliegue remoto.

## Orden recomendado

1. Cerrar la publicación del CLI y verificar la instalación desde npm.
2. Reforzar actualizaciones y compatibilidad de versiones.
3. Mejorar el despliegue, diagnóstico y recuperación de microfrontales
   remotos.
4. Consolidar pruebas móviles y adaptadores nativos.
5. Incorporar autenticación y las siguientes capacidades compartidas.
