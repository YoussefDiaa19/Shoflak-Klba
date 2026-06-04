
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export const storage = {
  async set(key: string, value: any) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await Preferences.set({ key, value: stringValue });
    if (!Capacitor.isNativePlatform()) {
      localStorage.setItem(key, stringValue);
    }
  },

  async get(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    if (value === null && !Capacitor.isNativePlatform()) {
      return localStorage.getItem(key);
    }
    return value;
  },

  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      return null;
    }
  },

  async remove(key: string) {
    await Preferences.remove({ key });
    if (!Capacitor.isNativePlatform()) {
      localStorage.removeItem(key);
    }
  }
};
