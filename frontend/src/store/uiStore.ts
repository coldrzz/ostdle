import { create } from 'zustand';

interface UiStore {
  activeMenuItem: string;
  setActiveMenuItem: (item: string) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  activeMenuItem: 'home',
  setActiveMenuItem: (item) => set({ activeMenuItem: item }),
}));
