import { InjectionToken, inject } from '@angular/core';

/**
 * Options passed across the framework boundary. Some official plugins need
 * platform values such as Date, Blob or an element reference, so this cannot
 * be restricted to JSON alone.
 */
export type NativeOptions = Readonly<Record<string, unknown>>;

export interface NativeSubscription {
  remove(): Promise<void>;
}

/**
 * Base contract shared by every plugin capability. Capacitor stays private to
 * the shell, so this public API can be versioned independently.
 */
export interface NativePluginCapability<
  TOperation extends string = string,
  TEvent extends string = never,
> {
  isAvailable(): boolean;
  invoke<TResult = unknown>(
    operation: TOperation,
    options?: NativeOptions,
  ): Promise<TResult>;
  subscribe(
    event: TEvent,
    listener: (payload: unknown) => void,
  ): Promise<NativeSubscription>;
}

type ExtensibleOperation<TKnown extends string> = TKnown | (string & {});

export interface DeviceDetails {
  readonly model: string;
  readonly platform: 'ios' | 'android' | 'web';
  readonly osVersion: string;
}

export interface DeviceCapability
  extends NativePluginCapability<
    ExtensibleOperation<
      'getId' | 'getInfo' | 'getBatteryInfo' | 'getLanguageCode' | 'getLanguageTag'
    >
  > {
  getInfo(): Promise<DeviceDetails>;
}

export interface PhotoResult {
  readonly webPath?: string;
  readonly uri?: string;
}

export interface CameraCapability
  extends NativePluginCapability<
    ExtensibleOperation<
      | 'takePhoto'
      | 'recordVideo'
      | 'playVideo'
      | 'chooseFromGallery'
      | 'editPhoto'
      | 'editURIPhoto'
      | 'pickLimitedLibraryPhotos'
      | 'getLimitedLibraryPhotos'
      | 'checkPermissions'
      | 'requestPermissions'
      | 'getPhoto'
      | 'pickImages'
    >
  > {
  takePhoto(): Promise<PhotoResult>;
  choosePhoto(): Promise<PhotoResult | undefined>;
}

export interface ActionSheetCapability
  extends NativePluginCapability<ExtensibleOperation<'showActions'>> {}
export interface AppLauncherCapability
  extends NativePluginCapability<ExtensibleOperation<'canOpenUrl' | 'openUrl'>> {}
export interface AppCapability
  extends NativePluginCapability<
    ExtensibleOperation<
      | 'exitApp'
      | 'getInfo'
      | 'getState'
      | 'getLaunchUrl'
      | 'minimizeApp'
      | 'getAppLanguage'
      | 'toggleBackButtonHandler'
      | 'removeAllListeners'
    >,
    'appStateChange' | 'pause' | 'resume' | 'appUrlOpen' | 'appRestoredResult' | 'backButton'
  > {}
export interface BackgroundRunnerCapability
  extends NativePluginCapability<
    ExtensibleOperation<'checkPermissions' | 'requestPermissions' | 'removeNotificationListeners'>,
    'backgroundRunnerNotificationReceived'
  > {}
export interface BarcodeScannerCapability
  extends NativePluginCapability<ExtensibleOperation<'scanBarcode'>> {}
export interface BrowserCapability
  extends NativePluginCapability<
    ExtensibleOperation<'open' | 'close' | 'removeAllListeners'>,
    'browserFinished' | 'browserPageLoaded'
  > {}
export interface CalendarCapability
  extends NativePluginCapability<
    ExtensibleOperation<
      | 'checkPermissions'
      | 'requestPermissions'
      | 'createEvent'
      | 'createEventInteractively'
      | 'modifyEvent'
      | 'findEvents'
      | 'deleteEvent'
      | 'listCalendars'
      | 'createCalendar'
      | 'deleteCalendar'
      | 'openCalendar'
    >
  > {}
export interface ClipboardCapability
  extends NativePluginCapability<ExtensibleOperation<'write' | 'read'>> {}
