# Open Mova

Monorepo privado de Open Mova. Reúne las piezas que se distribuyen y evolucionan juntas, manteniendo cada proyecto independiente.

## Proyectos

- `open-mova-shell/`: proyecto Angular del framework. Contiene únicamente la shell técnica.
- `open-mova-core/`: librería base del framework. Actualmente está vacía y preparada para contratos reutilizables.
- `open-mova-mf-first/`: primer microfrontal independiente.
- `open-mova-mf-second/`: segundo microfrontal independiente.
- `open-mova-cli/`: CLI que, en las siguientes iteraciones, creará y mantendrá aplicaciones basadas en el framework.

La raíz no contiene código Angular ni código del CLI: solo coordina comandos y documentación. Los proyectos no comparten dependencias ni lockfiles.

## Preparación

Cada proyecto instala sus propias dependencias. Ejecuta desde la raíz:

```bash
npm --prefix open-mova-shell install
npm --prefix open-mova-core install
npm --prefix open-mova-mf-first install
npm --prefix open-mova-mf-second install
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
npm run build:core
npm run build:first
npm run build:second
npm run build:cli
```

## Añadir un nuevo microfrontal

Esta guía muestra cómo añadir un tercer microfrontal llamado `open-mova-mf-third`. Los nombres `third` y `third-microfrontend` son ejemplos: puedes sustituirlos por el nombre real de tu proyecto, pero debes mantenerlos coherentes en todos los ficheros.

### 1. Crear el proyecto independiente

El nuevo proyecto debe estar en la raíz del monorepo, al mismo nivel que la shell y los otros microfrontales:

```text
open-mova/
├── open-mova-shell/
├── open-mova-mf-first/
├── open-mova-mf-second/
└── open-mova-mf-third/
```

Actualmente no existe una plantilla automática. Para empezar, toma `open-mova-mf-first` como referencia y copia únicamente los ficheros del proyecto, sin copiar `node_modules`, `dist` ni `.angular`. El nuevo proyecto debe tener, como mínimo:

```text
open-mova-mf-third/
├── src/
│   ├── app/
│   ├── bootstrap.ts
│   ├── index.html
│   └── main.ts
├── angular.json
├── federation.config.js
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── .gitignore
```

Cada microfrontal es un proyecto Angular autónomo. Por eso sus dependencias se instalan dentro de su propia carpeta:

```bash
npm --prefix open-mova-mf-third install
```

Esto genera `open-mova-mf-third/package-lock.json` y `open-mova-mf-third/node_modules/`. No hay que editar el lockfile manualmente.

### 2. Revisar `package.json` del nuevo MF

En `open-mova-mf-third/package.json`, cambia el nombre y los comandos para que apunten al proyecto nuevo. La estructura es la misma que la de `open-mova-mf-first`:

```json
{
  "name": "open-mova-mf-third",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "start": "ng serve open-mova-mf-third",
    "build": "ng build open-mova-mf-third",
    "typecheck": "tsc -p tsconfig.app.json --noEmit"
  }
}
```

Conserva las dependencias Angular, Native Federation, TypeScript y RxJS del proyecto de referencia. Son necesarias para que el MF pueda ejecutarse por separado y también ser cargado por la shell.

### 3. Revisar `angular.json`

El `angular.json` del nuevo proyecto debe ser independiente. Como solo contiene un proyecto, la parte importante es que la clave y los targets coincidan con `open-mova-mf-third`:

```json
{
  "projects": {
    "open-mova-mf-third": {
      "projectType": "application",
      "root": "",
      "sourceRoot": "src",
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "target": "open-mova-mf-third:application:production"
            },
            "development": {
              "target": "open-mova-mf-third:application:development",
              "dev": true
            }
          }
        },
        "serve-application": {
          "options": {
            "port": 4500
          }
        }
      }
    }
  }
}
```

No es necesario copiar literalmente solo este fragmento: el fichero completo debe conservar los builders de Native Federation y Angular del proyecto de referencia. El puerto `4500` es solo un ejemplo y debe ser distinto de `4200`, `4300` y `4400`.

### 4. Configurar Native Federation

Edita `open-mova-mf-third/federation.config.js`. Este fichero indica el nombre con el que la shell identificará al remoto y qué módulos puede cargar:

```js
const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'third-microfrontend',

  exposes: {
    './Component': './src/app/app.ts',
    './Routes': './src/app/app.routes.ts',
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },
});
```

Hay dos detalles importantes:

- `name` debe coincidir con el nombre que usarás en el manifiesto de la shell.
- `./Routes` debe apuntar al fichero que exporta `routes`. La shell carga precisamente ese módulo.

