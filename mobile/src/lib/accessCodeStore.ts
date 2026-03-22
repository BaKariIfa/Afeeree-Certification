import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Admin password (must match backend)
export const ADMIN_PASSWORD = 'BAKARI2024';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';
const IS_ADMIN_KEY = 'isAdmin';

export interface AccessCode {
  code: string;
  createdAt: string;
  usedBy: string | null;
  usedAt: string | null;
  userName: string | null;
  userEmail: string | null;
}

interface AccessCodeStore {
  codes: AccessCode[];
  isAdmin: boolean;

  loadCodes: () => Promise<void>;
  generateCode: () => Promise<string>;
  deleteCode: (code: string) => Promise<void>;
  markCodeUsed: (code: string, email: string, name?: string) => Promise<void>;
  isCodeValid: (code: string) => Promise<{ valid: boolean; userName: string | null; userEmail: string | null }>;
  setAdmin: (isAdmin: boolean) => Promise<void>;
  loadAdminState: () => Promise<void>;
}

export const useAccessCodeStore = create<AccessCodeStore>((set) => ({
  codes: [],
  isAdmin: false,

  loadAdminState: async () => {
    const stored = await AsyncStorage.getItem(IS_ADMIN_KEY);
    if (stored === 'true') set({ isAdmin: true });
  },

  loadCodes: async () => {
    if (!BACKEND_URL) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/codes`, {
        headers: { 'x-admin-password': ADMIN_PASSWORD },
      });
      if (!res.ok) return;
      const data = await res.json() as { codes: AccessCode[] };
      set({ codes: data.codes });
    } catch (error) {
      console.error('Error loading access codes:', error);
    }
  },

  generateCode: async () => {
    if (!BACKEND_URL) throw new Error('Backend not configured');
    const res = await fetch(`${BACKEND_URL}/api/codes/generate`, {
      method: 'POST',
      headers: { 'x-admin-password': ADMIN_PASSWORD },
    });
    const data = await res.json() as { code: string };
    const listRes = await fetch(`${BACKEND_URL}/api/codes`, {
      headers: { 'x-admin-password': ADMIN_PASSWORD },
    });
    if (listRes.ok) {
      const listData = await listRes.json() as { codes: AccessCode[] };
      set({ codes: listData.codes });
    }
    return data.code;
  },

  deleteCode: async (code: string) => {
    if (!BACKEND_URL) return;
    await fetch(`${BACKEND_URL}/api/codes/${encodeURIComponent(code)}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': ADMIN_PASSWORD },
    });
    const res = await fetch(`${BACKEND_URL}/api/codes`, {
      headers: { 'x-admin-password': ADMIN_PASSWORD },
    });
    if (res.ok) {
      const data = await res.json() as { codes: AccessCode[] };
      set({ codes: data.codes });
    }
  },

  markCodeUsed: async (code: string, email: string, name?: string) => {
    await fetch(`${BACKEND_URL}/api/codes/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, email, name }),
    });
  },

  isCodeValid: async (code: string) => {
    if (!BACKEND_URL) return { valid: false, userName: null, userEmail: null };
    try {
      const res = await fetch(`${BACKEND_URL}/api/codes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json() as { valid: boolean; userName: string | null; userEmail: string | null };
      if (!data.valid) return { valid: false, userName: null, userEmail: null };
      return { valid: true, userName: data.userName ?? null, userEmail: data.userEmail ?? null };
    } catch {
      return { valid: false, userName: null, userEmail: null };
    }
  },

  setAdmin: async (isAdmin: boolean) => {
    set({ isAdmin });
    await AsyncStorage.setItem(IS_ADMIN_KEY, isAdmin ? 'true' : 'false');
  },
}));
