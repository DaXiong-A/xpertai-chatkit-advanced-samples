import { create } from 'zustand';
import type { UseChatKitReturn } from '@xpert-ai/chatkit-react';

type ColorScheme = 'light' | 'dark';

interface AppState {
  // Theme
  theme: ColorScheme;
  setTheme: (theme: ColorScheme) => void;
  toggleTheme: () => void;

  // Thread
  threadId: string | null;
  setThreadId: (id: string | null) => void;

  // ChatKit instance
  chatkit: UseChatKitReturn | null;
  setChatkit: (chatkit: UseChatKitReturn | null) => void;
}

// Get initial theme from system preference
function getInitialTheme(): ColorScheme {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light';
}

export const useAppStore = create<AppState>((set, get) => ({
  // Theme
  theme: getInitialTheme(),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  toggleTheme: () => {
    const { theme, setTheme } = get();
    setTheme(theme === 'light' ? 'dark' : 'light');
  },

  // Thread
  threadId: null,
  setThreadId: (threadId) => set({ threadId }),

  // ChatKit
  chatkit: null,
  setChatkit: (chatkit) => set({ chatkit }),
}));
