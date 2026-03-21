import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAccessCodeStore } from './accessCodeStore';

interface UserState {
  name: string;
  email: string;
  enrollmentDate: string;
  isOnboarded: boolean;
  hasAccess: boolean;
  accessCode: string;
  isDemoMode: boolean;
  completedLessons: string[];
  moduleProgress: Record<string, number>;
  notes: Record<string, string>;
  practiceTime: number;
  darkMode: boolean;
  completedTasks: number;
  // Accumulated study time per lesson key "moduleId-lessonIndex" in ms
  lessonStudyTime: Record<string, number>;

  // Actions
  setUser: (name: string, email: string) => void;
  setOnboarded: (value: boolean) => void;
  setAccess: (hasAccess: boolean, code: string) => void;
  setDemoMode: (value: boolean) => void;
  markLessonComplete: (moduleId: string, lessonIndex: number) => void;
  saveNote: (moduleId: string, note: string) => void;
  addPracticeTime: (seconds: number) => void;
  toggleDarkMode: () => void;
  incrementCompletedTasks: () => void;
  addLessonStudyTime: (key: string, ms: number) => void;
  syncProgress: () => Promise<void>;
  loadUserData: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  name: '',
  email: '',
  enrollmentDate: '',
  isOnboarded: false,
  hasAccess: false,
  accessCode: '',
  isDemoMode: false,
  completedLessons: [],
  moduleProgress: {},
  notes: {},
  practiceTime: 0,
  darkMode: false,
  completedTasks: 0,
  lessonStudyTime: {},

  setUser: (name, email) => {
    set({ name, email });
    AsyncStorage.setItem('userName', name);
    AsyncStorage.setItem('userEmail', email);
  },

  setOnboarded: (value) => {
    set({ isOnboarded: value });
    AsyncStorage.setItem('onboardingComplete', value ? 'true' : 'false');
  },

  setAccess: (hasAccess, code) => {
    set({ hasAccess, accessCode: code });
    AsyncStorage.setItem('hasAccess', hasAccess ? 'true' : 'false');
    AsyncStorage.setItem('accessCode', code);
    if (code) {
      useAccessCodeStore.getState().setAdmin(false);
    }
  },

  setDemoMode: (value) => {
    set({ isDemoMode: value });
  },

  logout: async () => {
    await AsyncStorage.multiRemove([
      'userName',
      'userEmail',
      'enrollmentDate',
      'onboardingComplete',
      'hasAccess',
      'accessCode',
      'completedLessons',
      'moduleProgress',
      'notes',
      'practiceTime',
      'darkMode',
      'isAdmin',
      'completedTasks',
      'lessonStudyTime',
    ]);
    useAccessCodeStore.getState().setAdmin(false);
    set({
      name: '',
      email: '',
      enrollmentDate: '',
      isOnboarded: false,
      hasAccess: false,
      accessCode: '',
      isDemoMode: false,
      completedLessons: [],
      moduleProgress: {},
      notes: {},
      practiceTime: 0,
      darkMode: false,
      completedTasks: 0,
      lessonStudyTime: {},
    });
  },

  markLessonComplete: (moduleId, lessonIndex) => {
    const key = `${moduleId}-${lessonIndex}`;
    const current = get().completedLessons;
    if (!current.includes(key)) {
      const updated = [...current, key];
      set({ completedLessons: updated });
      AsyncStorage.setItem('completedLessons', JSON.stringify(updated));

      const moduleProgress = { ...get().moduleProgress };
      const moduleLessons = current.filter(l => l.startsWith(`${moduleId}-`)).length + 1;
      moduleProgress[moduleId] = moduleLessons;
      set({ moduleProgress });
      AsyncStorage.setItem('moduleProgress', JSON.stringify(moduleProgress));
      get().syncProgress();
    }
  },

  saveNote: (moduleId, note) => {
    const notes = { ...get().notes, [moduleId]: note };
    set({ notes });
    AsyncStorage.setItem('notes', JSON.stringify(notes));
  },

  addPracticeTime: (seconds) => {
    const newTime = get().practiceTime + seconds;
    set({ practiceTime: newTime });
    AsyncStorage.setItem('practiceTime', newTime.toString());
  },

  toggleDarkMode: () => {
    const newValue = !get().darkMode;
    set({ darkMode: newValue });
    AsyncStorage.setItem('darkMode', newValue ? 'true' : 'false');
  },

  incrementCompletedTasks: () => {
    const newCount = get().completedTasks + 1;
    set({ completedTasks: newCount });
    AsyncStorage.setItem('completedTasks', newCount.toString());
  },

  addLessonStudyTime: (key, ms) => {
    const current = get().lessonStudyTime;
    const updated = { ...current, [key]: (current[key] ?? 0) + ms };
    set({ lessonStudyTime: updated });
    AsyncStorage.setItem('lessonStudyTime', JSON.stringify(updated));
    get().syncProgress();
  },

  syncProgress: async () => {
    try {
      const { name, email, accessCode, completedLessons, lessonStudyTime } = get();
      if (!accessCode) return;
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? '';
      await fetch(`${backendUrl}/api/progress/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode, name, email, completedLessons, lessonStudyTime }),
      });
    } catch {}
  },

  loadUserData: async () => {
    try {
      const [
        name,
        email,
        enrollmentDate,
        onboardingComplete,
        hasAccess,
        accessCode,
        completedLessons,
        moduleProgress,
        notes,
        practiceTime,
        darkMode,
        completedTasks,
        lessonStudyTime,
      ] = await Promise.all([
        AsyncStorage.getItem('userName'),
        AsyncStorage.getItem('userEmail'),
        AsyncStorage.getItem('enrollmentDate'),
        AsyncStorage.getItem('onboardingComplete'),
        AsyncStorage.getItem('hasAccess'),
        AsyncStorage.getItem('accessCode'),
        AsyncStorage.getItem('completedLessons'),
        AsyncStorage.getItem('moduleProgress'),
        AsyncStorage.getItem('notes'),
        AsyncStorage.getItem('practiceTime'),
        AsyncStorage.getItem('darkMode'),
        AsyncStorage.getItem('completedTasks'),
        AsyncStorage.getItem('lessonStudyTime'),
      ]);

      set({
        name: name || '',
        email: email || '',
        enrollmentDate: enrollmentDate || '',
        isOnboarded: onboardingComplete === 'true',
        hasAccess: hasAccess === 'true',
        accessCode: accessCode || '',
        completedLessons: completedLessons ? JSON.parse(completedLessons) : [],
        moduleProgress: moduleProgress ? JSON.parse(moduleProgress) : {},
        notes: notes ? JSON.parse(notes) : {},
        practiceTime: practiceTime ? parseInt(practiceTime, 10) : 0,
        darkMode: darkMode === 'true',
        completedTasks: completedTasks ? parseInt(completedTasks, 10) : 0,
        lessonStudyTime: lessonStudyTime ? JSON.parse(lessonStudyTime) : {},
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  },
}));
