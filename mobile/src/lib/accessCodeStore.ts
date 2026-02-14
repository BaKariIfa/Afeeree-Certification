import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Admin password to access code generation (change this!)
export const ADMIN_PASSWORD = 'BAKARI2024';

export interface AccessCode {
  code: string;
  createdAt: string;
  usedBy: string | null; // email of user who used it
  usedAt: string | null;
}

interface AccessCodeStore {
  codes: AccessCode[];
  isAdmin: boolean;

  // Actions
  loadCodes: () => Promise<void>;
  generateCode: () => Promise<string>;
  deleteCode: (code: string) => Promise<void>;
  markCodeUsed: (code: string, email: string) => Promise<void>;
  isCodeValid: (code: string) => Promise<boolean>;
  setAdmin: (isAdmin: boolean) => void;
}

// Generate a random 8-character code
const generateRandomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters like 0/O, 1/I
  let code = 'AF-'; // Prefix for AFeeree
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const useAccessCodeStore = create<AccessCodeStore>((set, get) => ({
  codes: [],
  isAdmin: false,

  loadCodes: async () => {
    try {
      const stored = await AsyncStorage.getItem('accessCodes');
      if (stored) {
        set({ codes: JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading access codes:', error);
    }
  },

  generateCode: async () => {
    const newCode: AccessCode = {
      code: generateRandomCode(),
      createdAt: new Date().toISOString(),
      usedBy: null,
      usedAt: null,
    };

    const updated = [...get().codes, newCode];
    set({ codes: updated });
    await AsyncStorage.setItem('accessCodes', JSON.stringify(updated));

    return newCode.code;
  },

  deleteCode: async (code: string) => {
    const updated = get().codes.filter(c => c.code !== code);
    set({ codes: updated });
    await AsyncStorage.setItem('accessCodes', JSON.stringify(updated));
  },

  markCodeUsed: async (code: string, email: string) => {
    const updated = get().codes.map(c => {
      if (c.code === code) {
        return {
          ...c,
          usedBy: email,
          usedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    set({ codes: updated });
    await AsyncStorage.setItem('accessCodes', JSON.stringify(updated));
  },

  isCodeValid: async (code: string) => {
    await get().loadCodes();
    const upperCode = code.toUpperCase().trim();
    const found = get().codes.find(c => c.code === upperCode);

    // Code is valid if it exists and hasn't been used
    return found !== undefined && found.usedBy === null;
  },

  setAdmin: (isAdmin: boolean) => {
    set({ isAdmin });
  },
}));
