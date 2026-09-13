const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'shell',

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },

  skip: [
    '@capacitor/core',
    '@capacitor/device',
    '@capacitor/camera',
    '@capacitor/android',
    '@capacitor/ios',
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