export interface ContactsCapability
  extends NativePluginCapability<ExtensibleOperation<'find' | 'save' | 'remove' | 'pickContact'>> {}
/** Cookies is bundled in @capacitor/core. */
export interface CookiesCapability
  extends NativePluginCapability<
    ExtensibleOperation<'getCookies' | 'setCookie' | 'deleteCookie' | 'clearCookies' | 'clearAllCookies'>
  > {}
export interface DialogCapability
  extends NativePluginCapability<ExtensibleOperation<'alert' | 'prompt' | 'confirm'>> {}
export interface FileTransferCapability
  extends NativePluginCapability<
    ExtensibleOperation<'downloadFile' | 'uploadFile' | 'removeAllListeners'>,
    'progress'
  > {}
export interface FileViewerCapability
  extends NativePluginCapability<
    ExtensibleOperation<
      | 'openDocumentFromLocalPath'
      | 'openDocumentFromResources'
      | 'openDocumentFromUrl'
      | 'previewMediaContentFromLocalPath'
      | 'previewMediaContentFromResources'
      | 'previewMediaContentFromUrl'
    >
  > {}
export interface FilesystemCapability
  extends NativePluginCapability<
    ExtensibleOperation<
      | 'checkPermissions'
      | 'requestPermissions'
      | 'readFile'
      | 'writeFile'
      | 'appendFile'
      | 'deleteFile'
      | 'mkdir'
      | 'rmdir'
      | 'readdir'
      | 'getUri'
      | 'stat'
      | 'rename'
      | 'copy'
      | 'downloadFile'
    >,
    'progress'
  > {}
export interface GeolocationCapability
  extends NativePluginCapability<
    ExtensibleOperation<
      'getCurrentPosition' | 'watchPosition' | 'clearWatch' | 'checkPermissions' | 'requestPermissions'
    >
  > {}
/** Google Maps creates stateful map instances behind this same capability boundary. */
export interface GoogleMapsCapability
  extends NativePluginCapability<
    ExtensibleOperation<'create' | 'destroy' | 'setCamera' | 'addMarker' | 'addMarkers' | 'removeMarker' | 'removeMarkers'>
  > {}
export interface HapticsCapability
  extends NativePluginCapability<
    ExtensibleOperation<'impact' | 'notification' | 'vibrate' | 'selectionStart' | 'selectionChanged' | 'selectionEnd'>
  > {}
export interface HealthFitnessCapability
  extends NativePluginCapability<
    ExtensibleOperation<
      | 'isAvailable'
      | 'requestAuthorization'
      | 'checkAuthorization'
      | 'query'
      | 'save'
      | 'delete'
      | 'setBackgroundJob'
      | 'disableBackgroundJob'
    >
  > {}
/** HTTP is bundled in @capacitor/core. */
export interface HttpCapability
  extends NativePluginCapability<
    ExtensibleOperation<'request' | 'get' | 'post' | 'put' | 'patch' | 'delete' | 'setCookie' | 'clearCookies' | 'deleteCookie' | 'clearAllCookies'>
  > {}
export interface InAppBrowserCapability
  extends NativePluginCapability<
    ExtensibleOperation<'openInWebView' | 'openInSystemBrowser' | 'openInExternalBrowser' | 'close' | 'removeAllListeners'>,
    'browserPageLoaded' | 'browserPageNavigationCompleted' | 'browserClosed' | 'urlChange'
  > {}
export interface KeyboardCapability
  extends NativePluginCapability<
    ExtensibleOperation<'show' | 'hide' | 'setAccessoryBarVisible' | 'setScroll' | 'setResizeMode' | 'getResizeMode' | 'removeAllListeners'>,
    'keyboardWillShow' | 'keyboardDidShow' | 'keyboardWillHide' | 'keyboardDidHide'
  > {}
