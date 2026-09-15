import { InjectionToken, inject } from '@angular/core';

/**
 * Superficie oficial que Open Mova expone para cada plugin de Capacitor.
 * La demo consume también este catálogo para no mantener una segunda lista.
 */
export const NATIVE_CAPABILITY_API = {
  actionSheet: { operations: ['showActions'], events: [] },
  app: {
    operations: [
      'exitApp',
      'getInfo',
      'getState',
      'getLaunchUrl',
      'minimizeApp',
      'getAppLanguage',
      'toggleBackButtonHandler',
      'removeAllListeners',
    ],
    events: [
      'appStateChange',
      'pause',
      'resume',
      'appUrlOpen',
      'appRestoredResult',
      'backButton',
    ],
  },
  appLauncher: { operations: ['canOpenUrl', 'openUrl'], events: [] },
  backgroundRunner: {
    operations: [
      'checkPermissions',
      'requestPermissions',
      'dispatchEvent',
      'removeNotificationListeners',
    ],
    events: ['backgroundRunnerNotificationReceived'],
  },
  barcodeScanner: { operations: ['scanBarcode'], events: [] },
  browser: {
    operations: ['open', 'close', 'removeAllListeners'],
    events: ['browserFinished', 'browserPageLoaded'],
  },
  calendar: {
    operations: [
      'checkPermissions',
      'requestPermissions',
      'createEvent',
      'createEventInteractively',
      'modifyEvent',
      'findEvents',
      'deleteEvent',
      'listCalendars',
      'createCalendar',
      'deleteCalendar',
      'openCalendar',
    ],
    events: [],
  },
  camera: {
    operations: [
      'takePhoto',
      'recordVideo',
      'playVideo',
      'chooseFromGallery',
      'editPhoto',
      'editURIPhoto',
      'pickLimitedLibraryPhotos',
      'getLimitedLibraryPhotos',
      'checkPermissions',
      'requestPermissions',
      'getPhoto',
      'pickImages',
    ],
    events: [],
  },
  clipboard: { operations: ['write', 'read'], events: [] },
  contacts: { operations: ['find', 'save', 'remove', 'pickContact'], events: [] },
  cookies: {
    operations: ['getCookies', 'setCookie', 'deleteCookie', 'clearCookies', 'clearAllCookies'],
    events: [],
  },
  device: {
    operations: ['getId', 'getInfo', 'getBatteryInfo', 'getLanguageCode', 'getLanguageTag'],
    events: [],
  },
  dialog: { operations: ['alert', 'prompt', 'confirm'], events: [] },
  fileTransfer: {
    operations: ['downloadFile', 'uploadFile', 'removeAllListeners'],
    events: ['progress'],
  },
  fileViewer: {
    operations: [
      'openDocumentFromLocalPath',
      'openDocumentFromResources',
      'openDocumentFromUrl',
      'previewMediaContentFromLocalPath',
      'previewMediaContentFromResources',
      'previewMediaContentFromUrl',
    ],
    events: [],
  },
  filesystem: {
    operations: [
      'checkPermissions',
      'requestPermissions',
      'readFile',
      'readFileInChunks',
      'writeFile',
      'appendFile',
      'deleteFile',
      'mkdir',
      'rmdir',
      'readdir',
      'getUri',
      'stat',
      'rename',
      'copy',
      'downloadFile',
      'removeAllListeners',
    ],
    events: ['progress'],
  },
  geolocation: {
    operations: [
      'getCurrentPosition',
      'watchPosition',
      'clearWatch',
      'checkPermissions',
      'requestPermissions',
    ],
    events: [],
  },
  googleMaps: {
    operations: [
      'create',
      'enableTouch',
      'disableTouch',
      'enableClustering',
      'disableClustering',
      'addTileOverlay',
      'removeTileOverlay',
      'addMarker',
      'addMarkers',
      'removeMarker',
      'removeMarkers',
      'addPolygons',
      'removePolygons',
      'addCircles',
      'removeCircles',
      'addPolylines',
      'removePolylines',
      'destroy',
      'setCamera',
      'getMapType',
      'setMapType',
      'enableIndoorMaps',
      'enableTrafficLayer',
      'enableAccessibilityElements',
      'enableCurrentLocation',
      'setPadding',
      'getMapBounds',
      'fitBounds',
      'removeAllMapListeners',
    ],
    events: [
      'boundsChanged',
      'cameraIdle',
      'cameraMoveStarted',
      'clusterClick',
      'clusterInfoWindowClick',
      'infoWindowClick',
      'mapClick',
      'markerClick',
      'polygonClick',
      'circleClick',
      'polylineClick',
      'markerDragStart',
      'markerDrag',
      'markerDragEnd',
      'myLocationButtonClick',
      'myLocationClick',
    ],
  },
  haptics: {
    operations: [
      'impact',
      'notification',
      'vibrate',
      'selectionStart',
      'selectionChanged',
      'selectionEnd',
    ],
    events: [],
  },
  healthFitness: {
    operations: [
      'requestHealthPermissions',
      'getData',
      'getWorkoutData',
      'writeData',
      'getLastRecord',
      'setBackgroundJob',
      'deleteBackgroundJob',
      'listBackgroundJobs',
      'updateBackgroundJob',
      'disconnectFromHealthConnect',
      'openHealthConnect',
    ],
    events: [],
  },
  http: { operations: ['request', 'get', 'post', 'put', 'patch', 'delete'], events: [] },
  inAppBrowser: {
    operations: [
      'openInWebView',
      'openInSystemBrowser',
      'openInExternalBrowser',
      'close',
      'removeAllListeners',
    ],
    events: ['browserPageLoaded', 'browserPageNavigationCompleted', 'browserClosed'],
  },
  keyboard: {
    operations: [
      'show',
      'hide',
      'setAccessoryBarVisible',
      'setScroll',
      'setStyle',
      'setResizeMode',
      'getResizeMode',
      'removeAllListeners',
    ],
    events: ['keyboardWillShow', 'keyboardDidShow', 'keyboardWillHide', 'keyboardDidHide'],
  },
  localLlm: {
    operations: [
      'systemAvailability',
      'download',
      'prompt',
      'endSession',
      'generateImage',
      'warmup',
      'removeAllListeners',
    ],
    events: ['systemAvailabilityChange'],
  },
  localNotifications: {
    operations: [
      'schedule',
      'update',
      'getPending',
      'registerActionTypes',
      'cancel',
      'cancelAll',
      'areEnabled',
      'getDeliveredNotifications',
      'removeDeliveredNotifications',
      'removeDeliveredNotificationsById',
      'removeAllDeliveredNotifications',
      'getByIds',
      'getAll',
      'createChannel',
      'deleteChannel',
      'listChannels',
      'checkPermissions',
      'requestPermissions',
      'changeExactNotificationSetting',
      'checkExactNotificationSetting',
      'removeAllListeners',
    ],
    events: ['localNotificationReceived', 'localNotificationActionPerformed'],
  },
  motion: { operations: ['removeAllListeners'], events: ['accel', 'orientation'] },
  network: { operations: ['getStatus', 'removeAllListeners'], events: ['networkStatusChange'] },
  preferences: {
    operations: ['configure', 'get', 'set', 'remove', 'clear', 'keys', 'migrate', 'removeOld'],
    events: [],
  },
  privacyScreen: { operations: ['enable', 'disable', 'isEnabled'], events: [] },
  pushNotifications: {
    operations: [
      'register',
      'unregister',
      'getDeliveredNotifications',
      'removeDeliveredNotifications',
      'removeAllDeliveredNotifications',
      'createChannel',
      'deleteChannel',
      'listChannels',
      'checkPermissions',
      'requestPermissions',
      'removeAllListeners',
    ],
    events: [
      'registration',
      'registrationError',
      'pushNotificationReceived',
      'pushNotificationActionPerformed',
    ],
  },
  screenOrientation: {
    operations: ['orientation', 'lock', 'unlock', 'removeAllListeners'],
    events: ['screenOrientationChange'],
  },
  screenReader: {
    operations: ['isEnabled', 'speak', 'removeAllListeners'],
    events: ['stateChange'],
  },
  share: { operations: ['canShare', 'share'], events: [] },
  splashScreen: { operations: ['show', 'hide'], events: [] },
  statusBar: {
    operations: [
      'setStyle',
      'setBackgroundColor',
      'show',
      'hide',
      'getInfo',
      'setOverlaysWebView',
    ],
    events: ['statusBarVisibilityChanged', 'statusBarOverlayChanged'],
  },
  systemBars: { operations: ['setStyle', 'show', 'hide', 'setAnimation'], events: [] },
  textZoom: { operations: ['get', 'getPreferred', 'set'], events: [] },
  toast: { operations: ['show'], events: [] },
} as const;

