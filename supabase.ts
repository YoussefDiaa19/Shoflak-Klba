
import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

let supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
if (!supabaseUrl || supabaseUrl === 'undefined' || supabaseUrl === 'null' || supabaseUrl === '') {
  supabaseUrl = 'https://pgkbzeixrtcehbfemsqe.supabase.co';
}

let supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
if (!supabaseAnonKey || supabaseAnonKey === 'undefined' || supabaseAnonKey === 'null' || supabaseAnonKey === '') {
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBna2J6ZWl4cnRjZWhiZmVtc3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMDEzNDUsImV4cCI6MjA4NDc3NzM0NX0.i7U8d9WXEQthuYaarwvqejecvvPg0xg2vQPTQd84lGE';
}

// Custom storage adapter for Supabase to use Capacitor Preferences on native devices
const capacitorStorage = {
  getItem: (key: string): string | Promise<string | null> | null => {
    if (Capacitor.isNativePlatform()) {
      return Preferences.get({ key })
        .then(result => result.value)
        .catch(() => null);
    }
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void | Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      return Preferences.set({ key, value }).then(() => {});
    }
    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void | Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      return Preferences.remove({ key }).then(() => {});
    }
    localStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: capacitorStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
