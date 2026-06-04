
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export const openExternalLink = async (url: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url });
    } catch (error) {
      console.error('Error opening browser:', error);
      window.open(url, '_blank');
    }
  } else {
    window.open(url, '_blank');
  }
};
