import { create } from 'zustand';

const useThemeStore = create((set) => ({
  theme: localStorage.getItem('crm_theme') || 'dark',
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('crm_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    return { theme: nextTheme };
  }),
  setTheme: (theme) => {
    localStorage.setItem('crm_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
}));

export default useThemeStore;
