# Próximos pasos de Open Mova

## Situación actual

Open Mova ya cuenta con una base funcional sólida:

- Una shell técnica Angular que carga microfrontales remotos mediante Native Federation.
- Una librería Core con contratos y acceso a las capacidades mediante DI.
- Integración con Capacitor y los plugins oficiales.
- Un CLI para crear, iniciar, compilar y actualizar aplicaciones.
- Una plantilla de microfrontal demo con ejemplos interactivos.
- Publicación de la demo en GitHub Pages.
- Versionado de la shell mediante tags del repositorio.

El siguiente objetivo no debería ser añadir más plugins inmediatamente. La
prioridad es convertir esta base en una plataforma fiable para que otros
equipos puedan crear y mantener aplicaciones sin encontrarse sorpresas.

## 1. Estabilidad y calidad — completado

Esta primera etapa ya está implementada. La calidad se valida tanto en local
como en integración continua y cubre los límites principales entre Core, CLI,
shell y microfrontales.

### Integración continua

El workflow de integración continua comprueba cada pull request y cada cambio
en `main`. Actualmente ejecuta:

- Typecheck de todos los proyectos.
- Build de Core, CLI, shell y template.
- ESLint y comprobación de formato con Prettier.
- Pruebas unitarias y de integración del CLI.
- Prueba de navegador de la shell con un microfrontal remoto real.
- Verificación de que `npm pack` de Core y CLI se puede instalar en un
  proyecto limpio.

### Pruebas automatizadas

Las pruebas automatizadas cubren:

- El catálogo de capacidades nativas de Core.
- Los nombres, la configuración y la compatibilidad entre plataformas del CLI.
- `mova create`.
- `mova mf create` y `mova mf add`.
- `mova update --check`.
- Generación correcta de `mova.config.json`, el manifiesto y las rutas.
- Configuración Android de Gradle, Maps, permisos y `minSdk`.
- Diagnóstico del entorno con `mova doctor`.

Además, una prueba end-to-end arranca la shell y el microfrontal demo en
procesos independientes. Playwright comprueba que el remoto se carga, que sus
rutas funcionan y que recibe las capacidades nativas mediante el singleton de
Core y la inyección de dependencias.

### Formato y linting

ESLint y Prettier están centralizados en el proyecto privado `tooling/`, sin
añadir dependencias a la raíz ni a los paquetes distribuibles. Se pueden
ejecutar con `npm run lint`, `npm run format` y `npm run format:check`, y la CI
impide integrar código que no supere estas comprobaciones.

### Diagnóstico del entorno

`mova doctor` revisa de forma comprensible:

- Versiones de Node, npm y Git.
- Dependencias instaladas.
- Configuración de remotos y uso de HTTPS.
- Android Studio, SDK, `adb` y emuladores.
- Xcode y CocoaPods.
- Plataformas Capacitor añadidas.
- Claves, permisos y versiones compatibles.

El comando distingue errores de avisos y devuelve un código de error cuando
encuentra un problema bloqueante, por lo que puede utilizarse de forma
interactiva o dentro de automatizaciones.

## 2. Compatibilidad y actualizaciones — implementado

La aplicación ya guarda el tag y el commit de la shell con los que fue creada,
`mova update` actualiza la infraestructura técnica y `mova mf update` actualiza
microfrontales gestionados desde la plantilla. La compatibilidad se valida
antes de cargar cada remoto.

Cada MF nuevo declara en `mova.config.json` el rango de `@open-mova/core` que
necesita y publica `assets/open-mova.manifest.json` junto a su
`remoteEntry.json`. La shell obtiene el manifiesto, comprueba el nombre del
remoto, el rango de Core y la versión de contrato antes de importar sus rutas.
Si falla, muestra un error técnico comprensible y no intenta montar el MF.

Core contiene la definición del manifiesto y la comprobación de rangos. El
CLI utiliza `semver` para detectar incompatibilidades antes de aplicar una
actualización de shell. La federación mantiene además `@open-mova/core` como
singleton con versión estricta.

Las actualizaciones deberían quedar separadas por responsabilidad:

| Elemento                  | Mecanismo                                                       |
| ------------------------- | --------------------------------------------------------------- |
| Shell                     | `mova update`                                                   |
| MF creado desde plantilla | `mova mf update`                                                |
| Core                      | Actualización controlada de la dependencia npm                  |
| MF remoto externo         | Responsabilidad del proveedor, con validación de compatibilidad |

Esto evita sobrescribir lógica propia de un proveedor al actualizar la
infraestructura común.

`mova.config.json` usa ahora `schemaVersion: 2`, que declara la compatibilidad
de Core por MF. El CLI migra configuraciones de esquema 1 en memoria y guarda
la migración al ejecutar `mova update`. Las entradas antiguas sin información
de Core reciben temporalmente `*` y `mova doctor` las marca como aviso para
que se actualicen de forma explícita.

Las actualizaciones usan comparación a tres bandas: versión original,
versión nueva y archivos actuales del proveedor. Solo se aplican cambios que
no hayan sido modificados por el proveedor; los conflictos se muestran y
detienen la operación. Se exige un repositorio Git limpio antes de escribir.

## 3. Capacidades nativas seleccionables

La shell incorpora actualmente todos los plugins oficiales de Capacitor. Esto
es útil para la demo y el catálogo, pero tiene consecuencias en una aplicación
real: algunos plugins exigen Android 28, configuración Gradle, claves,
permisos, entitlements o aumentan el tamaño final de la aplicación.

