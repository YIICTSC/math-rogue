import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'jp.yusukeishige.learningrogue',
  appName: '学習ローグ',
  webDir: 'dist',
  ios: {
    backgroundColor: '#000000',
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scrollEnabled: false,
  },
  android: {
    backgroundColor: '#000000',
  },
};

export default config;
