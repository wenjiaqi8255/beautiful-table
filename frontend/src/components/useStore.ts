import { create } from 'zustand';
import type { TableData, Theme } from './types';

interface StoreState {
  tableData: TableData | null;
  selectedTheme: Theme;
  isLoading: boolean;
  error: string | null;
  creditsRemaining: number;
  hasCredits: boolean;
  setTableData: (data: TableData | null) => void;
  setTheme: (theme: Theme) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  decrementCredits: () => void;
  setCredits: (credits: number) => void;
  reset: () => void;
}

const initialState = {
  tableData: null,
  selectedTheme: 'dark' as Theme,
  isLoading: false,
  error: null,
  creditsRemaining: 5,
};

export const useStore = create<StoreState>((set) => ({
  ...initialState,

  hasCredits: true,

  setTableData: (data) => set({ tableData: data }),

  setTheme: (theme) => set({ selectedTheme: theme }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  decrementCredits: () =>
    set((state) => ({
      creditsRemaining: Math.max(0, state.creditsRemaining - 1),
      hasCredits: Math.max(0, state.creditsRemaining - 1) > 0,
    })),

  setCredits: (credits) =>
    set({
      creditsRemaining: credits,
      hasCredits: credits > 0,
    }),

  reset: () =>
    set({
      ...initialState,
      hasCredits: true,
    }),
}));