export type NativeCapabilityName = keyof typeof NATIVE_CAPABILITY_API;
export type NativeOperation<TName extends NativeCapabilityName> =
  (typeof NATIVE_CAPABILITY_API)[TName]['operations'][number];
export type NativeEvent<TName extends NativeCapabilityName> =
  (typeof NATIVE_CAPABILITY_API)[TName]['events'][number];

/** Options passed across the shell boundary, including non-JSON native values. */
export type NativeOptions = Readonly<Record<string, unknown>>;

export interface NativeSubscription {
  remove(): Promise<void>;
}

/** Capacitor stays private to the shell behind this stable public contract. */
export interface NativePluginCapability<
  TOperation extends string = string,
  TEvent extends string = never,
> {
  isAvailable(): boolean;
  invoke<TResult = unknown>(operation: TOperation, options?: NativeOptions): Promise<TResult>;
  subscribe(
    event: TEvent,
    listener: (payload: unknown) => void,
    options?: NativeOptions,
  ): Promise<NativeSubscription>;
}

type Capability<TName extends NativeCapabilityName> = NativePluginCapability<
  NativeOperation<TName>,
  NativeEvent<TName>
>;

export interface DeviceDetails {
  readonly model: string;
  readonly platform: 'ios' | 'android' | 'web';
  readonly osVersion: string;
}

