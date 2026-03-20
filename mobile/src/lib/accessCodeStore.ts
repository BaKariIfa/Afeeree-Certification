import { create } from 'zustand';

// Admin password (must match backend)
export const ADMIN_PASSWORD = 'BAKARI2024';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';

export interface AccessCode {
  code: string;
  createdAt: string;
  usedBy: string | null;
  usedAt: string | null;
}

interface AccessCodeStore {
  codes: AccessCode[];
  isAdmin: boolean;

  loadCodes: () => Promise<void>;
  generateCode: () => Promise<string>;
  deleteCode: (code: string) => Promise<void>;
  markCodeUsed: (code: string, email: string) => Promise<void>;
  isCodeValid: (code: string) => Promise<boolean>;
  setAdmin: (isAdmin: boolean) => void;
}

export const useAccessCodeStore = create<AccessCodeStore>((set) => ({
  codes: [],
  isAdmin: false,

  loadCodes: async () => {
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
    const res = await fetch(`${BACKEND_URL}/api/codes/generate`, {
      method: 'POST',
      headers: { 'x-admin-password': ADMIN_PASSWORD },
    });
    const data = await res.json() as { code: string };
    // Refresh list
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
    await fetch(`${BACKEND_URL}/api/codes/${encodeURIComponent(code)}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': ADMIN_PASSWORD },
    });
    // Refresh list
    const res = await fetch(`${BACKEND_URL}/api/codes`, {
      headers: { 'x-admin-password': ADMIN_PASSWORD },
    });
    if (res.ok) {
      const data = await res.json() as { codes: AccessCode[] };
      set({ codes: data.codes });
    }
  },

  markCodeUsed: async (code: string, email: string) => {
    await fetch(`${BACKEND_URL}/api/codes/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, email }),
    });
  },

  isCodeValid: async (code: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/codes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json() as { valid: boolean };
      return data.valid === true;
    } catch {
      return false;
    }
  },

  setAdmin: (isAdmin: boolean) => {
    set({ isAdmin });
  },
}));
