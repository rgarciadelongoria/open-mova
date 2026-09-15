const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'shell',

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
    '@open-mova/core': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    },
  },

  skip: [
    // Los microfrontales consumen contratos de @open-mova/core, nunca plugins
    // de Capacitor. La shell los integra en su propio bundle nativo.
    '@capacitor/action-sheet',
    '@capacitor/app',
    '@capacitor/app-launcher',
    '@capacitor/background-runner',
    '@capacitor/barcode-scanner',
    '@capacitor/browser',
    '@capacitor/calendar',
    '@capacitor/camera',
    '@capacitor/clipboard',
    '@capacitor/contacts',
    '@capacitor/core',
    '@capacitor/android',
    '@capacitor/device',
    '@capacitor/dialog',
    '@capacitor/file-transfer',
    '@capacitor/file-viewer',
    '@capacitor/filesystem',
    '@capacitor/geolocation',
    '@capacitor/google-maps',
    '@capacitor/haptics',
    '@capacitor/health-fitness',
    '@capacitor/inappbrowser',
    '@capacitor/ios',
    '@capacitor/keyboard',
    '@capacitor/local-llm',
    '@capacitor/local-notifications',
    '@capacitor/motion',
    '@capacitor/network',
    '@capacitor/preferences',
    '@capacitor/privacy-screen',
    '@capacitor/push-notifications',
    '@capacitor/screen-orientation',
    '@capacitor/screen-reader',
    '@capacitor/share',
    '@capacitor/splash-screen',
    '@capacitor/status-bar',
    '@capacitor/text-zoom',
    '@capacitor/toast',
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // These RxJS entry points are not needed by the shell.
  ],

  features: {
    // Avoid processing dependencies that are not used by this host.
    ignoreUnusedDeps: true,
  },
});
