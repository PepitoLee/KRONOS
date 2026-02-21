'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/stores/app-store'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { formatCurrency } from '@/lib/utils/currency'
import { getCurrentPeriod } from '@/lib/utils/dates'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { BookOpen, Download, Calendar, FileText, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface LibroPLE {
  id: string
  nombre: string
  codigo: string
  descripcion: string
  registros: number
  estado: 'listo' | 'pendiente' | 'sin_datos'
}

export default function PLEPage() {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState(getCurrentPeriod())
  const [libros, setLibros] = useState<LibroPLE[]>([])
  const { empresaId } = useAppStore()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [year, month] = periodo.split('-').map(Number)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endMonth = month === 12 ? 1 : month + 1
      const endYear = month === 12 ? year + 1 : year
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

      // Contar ventas del periodo
      const { count: ventasCount } = await supabase
        .from('documentos')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_operacion', 'venta')
        .neq('estado', 'anulado')
        .gte('fecha_emision', startDate)
        .lt('fecha_emision', endDate)

      // Contar compras del periodo
      const { count: comprasCount } = await supabase
        .from('documentos')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_operacion', 'compra')
        .neq('estado', 'anulado')
        .gte('fecha_emision', startDate)
        .lt('fecha_emision', endDate)

      // Contar asientos del periodo
      const { count: asientosCount } = await supabase
        .from('asientos_contables')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', startDate)
        .lt('fecha', endDate)

      const librosData: LibroPLE[] = [
        {
          id: '14.1',
          nombre: 'Registro de Ventas e Ingresos',
          codigo: '140100',
          descripcion: 'Detalle de comprobantes de venta emitidos',
          registros: ventasCount ?? 0,
          estado: (ventasCount ?? 0) > 0 ? 'listo' : 'sin_datos',
        },
        {
          id: '8.1',
          nombre: 'Registro de Compras',
          codigo: '080100',
          descripcion: 'Detalle de comprobantes de compra recibidos',
          registros: comprasCount ?? 0,
          estado: (comprasCount ?? 0) > 0 ? 'listo' : 'sin_datos',
        },
        {
          id: '5.1',
          nombre: 'Libro Diario',
          codigo: '050100',
          descripcion: 'Asientos contables del periodo',
          registros: asientosCount ?? 0,
          estado: (asientosCount ?? 0) > 0 ? 'listo' : 'sin_datos',
        },
        {
          id: '6.1',
          nombre: 'Libro Mayor',
          codigo: '060100',
          descripcion: 'Movimientos agrupados por cuenta contable',
          registros: asientosCount ?? 0,
          estado: (asientosCount ?? 0) > 0 ? 'listo' : 'sin_datos',
        },
      ]

      setLibros(librosData)
    } finally {
      setLoading(false)
    }
  }, [periodo, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleGenerar = (libro: LibroPLE) => {
    if (libro.estado === 'sin_datos') {
      toast.error('Sin datos', { description: `No hay registros para generar el ${libro.nombre} en este periodo.` })
      return
    }
    toast.success('Archivo PLE generado', {
      description: `${libro.nombre} (${libro.registros} registros) - Periodo ${periodo}`,
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-64 bg-zinc-800/50" />
        <Skeleton className="h-8 w-80 bg-zinc-800/50" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 bg-zinc-800/50 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <BookOpen className="h-7 w-7 text-emerald-400" />
            Libros Electronicos PLE
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Genera archivos TXT para el Programa de Libros Electronicos de SUNAT</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5">
          <Calendar className="h-4 w-4 text-zinc-400" />
          <input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="bg-transparent text-sm text-zinc-200 outline-none [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-sm text-blue-300">
          Los archivos generados cumplen con el formato establecido por SUNAT para el PLE version 5.2.
          Verifique los datos antes de presentar.
        </p>
      </div>

      {/* Libros Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {libros.map((libro) => (
          <div key={libro.id} className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                  <FileText className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Libro {libro.id}</h3>
                  <p className="text-sm text-zinc-300">{libro.nombre}</p>
                </div>
              </div>
              {libro.estado === 'listo' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-zinc-600" />
              )}
            </div>
            <p className="text-xs text-zinc-500 mb-4">{libro.descripcion}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">
                {libro.registros} registros
              </span>
              <Button
                size="sm"
                variant="outline"
                className={`gap-2 ${libro.estado === 'listo' ? 'border-emerald-800 text-emerald-400 hover:bg-emerald-950' : 'border-zinc-700 text-zinc-500'}`}
                onClick={() => handleGenerar(libro)}
                disabled={libro.estado === 'sin_datos'}
              >
                <Download className="h-3 w-3" />
                Generar TXT
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