export interface DeviceCapability extends Capability<'device'> {
  getInfo(): Promise<DeviceDetails>;
}

export interface PhotoResult {
  readonly webPath?: string;
  readonly uri?: string;
}

export interface CameraCapability extends Capability<'camera'> {
  takePhoto(): Promise<PhotoResult>;
  choosePhoto(): Promise<PhotoResult | undefined>;
}

export interface ActionSheetCapability extends Capability<'actionSheet'> {}
export interface AppCapability extends Capability<'app'> {}
export interface AppLauncherCapability extends Capability<'appLauncher'> {}
export interface BackgroundRunnerCapability extends Capability<'backgroundRunner'> {}
export interface BarcodeScannerCapability extends Capability<'barcodeScanner'> {}
export interface BrowserCapability extends Capability<'browser'> {}
export interface CalendarCapability extends Capability<'calendar'> {}
export interface ClipboardCapability extends Capability<'clipboard'> {}
export interface ContactsCapability extends Capability<'contacts'> {}
/** Cookies is bundled in @capacitor/core. */
export interface CookiesCapability extends Capability<'cookies'> {}
export interface DialogCapability extends Capability<'dialog'> {}
export interface FileTransferCapability extends Capability<'fileTransfer'> {}
export interface FileViewerCapability extends Capability<'fileViewer'> {}
export interface FilesystemCapability extends Capability<'filesystem'> {}
export interface GeolocationCapability extends Capability<'geolocation'> {}
/** Google Maps keeps stateful map instances inside the shell. */
export interface GoogleMapsCapability extends Capability<'googleMaps'> {}
export interface HapticsCapability extends Capability<'haptics'> {}
export interface HealthFitnessCapability extends Capability<'healthFitness'> {}
/** HTTP is bundled in @capacitor/core. */
export interface HttpCapability extends Capability<'http'> {}
export interface InAppBrowserCapability extends Capability<'inAppBrowser'> {}
export interface KeyboardCapability extends Capability<'keyboard'> {}
/** Experimental Capacitor plugin. Always call isAvailable before invoking it. */
export interface LocalLlmCapability extends Capability<'localLlm'> {}
export interface LocalNotificationsCapability extends Capability<'localNotifications'> {}
export interface MotionCapability extends Capability<'motion'> {}
export interface NetworkCapability extends Capability<'network'> {}
export interface PreferencesCapability extends Capability<'preferences'> {}
export interface PrivacyScreenCapability extends Capability<'privacyScreen'> {}
export interface PushNotificationsCapability extends Capability<'pushNotifications'> {}
export interface ScreenOrientationCapability extends Capability<'screenOrientation'> {}
export interface ScreenReaderCapability extends Capability<'screenReader'> {}
export interface ShareCapability extends Capability<'share'> {}
export interface SplashScreenCapability extends Capability<'splashScreen'> {}
export interface StatusBarCapability extends Capability<'statusBar'> {}
/** System Bars is bundled in @capacitor/core and supersedes Status Bar for edge-to-edge layouts. */
export interface SystemBarsCapability extends Capability<'systemBars'> {}
export interface TextZoomCapability extends Capability<'textZoom'> {}
export interface ToastCapability extends Capability<'toast'> {}

