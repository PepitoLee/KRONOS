'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  useNotificationStore,
  type Notificacion,
} from '@/lib/stores/notification-store'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'

function getIconByTipo(tipo: Notificacion['tipo']) {
  switch (tipo) {
    case 'vencimiento':
      return <Clock className="h-4 w-4 text-amber-400" />
    case 'alerta':
      return <AlertTriangle className="h-4 w-4 text-red-400" />
    case 'info':
      return <Info className="h-4 w-4 text-blue-400" />
    case 'exito':
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    default:
      return <Info className="h-4 w-4 text-zinc-400" />
  }
}

function tiempoRelativo(fecha: string): string {
  const ahora = new Date()
  const date = new Date(fecha)
  const diffMs = ahora.getTime() - date.getTime()
  const diffSeg = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSeg / 60)
  const diffHoras = Math.floor(diffMin / 60)
  const diffDias = Math.floor(diffHoras / 24)

  if (diffSeg < 60) return 'Hace un momento'
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffHoras < 24) return `Hace ${diffHoras}h`
  if (diffDias < 7) return `Hace ${diffDias}d`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export function NotificationCenter() {
  const router = useRouter()
  const supabase = createClient()
  const {
    notificaciones,
    noLeidas,
    setNotificaciones,
    marcarLeida,
    marcarTodasLeidas,
  } = useNotificationStore()

  useEffect(() => {
    async function fetchNotificaciones() {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching notificaciones:', error)
        return
      }

      if (data) {
        const mapped: Notificacion[] = data.map((row) => ({
          id: row.id,
          tipo: row.tipo as Notificacion['tipo'],
          titulo: row.titulo,
          mensaje: row.mensaje,
          fecha: row.fecha,
          leida: row.leida,
          enlace: row.enlace ?? undefined,
        }))
        setNotificaciones(mapped)
      }
    }

    fetchNotificaciones()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClickNotificacion = (notificacion: Notificacion) => {
    if (!notificacion.leida) {
      marcarLeida(notificacion.id)
    }
    if (notificacion.enlace) {
      router.push(notificacion.enlace)
    }
  }

  const handleMarcarTodas = () => {
    marcarTodasLeidas()
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-zinc-400 hover:text-zinc-100"
        >
          <Bell className="h-5 w-5" />
          {noLeidas > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {noLeidas > 9 ? '9+' : noLeidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 border-zinc-800 bg-zinc-900 p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-100">
            Notificaciones
          </h3>
          {noLeidas > 0 && (
            <button
              onClick={handleMarcarTodas}
              className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-96 overflow-y-auto">
          {notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
              <Bell className="mb-2 h-8 w-8 text-zinc-700" />
              <p className="text-sm">Sin notificaciones</p>
            </div>
          ) : (
            notificaciones.map((notificacion) => (
              <button
                key={notificacion.id}
                onClick={() => handleClickNotificacion(notificacion)}
                className="flex w-full items-start gap-3 border-b border-zinc-800/50 px-4 py-3 text-left transition-colors hover:bg-zinc-800/50 last:border-b-0"
              >
                {/* Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {getIconByTipo(notificacion.tipo)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-100 truncate">
                      {notificacion.titulo}
                    </p>
                    {!notificacion.leida && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">
                    {notificacion.mensaje}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[11px] text-zinc-600">
                      {tiempoRelativo(notificacion.fecha)}
                    </span>
                    {notificacion.enlace && (
                      <ExternalLink className="h-3 w-3 text-zinc-600" />
                    )}
                    {notificacion.leida && (
                      <Check className="h-3 w-3 text-zinc-600" />
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
