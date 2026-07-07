import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shrewchat.app',
  appName: 'Shrew Chat',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
