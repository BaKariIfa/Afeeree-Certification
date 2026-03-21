import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RESEARCH_DOC_KEY = 'researchDocUrl';
const RESEARCH_VIDEO_KEY = 'researchVideoUrl';
const HISTORY_PDF_KEY = 'historyPdfUrl';
const NOTATION_PDF_KEY = 'notationPdfUrl';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';

interface ResourcesStore {
  researchDocUrl: string | null;
  researchVideoUrl: string | null;
  historyPdfUrl: string | null;
  notationPdfUrl: string | null;
  setResearchDocUrl: (url: string) => Promise<void>;
  setResearchVideoUrl: (url: string) => Promise<void>;
  setHistoryPdfUrl: (url: string) => Promise<void>;
  setNotationPdfUrl: (url: string) => Promise<void>;
  loadResources: () => Promise<void>;
}

async function saveToBackend(key: string, url: string) {
  try {
    await fetch(`${BACKEND_URL}/api/resources`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, url }),
    });
  } catch {}
}

export const useResourcesStore = create<ResourcesStore>((set) => ({
  researchDocUrl: null,
  researchVideoUrl: null,
  historyPdfUrl: null,
  notationPdfUrl: null,

  setResearchDocUrl: async (url: string) => {
    set({ researchDocUrl: url });
    await AsyncStorage.setItem(RESEARCH_DOC_KEY, url);
  },

  setResearchVideoUrl: async (url: string) => {
    set({ researchVideoUrl: url });
    await AsyncStorage.setItem(RESEARCH_VIDEO_KEY, url);
  },

  setHistoryPdfUrl: async (url: string) => {
    set({ historyPdfUrl: url });
    await AsyncStorage.setItem(HISTORY_PDF_KEY, url);
    await saveToBackend('historyPdfUrl', url);
  },

  setNotationPdfUrl: async (url: string) => {
    set({ notationPdfUrl: url });
    await AsyncStorage.setItem(NOTATION_PDF_KEY, url);
    await saveToBackend('notationPdfUrl', url);
  },

  loadResources: async () => {
    // Load local cache first for instant display
    const [docUrl, videoUrl, historyLocal, notationLocal] = await Promise.all([
      AsyncStorage.getItem(RESEARCH_DOC_KEY),
      AsyncStorage.getItem(RESEARCH_VIDEO_KEY),
      AsyncStorage.getItem(HISTORY_PDF_KEY),
      AsyncStorage.getItem(NOTATION_PDF_KEY),
    ]);
    set({
      researchDocUrl: docUrl ?? null,
      researchVideoUrl: videoUrl ?? null,
      historyPdfUrl: historyLocal ?? null,
      notationPdfUrl: notationLocal ?? null,
    });

    // Then fetch from backend to get the latest admin-uploaded URLs
    try {
      const res = await fetch(`${BACKEND_URL}/api/resources`);
      if (res.ok) {
        const data = await res.json() as Record<string, string | null>;
        const updates: Partial<ResourcesStore> = {};
        if (data.historyPdfUrl) {
          updates.historyPdfUrl = data.historyPdfUrl;
          await AsyncStorage.setItem(HISTORY_PDF_KEY, data.historyPdfUrl);
        }
        if (data.notationPdfUrl) {
          updates.notationPdfUrl = data.notationPdfUrl;
          await AsyncStorage.setItem(NOTATION_PDF_KEY, data.notationPdfUrl);
        }
        if (Object.keys(updates).length > 0) set(updates);
      }
    } catch {}
  },
}));