Los paths (`./src/...`) son relativos a la raíz del proyecto `open-mova-mf-third`, no a la raíz del monorepo.

### 5. Preparar las rutas internas

En `open-mova-mf-third/src/app/app.routes.ts` define las pantallas y exporta una constante llamada `routes`. Puedes empezar con dos rutas sencillas:

```ts
import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  standalone: true,
  template: `
    <h1>Third microfrontend</h1>
    <p>Primera pantalla del nuevo microfrontal.</p>
  `,
})
export class ThirdFirstRouteComponent {}

@Component({
  standalone: true,
  template: `
    <h1>Third microfrontend · second route</h1>
    <p>Segunda pantalla del nuevo microfrontal.</p>
  `,
})
export class ThirdSecondRouteComponent {}

export const routes: Routes = [
  { path: 'first-route', component: ThirdFirstRouteComponent },
  { path: 'second-route', component: ThirdSecondRouteComponent },
];
```

En los microfrontales actuales existe además un componente layout con los enlaces de navegación. Puedes conservar ese patrón para que el usuario pueda moverse entre las rutas. Lo esencial para la shell es que el fichero exporte `routes`.

Las rutas internas no son rutas completas. Si el MF se monta bajo `/third`, las URLs finales serán:

```text
/third/first-route
/third/second-route
```

Los ficheros `src/main.ts`, `src/bootstrap.ts`, `src/app/app.ts` y `src/app/app.config.ts` normalmente se pueden conservar como en el proyecto de referencia, cambiando únicamente el selector y los textos propios del nuevo MF.

### 6. Registrar el remoto en la shell

Hay que tocar dos ficheros de `open-mova-shell`. El primero es `src/assets/federation.manifest.json`. Añade el nombre remoto y la URL donde se publicará su `remoteEntry.json`:

```json
{
  "first-microfrontend": "http://localhost:4300/remoteEntry.json",
  "second-microfrontend": "http://localhost:4400/remoteEntry.json",
  "third-microfrontend": "http://localhost:4500/remoteEntry.json"
}
```

El nombre `third-microfrontend` debe ser exactamente el mismo que aparece en `federation.config.js`.

Después edita `open-mova-shell/src/app/application.config.ts` y añade la ruta pública:

```ts
export const microfrontends: readonly MicrofrontendDefinition[] = [
  {
    path: 'first',
    remote: 'first-microfrontend',
    exposedModule: './Routes',
  },
  {
    path: 'second',
    remote: 'second-microfrontend',
    exposedModule: './Routes',
  },
  {
    path: 'third',
    remote: 'third-microfrontend',
    exposedModule: './Routes',
  },
];
```

Aquí se relacionan tres conceptos:

```text
path           -> URL pública dentro de la shell: /third
remote         -> nombre del remoto del manifiesto: third-microfrontend
exposedModule  -> módulo que se carga del remoto: ./Routes
```

No hay que modificar `open-mova-shell/src/app/app.routes.ts`. Esa ruta ya recorre automáticamente `microfrontends` y crea una ruta Angular por cada entrada.

### 7. Añadir comandos en la raíz

Para poder ejecutar el nuevo MF desde la raíz, añade estos scripts al `package.json` principal:

```json
{
  "scripts": {
    "start:third": "npm --prefix open-mova-mf-third run start",
    "build:third": "npm --prefix open-mova-mf-third run build"
  }
}
```

El `--prefix` hace que npm ejecute el comando dentro de `open-mova-mf-third`, utilizando sus dependencias y su configuración Angular. No convierte el proyecto en un workspace compartido.

### 8. Ejecutar y comprobar el nuevo MF

Instala las dependencias y abre cuatro terminales desde la raíz:

```bash
npm --prefix open-mova-mf-third install
npm run start:first
npm run start:second
npm run start:third
npm start
```

Comprueba primero el remoto de forma independiente:

```text
http://localhost:4500
```

Después comprueba que la shell lo carga:

```text
http://localhost:4200/third/first-route
http://localhost:4200/third/second-route
```

Si aparece una pantalla vacía, revisa en este orden:

1. Que el MF está escuchando en el puerto configurado.
2. Que `http://localhost:4500/remoteEntry.json` responde.
3. Que el nombre de `federation.config.js` coincide con el del manifiesto.
4. Que el manifiesto apunta al puerto correcto.
5. Que `application.config.ts` usa `exposedModule: './Routes'`.
6. Que `src/app/app.routes.ts` exporta `routes`.

No hay que editar `node_modules`, `dist`, `.angular` ni los `package-lock.json` a mano. Son dependencias y artefactos generados de cada proyecto.
