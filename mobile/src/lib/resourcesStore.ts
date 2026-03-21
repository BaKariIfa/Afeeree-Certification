import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RESEARCH_DOC_KEY = 'researchDocUrl';
const RESEARCH_VIDEO_KEY = 'researchVideoUrl';

interface ResourcesStore {
  researchDocUrl: string | null;
  researchVideoUrl: string | null;
  setResearchDocUrl: (url: string) => Promise<void>;
  setResearchVideoUrl: (url: string) => Promise<void>;
  loadResources: () => Promise<void>;
}

export const useResourcesStore = create<ResourcesStore>((set) => ({
  researchDocUrl: null,
  researchVideoUrl: null,

  setResearchDocUrl: async (url: string) => {
    set({ researchDocUrl: url });
    await AsyncStorage.setItem(RESEARCH_DOC_KEY, url);
  },

  setResearchVideoUrl: async (url: string) => {
    set({ researchVideoUrl: url });
    await AsyncStorage.setItem(RESEARCH_VIDEO_KEY, url);
  },

  loadResources: async () => {
    const [docUrl, videoUrl] = await Promise.all([
      AsyncStorage.getItem(RESEARCH_DOC_KEY),
      AsyncStorage.getItem(RESEARCH_VIDEO_KEY),
    ]);
    set({
      researchDocUrl: docUrl ?? null,
      researchVideoUrl: videoUrl ?? null,
    });
  },
}));
