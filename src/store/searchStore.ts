import { create } from 'zustand';

const STORAGE_KEY = 'recentSearches';
const MAX_ITEMS = 5;

type SearchState = {
  recentSearches: string[];
  // 앱 시작 시 localStorage에서 복원
  init: () => void;
  // 검색어 추가 — 중복 제거 + 맨 앞에 삽입 + 최대 5개
  addSearch: (name: string) => void;
  // 개별 검색어 삭제
  removeSearch: (name: string) => void;
};

const syncToStorage = (searches: string[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
};

export const useSearchStore = create<SearchState>((set) => ({
  recentSearches: [],

  init: () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      set({ recentSearches: JSON.parse(stored) });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  addSearch: (name) => {
    set((state) => {
      const updated = [name, ...state.recentSearches.filter((s) => s !== name)].slice(0, MAX_ITEMS);
      syncToStorage(updated);
      return { recentSearches: updated };
    });
  },

  removeSearch: (name) => {
    set((state) => {
      const updated = state.recentSearches.filter((s) => s !== name);
      syncToStorage(updated);
      return { recentSearches: updated };
    });
  },
}));
