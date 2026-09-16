import type { NativeCapabilityName } from '@open-mova/core';

export type DemoAction = 'invoke' | 'device-info' | 'camera-photo' | 'camera-gallery';

export interface CapabilityExample {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly code: string;
  readonly action: DemoAction;
  readonly operation?: string;
  readonly options?: Readonly<Record<string, unknown>>;
}

export interface DemoCapability {
  readonly id: string;
  readonly property: NativeCapabilityName;
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly examples: readonly CapabilityExample[];
}

function invoke(
  id: string,
  title: string,
  description: string,
  operation: string,
  options: Readonly<Record<string, unknown>> = {},
): CapabilityExample {
  return {
    id,
    title,
    description,
    action: 'invoke',
    operation,
    options,
    code: `const native = injectNativeCapabilities();

await native.CAPABILITY.invoke('${operation}', ${JSON.stringify(options, null, 2)});`,
  };
}

/**
 * La demo es deliberadamente corta: presenta tres capacidades frecuentes con
 * ejemplos que se pueden ejecutar, no una copia de toda la API de Capacitor.
 */
export const CAPABILITY_CATALOG: readonly DemoCapability[] = [
  {
    id: 'device',
    property: 'device',
    label: 'Device',
    title: 'Device',
    description: 'Consulta información útil del dispositivo y su configuración actual.',
    examples: [
      {
        id: 'device-info',
        title: 'Leer información del dispositivo',
        description: 'Usa el atajo tipado de Open Mova para conocer modelo, plataforma y versión.',
        action: 'device-info',
        code: `const native = injectNativeCapabilities();

const device = await native.device.getInfo();`,
      },
      invoke(
        'device-id',
        'Consultar identificador',
        'Obtiene el identificador que Capacitor expone para este dispositivo.',
        'getId',
      ),
      invoke(
        'device-battery',
        'Consultar batería',
        'Recupera el nivel de batería y si el dispositivo está cargando.',
        'getBatteryInfo',
      ),
      invoke(
        'device-language-code',
        'Consultar código de idioma',
        'Devuelve el código corto del idioma configurado.',
        'getLanguageCode',
      ),
      invoke(
        'device-language-tag',
        'Consultar etiqueta de idioma',
        'Devuelve la etiqueta regional completa del idioma configurado.',
        'getLanguageTag',
      ),
    ],
  },
  {
    id: 'camera',
    property: 'camera',
    label: 'Camera',
    title: 'Camera',
    description: 'Captura una foto o permite seleccionar imágenes desde la galería.',
    examples: [
      {
        id: 'camera-photo',
        title: 'Tomar una foto',
        description: 'Abre la cámara y muestra la fotografía obtenida en esta misma tarjeta.',
        action: 'camera-photo',
        code: `const native = injectNativeCapabilities();

const photo = await native.camera.takePhoto();`,
      },
      {
        id: 'camera-gallery',
        title: 'Elegir una foto',
        description: 'Abre la galería y muestra la imagen seleccionada en esta misma tarjeta.',
        action: 'camera-gallery',
        code: `const native = injectNativeCapabilities();

const photo = await native.camera.choosePhoto();`,
      },
      invoke(
        'camera-permissions',
        'Comprobar permisos',
        'Consulta el estado de los permisos necesarios para usar la cámara.',
        'checkPermissions',
      ),
      invoke(
        'camera-request-permissions',
        'Solicitar permisos',
        'Solicita permisos de cámara y galería cuando aún no se han concedido.',
        'requestPermissions',
      ),
      invoke(
        'camera-images',
        'Elegir varias imágenes',
        'Abre el selector nativo para elegir más de una imagen.',
        'pickImages',
      ),
    ],
  },
  {
    id: 'share',
    property: 'share',
    label: 'Share',
    title: 'Share',
    description: 'Comprueba y abre la hoja nativa para compartir contenido con otras aplicaciones.',
    examples: [
      invoke(
        'share-available',
        'Comprobar si se puede compartir',
        'Verifica que la plataforma puede mostrar opciones para compartir.',
        'canShare',
        { url: 'https://open-mova.dev' },
      ),
      invoke(
        'share-link',
        'Compartir un enlace',
        'Abre las aplicaciones disponibles con un texto y una URL de ejemplo.',
        'share',
        {
          title: 'Open Mova',
          text: 'Capacidades nativas seleccionables desde Open Mova.',
          url: 'https://github.com/rgarciadelongoria/open-mova',
        },
      ),
    ],
  },
];
