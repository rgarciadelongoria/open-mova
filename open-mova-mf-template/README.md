<p align="center">
  <img src="../assets/brand/open-mova-logo-title-rectangle.png" alt="Open Mova" width="720">
</p>

<div align="center">

| Dependencia       | Versión                                          |
| ----------------- | ------------------------------------------------ |
| Node.js           | 22 o posterior                                   |
| npm               | 10 o posterior                                   |
| Angular           | `^21.2.23`                                       |
| Native Federation | `^21.2.6`                                        |
| Capacitor         | No depende directamente; lo proporciona la shell |
| `@open-mova/core` | `^0.2.6`                                         |
| TypeScript        | `^5.9.3`                                         |

</div>

# Microfrontal de demostración

Este es el único proyecto fuente de microfrontal que utiliza el CLI. Se publica
junto con la release del framework en los tags `vX.Y.Z` del monorepo. La shell
de desarrollo lo carga como remoto en `/demo` desde el puerto `4300`.

El proyecto fuente expone `./Routes` y `./Calculator` desde un solo
`remoteEntry.json`. El perfil **demo** es una guía interactiva pequeña de tres capacidades nativas:
Device, Camera y Share. Cada una tiene su propia URL y pruebas ejecutables; el
resultado aparece junto al botón que ha lanzado la prueba. Los ejemplos usan
`injectNativeCapabilities()`; la implementación de Capacitor sigue viviendo en
la shell.

En una aplicación nueva, activa las tres capacidades antes de ejecutar sus
pruebas:

```bash
mova cap enable device camera share
```

Al abrir el MF sin shell se pueden recorrer las tres pantallas, pero las
capacidades se muestran como no disponibles y los ejemplos nativos requieren
abrirlo a través de una shell.

El CLI descarga este proyecto sin mantener una copia propia de la plantilla.
Con `mova create`, lo copia como `mfs/home` con el perfil **demo**. Con
`mova mf create`, usa el mismo proyecto con el perfil **minimal**: sustituye
las rutas de demostración por una única ruta inicial y elimina el ejemplo de
calculadora.

Al crear una aplicación, `mova create` usa este mismo código y tag para
producir dos proyectos independientes: `mfs/home` conserva las rutas de la demo
y muestra una página «Componentes remotos»; `mfs/calculator` expone únicamente
el componente Angular de calculadora en el puerto 4400, sin ruta pública en la
shell. `home` no incluye esa implementación: la carga desde el segundo MF.
La entrada `enabled` y la salida `calculated` muestran cómo intercambiar datos
sin añadir un contrato de negocio a Core. En una aplicación real, esos
contratos pertenecen a los MFs o a una librería propia.

También puedes crear un microfrontal con la demo explícitamente:

```bash
mova mf create catalog --demo
```

El perfil demo debe usar el mismo tag que la shell de la aplicación. El perfil
mínimo de `mova mf create` genera por defecto una ruta y un componente Angular
genérico. `--routes-only` conserva solo la ruta y `--component-only` conserva
solo el componente con una previsualización local. El nombre del componente se
personaliza con `--component-name`; el de la ruta, con `--route`. El componente
genérico vive en `src/app/components/starter/` en esta fuente y el CLI lo
renombra al crear el MF. Ningún perfil mínimo incorpora la calculadora demo.

## Desarrollo local

```bash
npm install
npm start
```

Después inicia la shell y abre `http://localhost:4200/demo/inicio`. Las demás
rutas se generan a partir de `capability-catalog.ts`; por ejemplo,
`http://localhost:4200/demo/camera` o `http://localhost:4200/demo/share`.
Para verificar este proyecto: `npm run typecheck` y `npm run build`.
Para probar la comunicación entre dos MF en una app generada, ejecuta
`mova start` desde esa aplicación y abre `/home/componentes`.

## Estructura del código

Las rutas se mantienen en `src/app/app.routes.ts` y solo enlazan cada URL con
su componente. La implementación está separada por responsabilidad:

```text
src/app/
├── app.routes.ts
├── components/calculator/      # Componente standalone expuesto por el remoto
├── components/starter/         # Componente genérico que el CLI adapta en perfiles mínimos
├── capabilities/
│   └── capability-catalog.ts
├── layout/
│   ├── demo-layout.component.ts
│   └── demo-layout.component.html
└── pages/
    ├── home/
    │   ├── home.component.ts
    │   ├── home.component.html
    │   └── home.component.css
    └── capability/
    │   ├── capability-page.component.ts
    │   ├── capability-page.component.html
    │   └── capability-page.component.css
    └── remote-component/        # Página que consume calculator.main
```

`capability-catalog.ts` contiene los textos, ejemplos ejecutables, orden del
menú y URLs de Device, Camera y Share. `app.routes.ts` crea una ruta por cada
entrada y `capability-page.component` presenta la capacidad y muestra el
resultado junto al ejemplo que se ha ejecutado. Esto evita duplicar componentes
casi idénticos.

Los estilos de demostración están en `layout/demo-layout.component.css`. No se
usan estilos globales del proyecto porque, al cargar el MF como remoto, Native
Federation no garantiza que la shell incorpore su hoja global. El layout viaja
con las rutas del remoto y aplica los estilos dentro de `.page-shell`.

El favicon está en `src/assets/favicon.png`. Se genera a partir del logo de
Open Mova y Angular lo publica como `assets/favicon.png`.
