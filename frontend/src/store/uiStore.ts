import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  isRightPanelOpen: boolean;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  toggleRightPanel: () => void;
  setRightPanel: (open: boolean) => void;
  syncViewport: (width: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: window.innerWidth > 1024,
  isRightPanelOpen: window.innerWidth > 1280,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebar: (open) => set({ isSidebarOpen: open }),
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  setRightPanel: (open) => set({ isRightPanelOpen: open }),
  syncViewport: (width) => set((state) => {
    const desktopSidebarOpen = width >= 1024;
    const desktopRightPanelOpen = width >= 1280;

    if (desktopSidebarOpen || desktopRightPanelOpen) {
      return {
        isSidebarOpen: desktopSidebarOpen ? true : state.isSidebarOpen,
        isRightPanelOpen: desktopRightPanelOpen ? true : state.isRightPanelOpen,
      };
    }

    return state;
  }),
}));
