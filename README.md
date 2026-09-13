# Open Mova

Open Mova es un framework para construir aplicaciones web y móviles con
Angular y Native Federation. El repositorio es un monorepo: reúne las piezas
del framework, pero mantiene cada proyecto autónomo y con sus propias
dependencias.

## Arquitectura

Una aplicación Open Mova está formada por una shell técnica y varios
microfrontales independientes:

```text
Aplicación final
├── Shell                 # Contenedor y capacidades comunes
└── Microfrontales        # Funcionalidad de cada proveedor
```

La shell no contiene lógica de negocio ni pantallas propias. Su responsabilidad
es cargar los microfrontales mediante Native Federation y ofrecer el punto de
integración para futuras capacidades del framework.

## Proyectos del monorepo

```text
open-mova/
├── open-mova-core/       # Contratos y piezas reutilizables
├── open-mova-shell/      # Shell Angular del framework
├── open-mova-mf-first/   # Microfrontal de demostración
├── open-mova-mf-second/  # Microfrontal de demostración
└── open-mova-cli/        # Herramienta de terminal de Open Mova
```

- `open-mova-core` es independiente de Angular, Capacitor y de cualquier
  microfrontal concreto.
- `open-mova-shell` contiene únicamente la shell técnica.
- `open-mova-mf-first` y `open-mova-mf-second` son proyectos de ejemplo
  autónomos para probar la integración.
- `open-mova-cli` crea aplicaciones y registra microfrontales. Sus comandos y
  plantillas están documentados en [`open-mova-cli/README.md`](open-mova-cli/README.md).

## Requisitos

- Node.js 20 o posterior.
- npm.

Cada proyecto instala sus propias dependencias. La raíz no tiene dependencias
compartidas ni un `node_modules` común.

## Instalación

Desde la raíz del monorepo:

```bash
npm --prefix open-mova-core install
npm --prefix open-mova-shell install
npm --prefix open-mova-mf-first install
npm --prefix open-mova-mf-second install
npm --prefix open-mova-cli install
```

## Comandos de coordinación

El `package.json` de la raíz solo contiene atajos para coordinar los proyectos.
No sustituye al `package.json` de cada proyecto ni comparte sus dependencias.

| Comando | Función |
| --- | --- |
| `npm start` | Inicia la shell en el puerto `4200`. |
| `npm run start:first` | Inicia el primer MF en el puerto `4300`. |
| `npm run start:second` | Inicia el segundo MF en el puerto `4400`. |
| `npm run start:cli` | Ejecuta el CLI en modo desarrollo. |
| `npm run typecheck` | Comprueba el tipado de todos los proyectos. |
| `npm run build:core` | Compila `open-mova-core`. |
| `npm run build:shell` | Compila `open-mova-shell`. |
| `npm run build:first` | Compila `open-mova-mf-first`. |
| `npm run build:second` | Compila `open-mova-mf-second`. |
| `npm run build:cli` | Compila `open-mova-cli`. |

## Ejecutar la demostración

Abre tres terminales en la raíz del monorepo y ejecuta un comando en cada una:

```bash
npm run start:first
```

```bash
npm run start:second
```

```bash
npm start
```

La shell estará disponible en [http://localhost:4200](http://localhost:4200).
Los microfrontales se pueden comprobar directamente en:

- [http://localhost:4300](http://localhost:4300)
- [http://localhost:4400](http://localhost:4400)

Desde la shell, las rutas de demostración son:

- `/first/first-route`
- `/first/second-route`
- `/second/first-route`
- `/second/second-route`

La shell obtiene la ubicación de cada remoto desde
`open-mova-shell/src/assets/federation.manifest.json` y obtiene la ruta
pública desde `open-mova-shell/src/app/application.config.ts`.

## Verificación completa

```bash
npm run typecheck
npm run build:core
npm run build:shell
npm run build:first
npm run build:second
npm run build:cli
```

## Estado del proyecto

Angular y Native Federation están integrados en la shell y en los
microfrontales de demostración. `open-mova-core` está preparado para recibir
contratos reutilizables. Capacitor, autenticación y plugins nativos quedan
para una fase posterior.
