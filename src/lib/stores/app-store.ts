import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  empresaId: string | null
  setEmpresaId: (id: string | null) => void
  userId: string | null
  setUserId: (id: string | null) => void
  userRol: string | null
  setUserRol: (rol: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  empresaId: null,
  setEmpresaId: (id) => set({ empresaId: id }),
  userId: null,
  setUserId: (id) => set({ userId: id }),
  userRol: null,
  setUserRol: (rol) => set({ userRol: rol }),
}))
