import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'notationPdfUrl';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';

interface NotationStore {
  notationPdfUrl: string | null;
  setNotationPdfUrl: (url: string) => Promise<void>;
  loadNotationPdfUrl: () => Promise<void>;
}

export const useNotationStore = create<NotationStore>((set) => ({
  notationPdfUrl: null,

  setNotationPdfUrl: async (url: string) => {
    set({ notationPdfUrl: url });
    await AsyncStorage.setItem(STORAGE_KEY, url);
    // Persist to backend so all participant devices receive it
    try {
      await fetch(`${BACKEND_URL}/api/resources`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'notationPdfUrl', url }),
      });
    } catch {}
  },

  loadNotationPdfUrl: async () => {
    // Load local cache first for instant display
    const local = await AsyncStorage.getItem(STORAGE_KEY);
    if (local) set({ notationPdfUrl: local });

    // Then fetch from backend to get latest admin-uploaded URL
    try {
      const res = await fetch(`${BACKEND_URL}/api/resources`);
      if (res.ok) {
        const data = await res.json() as Record<string, string | null>;
        if (data.notationPdfUrl) {
          set({ notationPdfUrl: data.notationPdfUrl });
          await AsyncStorage.setItem(STORAGE_KEY, data.notationPdfUrl);
        }
      }
    } catch {}
  },
}));
