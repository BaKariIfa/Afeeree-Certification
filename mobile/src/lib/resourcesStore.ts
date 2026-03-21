import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RESEARCH_DOC_KEY = 'researchDocUrl';
const RESEARCH_VIDEO_KEY = 'researchVideoId';

interface ResourcesStore {
  researchDocUrl: string | null;
  researchVideoId: string | null;
  setResearchDocUrl: (url: string) => Promise<void>;
  setResearchVideoId: (id: string) => Promise<void>;
  loadResources: () => Promise<void>;
}

export const useResourcesStore = create<ResourcesStore>((set) => ({
  researchDocUrl: null,
  researchVideoId: null,

  setResearchDocUrl: async (url: string) => {
    set({ researchDocUrl: url });
    await AsyncStorage.setItem(RESEARCH_DOC_KEY, url);
  },

  setResearchVideoId: async (id: string) => {
    set({ researchVideoId: id });
    await AsyncStorage.setItem(RESEARCH_VIDEO_KEY, id);
  },

  loadResources: async () => {
    const [docUrl, videoId] = await Promise.all([
      AsyncStorage.getItem(RESEARCH_DOC_KEY),
      AsyncStorage.getItem(RESEARCH_VIDEO_KEY),
    ]);
    set({
      researchDocUrl: docUrl ?? null,
      researchVideoId: videoId ?? null,
    });
  },
}));