/** Experimental Capacitor plugin. Always call isAvailable before invoking it. */
export interface LocalLlmCapability
  extends NativePluginCapability<
    ExtensibleOperation<'systemAvailability' | 'download' | 'prompt' | 'endSession' | 'generateImage' | 'warmup' | 'removeAllListeners'>,
    'systemAvailabilityChange'
  > {}
export interface LocalNotificationsCapability
  extends NativePluginCapability<
    ExtensibleOperation<
      | 'schedule'
      | 'update'
      | 'getPending'
      | 'registerActionTypes'
      | 'cancel'
      | 'cancelAll'
      | 'areEnabled'
      | 'getDeliveredNotifications'
      | 'removeDeliveredNotifications'
      | 'removeDeliveredNotificationsById'
      | 'removeAllDeliveredNotifications'
      | 'getByIds'
      | 'getAll'
      | 'createChannel'
      | 'deleteChannel'
      | 'listChannels'
      | 'checkPermissions'
      | 'requestPermissions'
      | 'changeExactNotificationSetting'
      | 'checkExactNotificationSetting'
      | 'removeAllListeners'
    >,
    'localNotificationReceived' | 'localNotificationActionPerformed'
  > {}
export interface MotionCapability
  extends NativePluginCapability<ExtensibleOperation<'removeAllListeners'>, 'accel' | 'orientation'> {}
export interface NetworkCapability
  extends NativePluginCapability<ExtensibleOperation<'getStatus' | 'removeAllListeners'>, 'networkStatusChange'> {}
export interface PreferencesCapability
  extends NativePluginCapability<
    ExtensibleOperation<'configure' | 'get' | 'set' | 'remove' | 'clear' | 'keys' | 'migrate' | 'removeOld'>
  > {}
export interface PrivacyScreenCapability
  extends NativePluginCapability<ExtensibleOperation<'enable' | 'disable' | 'isEnabled'>> {}
export interface PushNotificationsCapability
  extends NativePluginCapability<
    ExtensibleOperation<
      | 'register'
      | 'unregister'
      | 'getDeliveredNotifications'
      | 'removeDeliveredNotifications'
      | 'removeAllDeliveredNotifications'
      | 'createChannel'
      | 'deleteChannel'
      | 'listChannels'
      | 'checkPermissions'
      | 'requestPermissions'
      | 'removeAllListeners'
    >,
    'registration' | 'registrationError' | 'pushNotificationReceived' | 'pushNotificationActionPerformed'
  > {}
export interface ScreenOrientationCapability
  extends NativePluginCapability<
    ExtensibleOperation<'orientation' | 'lock' | 'unlock' | 'removeAllListeners'>,
    'screenOrientationChange'
  > {}
export interface ScreenReaderCapability
  extends NativePluginCapability<
    ExtensibleOperation<'isEnabled' | 'speak' | 'removeAllListeners'>,
    'stateChange'
  > {}
export interface ShareCapability
  extends NativePluginCapability<ExtensibleOperation<'canShare' | 'share'>> {}
export interface SplashScreenCapability
  extends NativePluginCapability<ExtensibleOperation<'show' | 'hide'>> {}
export interface StatusBarCapability
  extends NativePluginCapability<
    ExtensibleOperation<'setStyle' | 'setBackgroundColor' | 'show' | 'hide' | 'getInfo' | 'setOverlaysWebView'>,
    'statusBarVisibilityChanged' | 'statusBarOverlayChanged'
  > {}
/** System Bars is bundled in @capacitor/core and supersedes Status Bar for edge-to-edge layouts. */
export interface SystemBarsCapability
  extends NativePluginCapability<ExtensibleOperation<'setStyle' | 'show' | 'hide' | 'setAnimation'>> {}
export interface TextZoomCapability
  extends NativePluginCapability<ExtensibleOperation<'get' | 'getPreferred' | 'set'>> {}
export interface ToastCapability
  extends NativePluginCapability<ExtensibleOperation<'show'>> {}

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
