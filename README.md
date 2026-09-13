# Open Mova

Monorepo privado de Open Mova. Reúne las piezas que se distribuyen y evolucionan juntas, manteniendo cada proyecto independiente.

## Proyectos

- `open-mova-shell/`: workspace Angular del framework. Incluye la shell técnica, Native Federation y las plantillas de microfrontales.
- `open-mova-cli/`: CLI que, en las siguientes iteraciones, creará y mantendrá aplicaciones basadas en el framework.

La raíz no contiene código Angular ni código del CLI: solo coordina comandos y documentación. Los proyectos no comparten dependencias ni lockfiles.

## Preparación

Cada proyecto instala sus propias dependencias. Ejecuta desde la raíz:

```bash
npm --prefix open-mova-shell install
npm --prefix open-mova-cli install
```

## Ejecutar la demostración de la shell

Abre tres terminales en la raíz del monorepo:

```bash
npm run start:first
npm run start:second
npm start
```

La shell estará disponible en `http://localhost:4200`. Cada proyecto explica su estructura y sus comandos específicos en su propio README.

## Verificación

```bash
npm run typecheck
npm run build:shell
npm run build:cli
```
