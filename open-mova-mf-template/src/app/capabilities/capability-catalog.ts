import {
  NATIVE_CAPABILITY_API,
  type NativeCapabilityName,
} from '@open-mova/core';

export type DemoAction = 'invoke' | 'device-info' | 'camera-photo';

export interface CapabilityExample {
  readonly title: string;
  readonly description: string;
  readonly code: string;
  readonly action: DemoAction;
  readonly operation?: string;
  readonly options?: Readonly<Record<string, unknown>>;
  readonly runnable?: boolean;
  readonly note?: string;
}

export interface DemoCapability {
  readonly id: string;
  readonly property: NativeCapabilityName;
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly examples: readonly CapabilityExample[];
  readonly operations: readonly string[];
  readonly events: readonly string[];
}

const invoke = (
  title: string,
  description: string,
  operation: string,
  options: Readonly<Record<string, unknown>> = {},
  runnable = false,
  note?: string,
): CapabilityExample => ({
  title,
  description,
  action: 'invoke',
  operation,
  options,
  runnable,
  note,
  code: `const native = injectNativeCapabilities();\n\nawait native.CAPABILITY.invoke('${operation}', ${JSON.stringify(options, null, 2)});`,
});

// The order deliberately follows Capacitor's official API navigation.
const CAPABILITY_SUMMARIES: readonly Omit<DemoCapability, 'operations' | 'events'>[] = [
  { id: 'action-sheet', property: 'actionSheet', label: 'Action Sheet', title: 'Action Sheet', description: 'Muestra una lista de acciones nativa para que la persona elija una opción.', examples: [invoke('Mostrar acciones', 'Presenta las acciones más relevantes de una tarea.', 'showActions', { title: 'Acciones', options: [{ title: 'Guardar' }, { title: 'Cancelar' }] }, true)] },
  { id: 'app-launcher', property: 'appLauncher', label: 'App Launcher', title: 'App Launcher', description: 'Comprueba o abre otra aplicación instalada en el dispositivo.', examples: [invoke('Comprobar una URL', 'Antes de abrir otra aplicación, comprueba que puede gestionar la URL.', 'canOpenUrl', { url: 'https://capacitorjs.com' }, true)] },
  { id: 'app', property: 'app', label: 'App', title: 'App', description: 'Expone el estado, la información y los eventos del ciclo de vida de la aplicación.', examples: [invoke('Consultar información', 'Obtiene el identificador, nombre y versión de la aplicación.', 'getInfo', {}, true)] },
  { id: 'background-runner', property: 'backgroundRunner', label: 'Background Runner', title: 'Background Runner', description: 'Coordina tareas de fondo definidas por la aplicación nativa.', examples: [invoke('Comprobar permisos', 'Consulta si la tarea en segundo plano puede ejecutarse.', 'checkPermissions', {}, true, 'Requiere configuración nativa de tareas de fondo.')] },
  { id: 'barcode-scanner', property: 'barcodeScanner', label: 'Barcode Scanner', title: 'Barcode Scanner', description: 'Lee códigos de barras y códigos QR con la cámara.', examples: [invoke('Escanear un código', 'Abre el escáner nativo y devuelve el contenido detectado.', 'scanBarcode', {}, true, 'Requiere permiso de cámara.')] },
  { id: 'browser', property: 'browser', label: 'Browser', title: 'Browser', description: 'Abre contenido web dentro del navegador del sistema.', examples: [invoke('Abrir una página', 'Muestra una URL en el navegador integrado del sistema.', 'open', { url: 'https://capacitorjs.com' }, false, 'El ejemplo no abre una ventana automáticamente.')] },
  { id: 'calendar', property: 'calendar', label: 'Calendar', title: 'Calendar', description: 'Consulta y crea eventos en los calendarios del dispositivo.', examples: [invoke('Comprobar permisos', 'Comprueba el acceso antes de leer o crear eventos.', 'checkPermissions', {}, true)] },
  { id: 'camera', property: 'camera', label: 'Camera', title: 'Camera', description: 'Captura una foto o permite elegir imágenes de la galería.', examples: [{ title: 'Tomar una foto', description: 'Usa el método simplificado del contrato de Open Mova.', action: 'camera-photo', runnable: true, code: 'const native = injectNativeCapabilities();\n\nconst photo = await native.camera.takePhoto();\nconsole.log(photo.webPath);' }, invoke('Elegir imágenes', 'Abre el selector de fotografías del dispositivo.', 'pickImages', {}, true)] },
  { id: 'clipboard', property: 'clipboard', label: 'Clipboard', title: 'Clipboard', description: 'Lee y escribe contenido en el portapapeles del sistema.', examples: [invoke('Copiar texto', 'Guarda texto para poder pegarlo en otra aplicación.', 'write', { string: 'Hola desde Open Mova' }, true), invoke('Leer texto', 'Recupera el contenido textual del portapapeles.', 'read', {}, true)] },
  { id: 'contacts', property: 'contacts', label: 'Contacts', title: 'Contacts', description: 'Busca, selecciona y gestiona contactos del dispositivo.', examples: [invoke('Elegir un contacto', 'Muestra el selector de contactos del sistema.', 'pickContact', {}, true, 'Requiere permiso de contactos.')] },
  { id: 'cookies', property: 'cookies', label: 'Cookies', title: 'Cookies', description: 'Gestiona cookies desde la capa web de Capacitor.', examples: [invoke('Leer cookies', 'Obtiene las cookies asociadas a una URL.', 'getCookies', { url: 'https://example.com' }, true)] },
  { id: 'device', property: 'device', label: 'Device', title: 'Device', description: 'Obtiene información básica y segura sobre el dispositivo actual.', examples: [{ title: 'Leer el dispositivo', description: 'Usa el método simplificado del contrato de Open Mova.', action: 'device-info', runnable: true, code: 'const native = injectNativeCapabilities();\n\nconst device = await native.device.getInfo();\nconsole.log(device.platform);' }, invoke('Consultar idioma', 'Recupera el código de idioma configurado.', 'getLanguageCode', {}, true)] },
  { id: 'dialog', property: 'dialog', label: 'Dialog', title: 'Dialog', description: 'Muestra alertas, confirmaciones y cuadros de texto nativos.', examples: [invoke('Mostrar alerta', 'Informa de una acción terminada mediante un diálogo del sistema.', 'alert', { title: 'Open Mova', message: 'La operación ha terminado.' }, true)] },
  { id: 'file-transfer', property: 'fileTransfer', label: 'File Transfer', title: 'File Transfer', description: 'Descarga y sube archivos con seguimiento de progreso.', examples: [invoke('Descargar un archivo', 'Inicia una descarga hacia una URI gestionada por Filesystem.', 'downloadFile', { url: 'https://example.com/file.pdf', path: 'file:///documents/file.pdf' }, false, 'Necesita una URI de destino válida del dispositivo.')] },
  { id: 'file-viewer', property: 'fileViewer', label: 'File Viewer', title: 'File Viewer', description: 'Abre documentos y contenido multimedia con el visor nativo.', examples: [invoke('Abrir desde una URL', 'Solicita al visor del sistema que abra un documento remoto.', 'openDocumentFromUrl', { url: 'https://example.com/document.pdf' }, false, 'Requiere una URL de documento accesible.')] },
  { id: 'filesystem', property: 'filesystem', label: 'Filesystem', title: 'Filesystem', description: 'Lee, escribe y organiza ficheros en el almacenamiento de la aplicación.', examples: [invoke('Comprobar permisos', 'Verifica el acceso antes de operar sobre archivos.', 'checkPermissions', {}, true), invoke('Leer un archivo', 'Lee el contenido de una ruta conocida.', 'readFile', { path: 'example.txt', directory: 'DOCUMENTS' }, false)] },
  { id: 'geolocation', property: 'geolocation', label: 'Geolocation', title: 'Geolocation', description: 'Obtiene la ubicación actual y permite observar cambios de posición.', examples: [invoke('Obtener ubicación', 'Solicita la posición actual con el permiso de la persona.', 'getCurrentPosition', {}, true, 'Requiere permiso de ubicación.')] },
  { id: 'google-maps', property: 'googleMaps', label: 'Google Maps', title: 'Google Maps', description: 'Crea y controla mapas nativos de Google Maps.', examples: [invoke('Crear un mapa', 'Crea una instancia sobre un elemento configurado por la aplicación.', 'create', { id: 'map' }, false, 'Requiere API key y un elemento HTML nativo.')] },
  { id: 'haptics', property: 'haptics', label: 'Haptics', title: 'Haptics', description: 'Aporta respuesta táctil a interacciones importantes.', examples: [invoke('Impacto medio', 'Emite una vibración breve de intensidad media.', 'impact', { style: 'MEDIUM' }, true), invoke('Vibrar', 'Activa una vibración de duración controlada.', 'vibrate', { duration: 300 }, true)] },
  { id: 'health-fitness', property: 'healthFitness', label: 'Health Fitness', title: 'Health Fitness', description: 'Consulta y registra datos de salud y actividad con autorización explícita.', examples: [invoke('Listar tareas de fondo', 'Consulta las tareas de seguimiento de salud configuradas.', 'listBackgroundJobs', {}, true, 'La lectura y escritura de datos requiere autorización específica por plataforma.')] },
  { id: 'http', property: 'http', label: 'Http', title: 'Http', description: 'Realiza solicitudes HTTP mediante la capa nativa de Capacitor.', examples: [invoke('Solicitud GET', 'Ejecuta una petición HTTP nativa a un endpoint.', 'get', { url: 'https://example.com/api' }, false, 'Usa un endpoint real de tu aplicación.')] },
  { id: 'in-app-browser', property: 'inAppBrowser', label: 'InAppBrowser', title: 'InAppBrowser', description: 'Muestra contenido web en una vista embebida o navegador del sistema.', examples: [invoke('Abrir en navegador del sistema', 'Abre una URL fuera de la aplicación.', 'openInSystemBrowser', { url: 'https://capacitorjs.com' }, false)] },
  { id: 'keyboard', property: 'keyboard', label: 'Keyboard', title: 'Keyboard', description: 'Controla el teclado nativo y escucha sus cambios de visibilidad.', examples: [invoke('Ocultar teclado', 'Pide al sistema cerrar el teclado cuando sea posible.', 'hide', {}, true)] },
  { id: 'local-llm', property: 'localLlm', label: 'Local LLM', title: 'Local LLM', description: 'Accede a modelos de lenguaje locales cuando la plataforma los ofrece.', examples: [invoke('Comprobar disponibilidad', 'Consulta si hay un modelo local disponible.', 'systemAvailability', {}, true, 'Capacidad experimental y dependiente del dispositivo.')] },
  { id: 'local-notifications', property: 'localNotifications', label: 'Local Notifications', title: 'Local Notifications', description: 'Programa notificaciones que se muestran localmente en el dispositivo.', examples: [invoke('Comprobar permisos', 'Consulta el permiso antes de programar una notificación.', 'checkPermissions', {}, true), invoke('Programar aviso', 'Programa una notificación local sencilla.', 'schedule', { notifications: [{ title: 'Open Mova', body: 'Recordatorio de ejemplo', id: 1 }] }, false)] },
  { id: 'motion', property: 'motion', label: 'Motion', title: 'Motion', description: 'Escucha aceleración y orientación del dispositivo.', examples: [] },
  { id: 'network', property: 'network', label: 'Network', title: 'Network', description: 'Consulta el estado de conexión y escucha cambios de red.', examples: [invoke('Consultar conexión', 'Obtiene si el dispositivo está conectado y el tipo de red.', 'getStatus', {}, true)] },
  { id: 'preferences', property: 'preferences', label: 'Preferences', title: 'Preferences', description: 'Guarda preferencias ligeras y persistentes de la aplicación.', examples: [invoke('Guardar preferencia', 'Almacena una configuración simple por clave.', 'set', { key: 'theme', value: 'dark' }, true), invoke('Leer preferencia', 'Recupera una preferencia almacenada.', 'get', { key: 'theme' }, true)] },
  { id: 'privacy-screen', property: 'privacyScreen', label: 'Privacy Screen', title: 'Privacy Screen', description: 'Protege visualmente la aplicación cuando pasa a segundo plano.', examples: [invoke('Activar privacidad', 'Evita que el contenido se vea en la vista de aplicaciones recientes.', 'enable', {}, true)] },
  { id: 'push-notifications', property: 'pushNotifications', label: 'Push Notifications', title: 'Push Notifications', description: 'Registra la aplicación para recibir notificaciones remotas.', examples: [invoke('Comprobar permisos', 'Consulta el permiso antes de registrar el dispositivo.', 'checkPermissions', {}, true, 'Requiere configuración de Firebase/APNs en la aplicación nativa.')] },
  { id: 'screen-orientation', property: 'screenOrientation', label: 'Screen Orientation', title: 'Screen Orientation', description: 'Consulta, bloquea y libera la orientación de la pantalla.', examples: [invoke('Consultar orientación', 'Obtiene la orientación actual del dispositivo.', 'orientation', {}, true), invoke('Bloquear vertical', 'Fija la pantalla en vertical.', 'lock', { orientation: 'portrait' }, true)] },
  { id: 'screen-reader', property: 'screenReader', label: 'Screen Reader', title: 'Screen Reader', description: 'Mejora la accesibilidad comprobando y anunciando texto al lector de pantalla.', examples: [invoke('Comprobar lector', 'Indica si el lector de pantalla está activo.', 'isEnabled', {}, true), invoke('Anunciar mensaje', 'Lee un mensaje mediante las tecnologías de asistencia.', 'speak', { value: 'Ejemplo de Open Mova' }, true)] },
  { id: 'share', property: 'share', label: 'Share', title: 'Share', description: 'Abre la hoja nativa para compartir texto, enlaces y archivos.', examples: [invoke('Compartir enlace', 'Muestra las aplicaciones disponibles para compartir.', 'share', { title: 'Open Mova', text: 'Capacidades sin complicaciones', url: 'https://github.com/rgarciadelongoria/open-mova' }, true)] },
  { id: 'splash-screen', property: 'splashScreen', label: 'Splash Screen', title: 'Splash Screen', description: 'Controla la pantalla de carga nativa al iniciar la aplicación.', examples: [invoke('Ocultar pantalla de carga', 'Cierra la pantalla de inicio si sigue visible.', 'hide', {}, true)] },
  { id: 'status-bar', property: 'statusBar', label: 'Status Bar', title: 'Status Bar', description: 'Configura el aspecto y la visibilidad de la barra de estado.', examples: [invoke('Consultar barra', 'Obtiene la configuración actual de la barra de estado.', 'getInfo', {}, true), invoke('Aplicar estilo oscuro', 'Pide iconos oscuros sobre fondo claro.', 'setStyle', { style: 'DARK' }, true)] },
  { id: 'system-bars', property: 'systemBars', label: 'System Bars', title: 'System Bars', description: 'Controla las barras del sistema en diseños Android edge-to-edge.', examples: [invoke('Mostrar barras', 'Restaura las barras del sistema.', 'show', {}, true, 'Disponible en Android según la configuración nativa.')] },
  { id: 'text-zoom', property: 'textZoom', label: 'Text Zoom', title: 'Text Zoom', description: 'Respeta y ajusta el tamaño de texto preferido en Android.', examples: [invoke('Leer zoom preferido', 'Obtiene el porcentaje de zoom elegido por la persona.', 'getPreferred', {}, true)] },
  { id: 'toast', property: 'toast', label: 'Toast', title: 'Toast', description: 'Muestra un mensaje breve no bloqueante mediante el sistema.', examples: [invoke('Mostrar mensaje', 'Confirma una acción con un toast nativo.', 'show', { text: 'Hola desde Open Mova', duration: 'SHORT' }, true)] },
];

/**
 * Métodos y eventos proceden del contrato de Core. Así la documentación
 * interactiva no puede quedarse desincronizada respecto al framework.
 */
export const CAPABILITY_CATALOG: readonly DemoCapability[] = CAPABILITY_SUMMARIES.map(
  (capability) => ({
    ...capability,
    operations: NATIVE_CAPABILITY_API[capability.property].operations,
    events: NATIVE_CAPABILITY_API[capability.property].events,
  }),
);
