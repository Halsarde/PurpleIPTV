import type { CapacitorConfig } from '@capacitor/cli';

// Use remote server only when explicitly provided during development.
// In production, the app serves embedded assets from `dist` for better performance and offline reliability.
const isDev = !!process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.purple.iptv',
  appName: 'Purple IPTV',
  webDir: 'dist',
  ...(isDev
    ? {
        server: {
          url: process.env.CAP_SERVER_URL as string,
          cleartext: true,
          androidScheme: 'https',
        },
      }
    : {}),
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#6C00FF',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;

