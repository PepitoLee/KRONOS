'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { ExportButton } from '@/components/import-export/ExportButton'
import { formatCurrency } from '@/lib/utils/currency'
import { getCurrentPeriod, formatMonth } from '@/lib/utils/dates'
import { Skeleton } from '@/components/ui/skeleton'
import { Wallet, Calendar } from 'lucide-react'

interface MovimientoTesoreria {
  tipo: string
  monto: number
  tipo_flujo: string
}

interface LineaFlujo {
  label: string
  amount: number
  level: 'header' | 'normal' | 'subtotal' | 'total' | 'separator'
  indent?: number
}

export default function FlujoCajaPage() {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState(getCurrentPeriod())
  const [movimientos, setMovimientos] = useState<MovimientoTesoreria[]>([])
  const [saldoInicial, setSaldoInicial] = useState(0)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [year, month] = periodo.split('-').map(Number)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endMonth = month === 12 ? 1 : month + 1
      const endYear = month === 12 ? year + 1 : year
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

      // Fetch movimientos del periodo
      const { data: movData, error: movError } = await supabase
        .from('movimientos_tesoreria')
        .select('tipo, monto, tipo_flujo')
        .gte('fecha', startDate)
        .lt('fecha', endDate)

      if (movError) {
        console.error('Error fetching movimientos tesoreria:', movError)
        setMovimientos([])
      } else {
        setMovimientos(movData ?? [])
      }

      // Calcular saldo inicial: suma de todos los movimientos antes del periodo
      const { data: saldoData, error: saldoError } = await supabase
        .from('movimientos_tesoreria')
        .select('tipo, monto')
        .lt('fecha', startDate)

      if (saldoError) {
        console.error('Error fetching saldo inicial:', saldoError)
        setSaldoInicial(0)
      } else {
        let acumulado = 0
        if (saldoData) {
          for (const mov of saldoData) {
            const amount = Number(mov.monto) || 0
            if (mov.tipo === 'ingreso') {
              acumulado += amount
            } else {
              acumulado -= amount
            }
          }
        }
        setSaldoInicial(acumulado)
      }
    } catch (err) {
      console.error('Error:', err)
      setMovimientos([])
      setSaldoInicial(0)
    } finally {
      setLoading(false)
    }
  }, [periodo, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const sumByTipoFlujo = useCallback(
    (tipoFlujo: string, tipo: 'ingreso' | 'egreso'): number => {
      return movimientos
        .filter((m) => m.tipo_flujo === tipoFlujo && m.tipo === tipo)
        .reduce((sum, m) => sum + (Number(m.monto) || 0), 0)
    },
    [movimientos]
  )

  const lineas = useMemo((): LineaFlujo[] => {
    // OPERATIVAS
    const cobrosClientes = sumByTipoFlujo('operativo', 'ingreso')
    const pagosProveedores = sumByTipoFlujo('operativo_proveedores', 'egreso')
    const pagoPlanilla = sumByTipoFlujo('operativo_planilla', 'egreso')
    const pagoImpuestos = sumByTipoFlujo('operativo_impuestos', 'egreso')
    const otrosOperativosIngreso = sumByTipoFlujo('operativo_otros', 'ingreso')
    const otrosOperativosEgreso = sumByTipoFlujo('operativo_otros', 'egreso')

    // Si no hay datos detallados, agrupar por tipo_flujo generico
    const operativoIngresos = cobrosClientes + otrosOperativosIngreso +
      sumByTipoFlujo('operativo', 'ingreso')
    const operativoEgresos = pagosProveedores + pagoPlanilla + pagoImpuestos + otrosOperativosEgreso +
      sumByTipoFlujo('operativo', 'egreso')

    // Evitar doble conteo: usar totales directos si no hay subcategorias
    const hasSubcategorias = movimientos.some((m) =>
      ['operativo_proveedores', 'operativo_planilla', 'operativo_impuestos'].includes(m.tipo_flujo)
    )

    let cobros = 0
    let proveedores = 0
    let planilla = 0
    let impuestos = 0
    let otrosOp = 0

    if (hasSubcategorias) {
      cobros = cobrosClientes + otrosOperativosIngreso
      proveedores = pagosProveedores
      planilla = pagoPlanilla
      impuestos = pagoImpuestos
      otrosOp = otrosOperativosEgreso
    } else {
      // Agrupar todo en cobros / pagos genericos
      cobros = movimientos
        .filter((m) => m.tipo_flujo === 'operativo' && m.tipo === 'ingreso')
        .reduce((s, m) => s + (Number(m.monto) || 0), 0)
      const egresosOp = movimientos
        .filter((m) => m.tipo_flujo === 'operativo' && m.tipo === 'egreso')
        .reduce((s, m) => s + (Number(m.monto) || 0), 0)
      proveedores = egresosOp
    }

    const flujoOperativo = cobros - proveedores - planilla - impuestos - otrosOp

    // INVERSION
    const ventaActivos = sumByTipoFlujo('inversion', 'ingreso')
    const compraActivos = sumByTipoFlujo('inversion', 'egreso')
    const flujoInversion = ventaActivos - compraActivos

    // FINANCIAMIENTO
    const prestamosRecibidos = sumByTipoFlujo('financiamiento', 'ingreso')
    const prestamosAmortizados = sumByTipoFlujo('financiamiento', 'egreso')
    const flujoFinanciamiento = prestamosRecibidos - prestamosAmortizados

    const flujoNeto = flujoOperativo + flujoInversion + flujoFinanciamiento
    const saldoFinal = saldoInicial + flujoNeto

    return [
      { label: 'ACTIVIDADES OPERATIVAS', amount: 0, level: 'header' },
      { label: '', amount: 0, level: 'separator' },
      { label: 'Cobros a clientes', amount: cobros, level: 'normal', indent: 1 },
      { label: '(-) Pago a proveedores', amount: -proveedores, level: 'normal', indent: 1 },
      ...(hasSubcategorias
        ? [
            { label: '(-) Pago de planilla', amount: -planilla, level: 'normal' as const, indent: 1 },
            { label: '(-) Pago de impuestos', amount: -impuestos, level: 'normal' as const, indent: 1 },
            ...(otrosOp > 0
              ? [{ label: '(-) Otros egresos operativos', amount: -otrosOp, level: 'normal' as const, indent: 1 }]
              : []),
          ]
        : []),
      { label: 'Flujo Neto de Actividades Operativas', amount: flujoOperativo, level: 'subtotal' },
      { label: '', amount: 0, level: 'separator' },
      { label: '', amount: 0, level: 'separator' },

      { label: 'ACTIVIDADES DE INVERSION', amount: 0, level: 'header' },
      { label: '', amount: 0, level: 'separator' },
      { label: '(+) Venta de activos fijos', amount: ventaActivos, level: 'normal', indent: 1 },
      { label: '(-) Compra de activos fijos', amount: -compraActivos, level: 'normal', indent: 1 },
      { label: 'Flujo Neto de Actividades de Inversion', amount: flujoInversion, level: 'subtotal' },
      { label: '', amount: 0, level: 'separator' },
      { label: '', amount: 0, level: 'separator' },

      { label: 'ACTIVIDADES DE FINANCIAMIENTO', amount: 0, level: 'header' },
      { label: '', amount: 0, level: 'separator' },
      { label: '(+) Prestamos recibidos', amount: prestamosRecibidos, level: 'normal', indent: 1 },
      { label: '(-) Amortizacion de prestamos', amount: -prestamosAmortizados, level: 'normal', indent: 1 },
      { label: 'Flujo Neto de Actividades de Financiamiento', amount: flujoFinanciamiento, level: 'subtotal' },
      { label: '', amount: 0, level: 'separator' },
      { label: '', amount: 0, level: 'separator' },

      { label: 'FLUJO NETO DEL PERIODO', amount: flujoNeto, level: 'total' },
      { label: '', amount: 0, level: 'separator' },
      { label: 'Saldo Inicial de Efectivo', amount: saldoInicial, level: 'normal' },
      { label: '(+/-) Flujo Neto del Periodo', amount: flujoNeto, level: 'normal' },
      { label: '', amount: 0, level: 'separator' },
      { label: 'SALDO FINAL DE EFECTIVO', amount: saldoFinal, level: 'total' },
    ]
  }, [movimientos, saldoInicial, sumByTipoFlujo])

  const exportData = lineas
    .filter((l) => l.level !== 'separator')
    .map((l) => ({
      concepto: l.label,
      monto: l.level === 'header' ? '' : l.amount,
      monto_formateado: l.level === 'header' ? '' : formatCurrency(l.amount),
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
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-5 w-64 bg-zinc-800/50" />
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
            <Wallet className="h-7 w-7 text-amber-400" />
            Flujo de Caja
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Estado de Flujos de Efectivo &mdash; {formatMonth(`${periodo}-01`)}
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
            filename={`flujo-caja-${periodo}`}
            columns={exportColumns}
            title={`Flujo de Caja - ${formatMonth(`${periodo}-01`)}`}
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

            const isHeader = linea.level === 'header'
            const isTotal = linea.level === 'total'
            const isSubtotal = linea.level === 'subtotal'
            const indent = linea.indent ? linea.indent * 24 : 0
            const isNegative = linea.amount < 0

            return (
              <div
                key={idx}
                className={`grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-3 ${
                  isTotal
                    ? 'bg-amber-500/5 border-t-2 border-amber-500/30'
                    : isSubtotal
                      ? 'bg-zinc-800/20'
                      : isHeader
                        ? 'bg-zinc-800/40'
                        : ''
                }`}
              >
                <span
                  className={`text-sm ${
                    isTotal
                      ? 'font-bold text-amber-400 text-base'
                      : isSubtotal
                        ? 'font-semibold text-zinc-100'
                        : isHeader
                          ? 'font-bold text-zinc-200 uppercase tracking-wide text-xs'
                          : 'text-zinc-300'
                  }`}
                  style={{ paddingLeft: `${indent}px` }}
                >
                  {linea.label}
                </span>
                {!isHeader && (
                  <span
                    className={`font-mono text-sm text-right min-w-[160px] ${
                      isTotal
                        ? 'font-bold text-amber-400 text-base'
                        : isSubtotal
                          ? 'font-semibold text-zinc-100'
                          : isNegative
                            ? 'text-red-400'
                            : 'text-zinc-300'
                    }`}
                  >
                    {formatCurrency(linea.amount)}
                  </span>
                )}
                {isHeader && <span />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-xs text-zinc-600 text-center">
        Metodo directo. Datos obtenidos de movimientos de tesoreria clasificados por tipo de actividad.
      </div>
    </div>
  )
}
