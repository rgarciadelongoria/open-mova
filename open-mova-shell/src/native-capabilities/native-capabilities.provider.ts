import type { Provider } from '@angular/core';
import { NATIVE_CAPABILITIES, type NativeCapabilities } from '@open-mova/core';
import { actionSheetCapability } from './action-sheet/action-sheet.capability';
import { appCapability } from './app/app.capability';
import { appLauncherCapability } from './app-launcher/app-launcher.capability';
import { backgroundRunnerCapability } from './background-runner/background-runner.capability';
import { barcodeScannerCapability } from './barcode-scanner/barcode-scanner.capability';
import { browserCapability } from './browser/browser.capability';
import { calendarCapability } from './calendar/calendar.capability';
import { cameraCapability } from './camera/camera.capability';
import { clipboardCapability } from './clipboard/clipboard.capability';
import { contactsCapability } from './contacts/contacts.capability';
import { cookiesCapability } from './cookies/cookies.capability';
import { deviceCapability } from './device/device.capability';
import { dialogCapability } from './dialog/dialog.capability';
import { fileTransferCapability } from './file-transfer/file-transfer.capability';
import { fileViewerCapability } from './file-viewer/file-viewer.capability';
import { filesystemCapability } from './filesystem/filesystem.capability';
import { geolocationCapability } from './geolocation/geolocation.capability';
import { googleMapsCapability } from './google-maps/google-maps.capability';
import { hapticsCapability } from './haptics/haptics.capability';
import { healthFitnessCapability } from './health-fitness/health-fitness.capability';
import { httpCapability } from './http/http.capability';
import { inAppBrowserCapability } from './in-app-browser/in-app-browser.capability';
import { keyboardCapability } from './keyboard/keyboard.capability';
import { localLlmCapability } from './local-llm/local-llm.capability';
import { localNotificationsCapability } from './local-notifications/local-notifications.capability';
import { motionCapability } from './motion/motion.capability';
import { networkCapability } from './network/network.capability';
import { preferencesCapability } from './preferences/preferences.capability';
import { privacyScreenCapability } from './privacy-screen/privacy-screen.capability';
import { pushNotificationsCapability } from './push-notifications/push-notifications.capability';
import { screenOrientationCapability } from './screen-orientation/screen-orientation.capability';
import { screenReaderCapability } from './screen-reader/screen-reader.capability';
import { shareCapability } from './share/share.capability';
import { splashScreenCapability } from './splash-screen/splash-screen.capability';
import { statusBarCapability } from './status-bar/status-bar.capability';
import { systemBarsCapability } from './system-bars/system-bars.capability';
import { textZoomCapability } from './text-zoom/text-zoom.capability';
import { toastCapability } from './toast/toast.capability';

// Este fichero compone las capacidades y las expone mediante el contrato de core.
const nativeCapabilities = {
  version: 1,
  actionSheet: actionSheetCapability,
  app: appCapability,
  appLauncher: appLauncherCapability,
  backgroundRunner: backgroundRunnerCapability,
  barcodeScanner: barcodeScannerCapability,
  browser: browserCapability,
  calendar: calendarCapability,
  device: deviceCapability,
  camera: cameraCapability,
  clipboard: clipboardCapability,
  contacts: contactsCapability,
  cookies: cookiesCapability,
  dialog: dialogCapability,
  fileTransfer: fileTransferCapability,
  fileViewer: fileViewerCapability,
  filesystem: filesystemCapability,
  geolocation: geolocationCapability,
  googleMaps: googleMapsCapability,
  haptics: hapticsCapability,
  healthFitness: healthFitnessCapability,
  http: httpCapability,
  inAppBrowser: inAppBrowserCapability,
  keyboard: keyboardCapability,
  localLlm: localLlmCapability,
  localNotifications: localNotificationsCapability,
  motion: motionCapability,
  network: networkCapability,
  preferences: preferencesCapability,
  privacyScreen: privacyScreenCapability,
  pushNotifications: pushNotificationsCapability,
  screenOrientation: screenOrientationCapability,
  screenReader: screenReaderCapability,
  share: shareCapability,
  splashScreen: splashScreenCapability,
  statusBar: statusBarCapability,
  systemBars: systemBarsCapability,
  textZoom: textZoomCapability,
  toast: toastCapability,
} satisfies NativeCapabilities;

export function provideNativeCapabilities(): Provider {
  return {
    provide: NATIVE_CAPABILITIES,
    useValue: nativeCapabilities,
  };
}