El siguiente diseño recomendable es registrar explícitamente las capacidades
que utiliza cada aplicación:

```json
{
  "native": {
    "capabilities": ["camera", "device", "geolocation"]
  }
}
```

La CLI podría ofrecer comandos como:

```bash
mova cap enable camera geolocation
mova cap disable local-llm
mova cap doctor android
```

La shell mantendría el mismo contrato de `@open-mova/core`, pero cada
aplicación instalaría y configuraría solo las capacidades elegidas. Esto
reduciría el tamaño, los permisos, los requisitos nativos y los problemas de
compilación.

Cada capacidad debería poder declarar también sus requisitos:

- Plataformas compatibles.
- Versión mínima de Android o iOS.
- Permisos necesarios.
- Claves o credenciales.
- Configuración adicional de Gradle, `Info.plist` o entitlements.

## 4. Remotos en producción

Como Open Mova utiliza siempre microfrontales remotos, su entrega y seguridad
son una parte central del framework.

Conviene definir y documentar:

- URLs versionadas, por ejemplo
  `https://cdn.example.com/catalog/1.4.0/remoteEntry.json`.
- Orígenes permitidos para cada aplicación.
- Política CSP y configuración CORS.
- Estrategia de rollback a una versión anterior.
- Comportamiento cuando no hay conexión.

Una aplicación Capacitor que carga MFs remotos no puede garantizar el arranque
offline por defecto. Si se necesita ese comportamiento, habrá que diseñar una
estrategia explícita de caché, fallback y caducidad.

También hay que recordar que un MF remoto se ejecuta dentro de la misma página
que la shell. DI evita acoplamientos técnicos y globals, pero no proporciona
aislamiento de seguridad entre proveedores. Antes de compartir autenticación o
tokens hay que definir qué proveedores son de confianza, qué datos reciben y
qué capacidades nativas pueden solicitar.

## 5. Funcionalidad transversal

Una vez estabilizados los contratos, Core puede crecer con servicios
transversales implementados por la shell:

- Sesión y autenticación.
- Cliente HTTP con token.
- Guards reutilizables.
- Registro de errores y telemetría.
- Configuración de entornos.
- Feature flags.
- Almacenamiento seguro.

La regla de separación debe mantenerse:

- El contrato, guard o interceptor reutilizable vive en Core.
- La implementación ligada al dispositivo, las credenciales o la ejecución
  real vive en la shell.
- La lógica de negocio sigue perteneciendo al proveedor y a sus MFs.

## 6. Evolución del CLI

Los siguientes comandos con más valor serían:

- `mova mf update`: actualizar con seguridad un MF creado desde una plantilla.
- `mova mf build`: compilar un remoto individual.
- `mova config`: consultar y validar la configuración sin editar TypeScript.
- `mova cap permissions`: mostrar permisos, claves y requisitos de las
  capacidades habilitadas.
- `mova deploy`: generar un artefacto de MF listo para el CI del proveedor,
  sin imponer un proveedor de hosting concreto.

El CLI debería seguir siendo relativamente delgado: coordina proyectos,
descarga versiones y prepara la aplicación, pero no debe convertirse en una
segunda implementación de la shell.

## 7. Documentación y demo

La demo debe continuar siendo una documentación interactiva y un posible punto
de partida. Para evitar desincronizaciones, puede generarse parte de su
contenido a partir de `NATIVE_CAPABILITY_API`:

- Métodos disponibles.
- Parámetros y resultados.
- Eventos.
- Permisos requeridos.
- Plataformas compatibles.
- Configuración adicional.
- Ejemplos de uso.

También conviene revisar periódicamente que los README describan el
comportamiento real. Por ejemplo, el README del CLI debe indicar que
`mova update` ya existe y actualiza la infraestructura soportada.

## Orden recomendado

1. Matriz de compatibilidad entre Shell, Core y MFs.
2. Registro seleccionable de capacidades nativas y diagnóstico de permisos.
3. Seguridad, versionado y rollback de MFs remotos.
4. `mova mf update` y gestión de plantillas.
5. Autenticación, HTTP, guards e interceptores en Core.
6. Observabilidad, telemetría y despliegue de microfrontales.

La siguiente versión importante debería centrarse en la fiabilidad de la
plataforma y la experiencia del proveedor, más que en añadir nuevas
capacidades nativas sin cerrar antes su configuración y mantenimiento.

## Política de tags y migración de aplicaciones antiguas

`mova update` necesita descargar tanto la versión actual de la shell como la
versión de destino. Utiliza la versión actual como base de comparación para
detectar qué archivos puede actualizar y qué cambios personalizados del
proveedor deben tratarse como conflictos.

Por este motivo, no se deben eliminar tags históricos que puedan estar
registrados en aplicaciones existentes. Los tags no solo sirven para listar
versiones disponibles: también son necesarios para actualizar de forma segura
una aplicación creada con una versión anterior.

Si una aplicación apunta a un tag que ya no existe, el CLI debe ofrecer en el
futuro un modo de migración controlada que:

- Detecte que falta la versión de origen.
- Cree una copia de seguridad antes de modificar el proyecto.
- Compare o aplique la shell de destino con una estrategia explícita.
- Muestre los posibles conflictos para que el proveedor los revise.
- Actualice el registro de versión y commit en `mova.config.json` solo cuando
  la migración termine correctamente.

Mientras ese modo no exista, la solución segura es restaurar el tag antiguo o
migrar manualmente la aplicación a una shell nueva.
