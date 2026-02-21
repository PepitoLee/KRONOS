import { create } from 'zustand'

export interface Notificacion {
  id: string
  tipo: 'vencimiento' | 'alerta' | 'info' | 'exito'
  titulo: string
  mensaje: string
  fecha: string
  leida: boolean
  enlace?: string
}

interface NotificationState {
  notificaciones: Notificacion[]
  noLeidas: number
  setNotificaciones: (n: Notificacion[]) => void
  marcarLeida: (id: string) => void
  marcarTodasLeidas: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notificaciones: [],
  noLeidas: 0,

  setNotificaciones: (n) =>
    set({
      notificaciones: n,
      noLeidas: n.filter((notif) => !notif.leida).length,
    }),

  marcarLeida: (id) =>
    set((state) => {
      const notificaciones = state.notificaciones.map((n) =>
        n.id === id ? { ...n, leida: true } : n
      )
      return {
        notificaciones,
        noLeidas: notificaciones.filter((n) => !n.leida).length,
      }
    }),

  marcarTodasLeidas: () =>
    set((state) => ({
      notificaciones: state.notificaciones.map((n) => ({ ...n, leida: true })),
      noLeidas: 0,
    })),
}))
