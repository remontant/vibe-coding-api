import { create } from 'zustand';
import { ref, remove } from 'firebase/database';
import { db } from '@/lib/firebase';

export type AuthUser = {
  id: string;
  mainCharacter: string;
  image: string;
  characterClassName?: string;
};

type AuthState = {
  user: AuthUser | null;
  // 앱 시작 시 localStorage에서 복원
  init: () => void;
  // 로그인 성공 시 호출 — 상태 + localStorage 동시 저장
  login: (user: AuthUser) => void;
  // 로그아웃 — 상태 + localStorage 제거
  logout: () => void;
  // 회원탈퇴 — Firebase 삭제 + 로그아웃
  deleteAccount: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,

  init: () => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    try {
      set({ user: JSON.parse(stored) });
    } catch {
      localStorage.removeItem('user');
    }
  },

  login: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('user');
    set({ user: null });
  },

  deleteAccount: async () => {
    const { user, logout } = get();
    if (!user) return;
    const userRef = ref(db, `users/${user.id}`);
    await remove(userRef);
    logout();
  },
}));