export interface NativeCapabilities {
  /** Version 1 remains compatible with the original Device and Camera contract. */
  readonly version: 1;
  readonly actionSheet: ActionSheetCapability;
  readonly app: AppCapability;
  readonly appLauncher: AppLauncherCapability;
  readonly backgroundRunner: BackgroundRunnerCapability;
  readonly barcodeScanner: BarcodeScannerCapability;
  readonly browser: BrowserCapability;
  readonly calendar: CalendarCapability;
  readonly camera: CameraCapability;
  readonly clipboard: ClipboardCapability;
  readonly contacts: ContactsCapability;
  readonly cookies: CookiesCapability;
  readonly device: DeviceCapability;
  readonly dialog: DialogCapability;
  readonly fileTransfer: FileTransferCapability;
  readonly fileViewer: FileViewerCapability;
  readonly filesystem: FilesystemCapability;
  readonly geolocation: GeolocationCapability;
  readonly googleMaps: GoogleMapsCapability;
  readonly haptics: HapticsCapability;
  readonly healthFitness: HealthFitnessCapability;
  readonly http: HttpCapability;
  readonly inAppBrowser: InAppBrowserCapability;
  readonly keyboard: KeyboardCapability;
  readonly localLlm: LocalLlmCapability;
  readonly localNotifications: LocalNotificationsCapability;
  readonly motion: MotionCapability;
  readonly network: NetworkCapability;
  readonly preferences: PreferencesCapability;
  readonly privacyScreen: PrivacyScreenCapability;
  readonly pushNotifications: PushNotificationsCapability;
  readonly screenOrientation: ScreenOrientationCapability;
  readonly screenReader: ScreenReaderCapability;
  readonly share: ShareCapability;
  readonly splashScreen: SplashScreenCapability;
  readonly statusBar: StatusBarCapability;
  readonly systemBars: SystemBarsCapability;
  readonly textZoom: TextZoomCapability;
  readonly toast: ToastCapability;
}

// Shell y remotos deben compartir una sola instancia de este token.
export const NATIVE_CAPABILITIES = new InjectionToken<NativeCapabilities>(
  'Open Mova native capabilities',
);

export function injectNativeCapabilities(): NativeCapabilities {
  const capabilities = inject(NATIVE_CAPABILITIES);

  if (capabilities.version !== 1) {
    throw new Error('La shell no ofrece el contrato nativo Open Mova v1.');
  }

  return capabilities;
}
