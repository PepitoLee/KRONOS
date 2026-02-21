'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { ExportButton } from '@/components/import-export/ExportButton'
import { formatCurrency } from '@/lib/utils/currency'
import { getCurrentPeriod, formatMonth } from '@/lib/utils/dates'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Calendar } from 'lucide-react'

interface CuentaSaldo {
  codigo_2: string
  total_debe: number
  total_haber: number
}

interface LineaEstado {
  label: string
  amount: number
  level: 'normal' | 'subtotal' | 'total' | 'separator'
  indent?: number
}

export default function EstadoResultadosPage() {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState(getCurrentPeriod())
  const [saldos, setSaldos] = useState<Map<string, { debe: number; haber: number }>>(new Map())
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [year, month] = periodo.split('-').map(Number)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endMonth = month === 12 ? 1 : month + 1
      const endYear = month === 12 ? year + 1 : year
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

      const { data, error } = await supabase
        .from('movimientos_contables')
        .select(`
          debe,
          haber,
          cuentas_contables!inner(codigo),
          asientos_contables!inner(fecha)
        `)
        .gte('asientos_contables.fecha', startDate)
        .lt('asientos_contables.fecha', endDate)

      if (error) {
        console.error('Error fetching movimientos:', error)
        setSaldos(new Map())
        return
      }

      const grouped = new Map<string, { debe: number; haber: number }>()

      if (data) {
        for (const mov of data) {
          const cuenta = mov.cuentas_contables as unknown as { codigo: string }
          if (!cuenta?.codigo) continue
          const prefix = cuenta.codigo.substring(0, 2)
          const current = grouped.get(prefix) || { debe: 0, haber: 0 }
          current.debe += Number(mov.debe) || 0
          current.haber += Number(mov.haber) || 0
          grouped.set(prefix, current)
        }
      }

      setSaldos(grouped)
    } catch (err) {
      console.error('Error:', err)
      setSaldos(new Map())
    } finally {
      setLoading(false)
    }
  }, [periodo, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getSaldo = useCallback(
    (prefixes: string[]): number => {
      let total = 0
      for (const prefix of prefixes) {
        const s = saldos.get(prefix)
        if (s) {
          total += s.haber - s.debe
        }
      }
      return total
    },
    [saldos]
  )

  const getGasto = useCallback(
    (prefixes: string[]): number => {
      let total = 0
      for (const prefix of prefixes) {
        const s = saldos.get(prefix)
        if (s) {
          total += s.debe - s.haber
        }
      }
      return total
    },
    [saldos]
  )

  const lineas = useMemo((): LineaEstado[] => {
    const ventasNetas = getSaldo(['70'])
    const costoVentas = getGasto(['69'])
    const utilidadBruta = ventasNetas - costoVentas

    const gastosAdmin = getGasto(['94', '63'])
    const gastosVentas = getGasto(['95', '64'])
    const totalGastosOperativos = gastosAdmin + gastosVentas
    const utilidadOperativa = utilidadBruta - totalGastosOperativos

    const otrosIngresos = getSaldo(['77'])
    const otrosGastos = getGasto(['67'])
    const resultadoFinanciero = otrosIngresos - otrosGastos
    const utilidadAntesImpuestos = utilidadOperativa + resultadoFinanciero

    const impuestoRenta = utilidadAntesImpuestos > 0 ? utilidadAntesImpuestos * 0.295 : 0
    const utilidadNeta = utilidadAntesImpuestos - impuestoRenta

    const depreciacion = getGasto(['68'])
    const ebitda = utilidadOperativa + depreciacion

    return [
      { label: 'VENTAS NETAS', amount: ventasNetas, level: 'subtotal' },
      { label: '', amount: 0, level: 'separator' },
      { label: '(-) Costo de Ventas', amount: -costoVentas, level: 'normal', indent: 1 },
      { label: '', amount: 0, level: 'separator' },
      { label: 'UTILIDAD BRUTA', amount: utilidadBruta, level: 'subtotal' },
      { label: '', amount: 0, level: 'separator' },
      { label: '(-) Gastos de Administracion', amount: -gastosAdmin, level: 'normal', indent: 1 },
      { label: '(-) Gastos de Ventas', amount: -gastosVentas, level: 'normal', indent: 1 },
      { label: 'Total Gastos Operativos', amount: -totalGastosOperativos, level: 'normal', indent: 1 },
      { label: '', amount: 0, level: 'separator' },
      { label: 'UTILIDAD OPERATIVA (EBIT)', amount: utilidadOperativa, level: 'subtotal' },
      { label: '', amount: 0, level: 'separator' },
      { label: '(+) Otros Ingresos Financieros', amount: otrosIngresos, level: 'normal', indent: 1 },
      { label: '(-) Otros Gastos Financieros', amount: -otrosGastos, level: 'normal', indent: 1 },
      { label: 'Resultado Financiero Neto', amount: resultadoFinanciero, level: 'normal', indent: 1 },
      { label: '', amount: 0, level: 'separator' },
      { label: 'UTILIDAD ANTES DE IMPUESTOS', amount: utilidadAntesImpuestos, level: 'subtotal' },
      { label: '', amount: 0, level: 'separator' },
      { label: '(-) Impuesto a la Renta (29.5%)', amount: -impuestoRenta, level: 'normal', indent: 1 },
      { label: '', amount: 0, level: 'separator' },
      { label: 'UTILIDAD NETA', amount: utilidadNeta, level: 'total' },
      { label: '', amount: 0, level: 'separator' },
      { label: '', amount: 0, level: 'separator' },
      { label: 'EBITDA', amount: ebitda, level: 'subtotal' },
    ]
  }, [getSaldo, getGasto])

  const exportData = lineas
    .filter((l) => l.level !== 'separator')
    .map((l) => ({
      concepto: l.label,
      monto: l.amount,
      monto_formateado: formatCurrency(l.amount),
    }))

  const exportColumns = [
    { header: 'Concepto', key: 'concepto' },
    { header: 'Monto (PEN)', key: 'monto' },
    { header: 'Monto Formateado', key: 'monto_formateado' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-64 bg-zinc-800/50" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-80 bg-zinc-800/50" />
          <Skeleton className="h-4 w-48 bg-zinc-800/50" />
        </div>
        <Skeleton className="h-10 w-48 bg-zinc-800/50" />
        <div className="rounded-lg border border-zinc-800 p-4 space-y-3">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-5 w-60 bg-zinc-800/50" />
              <Skeleton className="h-5 w-32 bg-zinc-800/50" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <TrendingUp className="h-7 w-7 text-emerald-400" />
            Estado de Resultados
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Perdidas y Ganancias &mdash; {formatMonth(`${periodo}-01`)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="bg-transparent text-sm text-zinc-200 outline-none [color-scheme:dark]"
            />
          </div>
          <ExportButton
            data={exportData}
            filename={`estado-resultados-${periodo}`}
            columns={exportColumns}
            title={`Estado de Resultados - ${formatMonth(`${periodo}-01`)}`}
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-zinc-700 bg-zinc-800/50 px-6 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Concepto
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 text-right min-w-[160px]">
            Importe (PEN)
          </span>
        </div>

        <div className="divide-y divide-zinc-800/50">
          {lineas.map((linea, idx) => {
            if (linea.level === 'separator') {
              return <div key={idx} className="h-px bg-zinc-800/30" />
            }

            const isTotal = linea.level === 'total'
            const isSubtotal = linea.level === 'subtotal'
            const indent = linea.indent ? linea.indent * 24 : 0
            const isNegative = linea.amount < 0

            return (
              <div
                key={idx}
                className={`grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-3 ${
                  isTotal
                    ? 'bg-emerald-500/5 border-t-2 border-emerald-500/30'
                    : isSubtotal
                      ? 'bg-zinc-800/20'
                      : ''
                }`}
              >
                <span
                  className={`text-sm ${
                    isTotal
                      ? 'font-bold text-emerald-400 text-base'
                      : isSubtotal
                        ? 'font-semibold text-zinc-100'
                        : 'text-zinc-300'
                  }`}
                  style={{ paddingLeft: `${indent}px` }}
                >
                  {linea.label}
                </span>
                <span
                  className={`font-mono text-sm text-right min-w-[160px] ${
                    isTotal
                      ? 'font-bold text-emerald-400 text-base'
                      : isSubtotal
                        ? 'font-semibold text-zinc-100'
                        : isNegative
                          ? 'text-red-400'
                          : 'text-zinc-300'
                  }`}
                >
                  {formatCurrency(linea.amount)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-xs text-zinc-600 text-center">
        Basado en el Plan Contable General Empresarial (PCGE) del Peru. Tasa IR: 29.5%.
      </div>
    </div>
  )
}
