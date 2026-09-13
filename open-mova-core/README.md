# Open Mova Core

Librería base del framework Open Mova. Actualmente está vacía y preparada para incorporar contratos y piezas técnicas reutilizables por la shell y los microfrontales.

## Límites

El core no debe depender de Capacitor, de un microfrontal concreto ni de lógica de negocio. Las futuras capacidades nativas se implementarán en la shell y utilizarán contratos definidos aquí.

## Desarrollo

Este proyecto es autónomo y tiene sus propias dependencias:

```bash
npm install
npm run typecheck
npm run build
```

El punto de entrada público es `src/index.ts`. Cuando se añada el primer contrato, se exportará desde ese fichero para que otros proyectos puedan importarlo mediante `@open-mova/core`.
