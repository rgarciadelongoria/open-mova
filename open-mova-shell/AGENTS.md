# Guía de mantenimiento de Open Mova Shell

## Objetivo

Este proyecto contiene únicamente la shell técnica de Open Mova. Los microfrontales viven en proyectos independientes del monorepo. La shell integra Capacitor y publica las capacidades Device y Camera mediante el contrato de `open-mova-core`.

## Principios de arquitectura

- Mantener la shell pequeña: carga y coordina microfrontales, configuración y capacidades comunes; no contiene lógica de negocio ni pantallas propias.
- Mantener el código de la shell directamente en `src/`.
- Aislar cada aplicación mediante su configuración y sus propias versiones.
- Preferir interfaces y adaptadores frente a dependencias directas entre microfrontales.
- Añadir una capacidad al framework solo cuando sea transversal, estable y útil para más de una aplicación.

## Estilo de código

- Usar TypeScript estricto y código explícito.
- Formatear el código en varias líneas cuando mejore la lectura.
- Usar nombres descriptivos, funciones pequeñas y componentes standalone de Angular.
- Mantener las importaciones ordenadas y eliminar las que no se utilicen.
- Escribir comentarios breves solo para decisiones o restricciones no evidentes.

## Cambios y verificación

- Hacer cambios pequeños y fáciles de revisar.
- Actualizar este README cuando cambie la forma de ejecutar o entender este proyecto.
- Ejecutar el build o las pruebas relevantes antes de finalizar un cambio.
- No actualizar dependencias de forma indiscriminada ni incluir artefactos generados.
