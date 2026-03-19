import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'notationPdfUrl';

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
  },

  loadNotationPdfUrl: async () => {
    const url = await AsyncStorage.getItem(STORAGE_KEY);
    if (url) set({ notationPdfUrl: url });
  },
}));
