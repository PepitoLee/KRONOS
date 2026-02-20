'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { ExportButton } from '@/components/import-export/ExportButton'
import { formatCurrency } from '@/lib/utils/currency'
import { getCurrentPeriod, formatMonth } from '@/lib/utils/dates'
import { Skeleton } from '@/components/ui/skeleton'
import { Scale, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react'

interface LineaBalance {
  label: string
  amount: number
  level: 'header' | 'normal' | 'subtotal' | 'total' | 'separator' | 'validation'
  indent?: number
}

export default function SituacionFinancieraPage() {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState(getCurrentPeriod())
  const [saldos, setSaldos] = useState<Map<string, { debe: number; haber: number }>>(new Map())
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [year, month] = periodo.split('-').map(Number)
      const endMonth = month === 12 ? 1 : month + 1
      const endYear = month === 12 ? year + 1 : year
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

      const { data, error } = await supabase
        .from('movimientos_contables')
        .select(`
          debe,
          haber,
          cuentas_contables!inner(codigo)
        `)
        .lt('fecha', endDate)

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

  const getDeudor = useCallback(
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

  const getAcreedor = useCallback(
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

  const lineas = useMemo((): LineaBalance[] => {
    // ACTIVOS
    const efectivo = getDeudor(['10'])
    const cxc = getDeudor(['12'])
    const inventarios = getDeudor(['20', '21'])
    const otrosActivosCorrientes = getDeudor(['14', '16', '17', '18'])
    const totalActivoCorriente = efectivo + cxc + inventarios + otrosActivosCorrientes

    const ime = getDeudor(['33'])
    const intangibles = getDeudor(['34'])
    const depreciacion = getAcreedor(['39'])
    const otrosActivosNoCorrientes = getDeudor(['30', '31', '32'])
    const totalActivoNoCorriente = ime + intangibles - depreciacion + otrosActivosNoCorrientes

    const totalActivo = totalActivoCorriente + totalActivoNoCorriente

    // PASIVOS
    const cxp = getAcreedor(['42'])
    const tributos = getAcreedor(['40'])
    const remuneraciones = getAcreedor(['41'])
    const otrosPasivosCorrientes = getAcreedor(['43', '44', '46'])
    const totalPasivoCorriente = cxp + tributos + remuneraciones + otrosPasivosCorrientes

    const obligacionesLP = getAcreedor(['45'])
    const otrosPasivosNoCorrientes = getAcreedor(['47', '48', '49'])
    const totalPasivoNoCorriente = obligacionesLP + otrosPasivosNoCorrientes

    const totalPasivo = totalPasivoCorriente + totalPasivoNoCorriente

    // PATRIMONIO
    const capital = getAcreedor(['50'])
    const reservas = getAcreedor(['58'])
    const resultadosAcumulados = getAcreedor(['59'])

    // Resultado del ejercicio (ingresos - gastos del periodo)
    const ingresos = getAcreedor(['70', '73', '74', '75', '76', '77'])
    const gastos = getDeudor(['60', '61', '62', '63', '64', '65', '66', '67', '68', '69'])
    const resultadoEjercicio = ingresos - gastos

    const totalPatrimonio = capital + reservas + resultadosAcumulados + resultadoEjercicio
    const totalPasivoPatrimonio = totalPasivo + totalPatrimonio
    const diferencia = Math.abs(totalActivo - totalPasivoPatrimonio)
    const cuadra = diferencia < 0.01

    return [
      { label: 'ACTIVOS', amount: 0, level: 'header' },
      { label: '', amount: 0, level: 'separator' },
      { label: 'Activo Corriente', amount: 0, level: 'header' },
      { label: 'Efectivo y equivalentes de efectivo', amount: efectivo, level: 'normal', indent: 1 },
      { label: 'Cuentas por cobrar comerciales', amount: cxc, level: 'normal', indent: 1 },
      { label: 'Inventarios', amount: inventarios, level: 'normal', indent: 1 },
      { label: 'Otros activos corrientes', amount: otrosActivosCorrientes, level: 'normal', indent: 1 },
      { label: 'Total Activo Corriente', amount: totalActivoCorriente, level: 'subtotal', indent: 1 },
      { label: '', amount: 0, level: 'separator' },
      { label: 'Activo No Corriente', amount: 0, level: 'header' },
      { label: 'Inmuebles, maquinaria y equipo', amount: ime, level: 'normal', indent: 1 },
      { label: 'Activos intangibles', amount: intangibles, level: 'normal', indent: 1 },
      { label: '(-) Depreciacion acumulada', amount: -depreciacion, level: 'normal', indent: 1 },
      { label: 'Otros activos no corrientes', amount: otrosActivosNoCorrientes, level: 'normal', indent: 1 },
      { label: 'Total Activo No Corriente', amount: totalActivoNoCorriente, level: 'subtotal', indent: 1 },
      { label: '', amount: 0, level: 'separator' },
      { label: 'TOTAL ACTIVOS', amount: totalActivo, level: 'total' },
      { label: '', amount: 0, level: 'separator' },
      { label: '', amount: 0, level: 'separator' },

      { label: 'PASIVOS', amount: 0, level: 'header' },
      { label: '', amount: 0, level: 'separator' },
      { label: 'Pasivo Corriente', amount: 0, level: 'header' },
      { label: 'Cuentas por pagar comerciales', amount: cxp, level: 'normal', indent: 1 },
      { label: 'Tributos por pagar', amount: tributos, level: 'normal', indent: 1 },
      { label: 'Remuneraciones por pagar', amount: remuneraciones, level: 'normal', indent: 1 },
      { label: 'Otros pasivos corrientes', amount: otrosPasivosCorrientes, level: 'normal', indent: 1 },
      { label: 'Total Pasivo Corriente', amount: totalPasivoCorriente, level: 'subtotal', indent: 1 },
      { label: '', amount: 0, level: 'separator' },
      { label: 'Pasivo No Corriente', amount: 0, level: 'header' },
      { label: 'Obligaciones financieras a largo plazo', amount: obligacionesLP, level: 'normal', indent: 1 },
      { label: 'Otros pasivos no corrientes', amount: otrosPasivosNoCorrientes, level: 'normal', indent: 1 },
      { label: 'Total Pasivo No Corriente', amount: totalPasivoNoCorriente, level: 'subtotal', indent: 1 },
      { label: '', amount: 0, level: 'separator' },
      { label: 'TOTAL PASIVOS', amount: totalPasivo, level: 'total' },
      { label: '', amount: 0, level: 'separator' },
      { label: '', amount: 0, level: 'separator' },

      { label: 'PATRIMONIO', amount: 0, level: 'header' },
      { label: '', amount: 0, level: 'separator' },
      { label: 'Capital social', amount: capital, level: 'normal', indent: 1 },
      { label: 'Reservas', amount: reservas, level: 'normal', indent: 1 },
      { label: 'Resultados acumulados', amount: resultadosAcumulados, level: 'normal', indent: 1 },
      { label: 'Resultado del ejercicio', amount: resultadoEjercicio, level: 'normal', indent: 1 },
      { label: 'TOTAL PATRIMONIO', amount: totalPatrimonio, level: 'total' },
      { label: '', amount: 0, level: 'separator' },
      { label: '', amount: 0, level: 'separator' },

      { label: 'TOTAL PASIVO + PATRIMONIO', amount: totalPasivoPatrimonio, level: 'total' },
      { label: '', amount: 0, level: 'separator' },
      {
        label: cuadra
          ? 'Balance cuadrado correctamente'
          : `Diferencia de cuadre: ${formatCurrency(diferencia)}`,
        amount: cuadra ? 1 : 0,
        level: 'validation',
      },
    ]
  }, [getDeudor, getAcreedor])

  const exportData = lineas
    .filter((l) => l.level !== 'separator' && l.level !== 'validation')
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
          {Array.from({ length: 20 }).map((_, i) => (
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
            <Scale className="h-7 w-7 text-blue-400" />
            Balance General
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Situacion Financiera al cierre de {formatMonth(`${periodo}-01`)}
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
            filename={`balance-general-${periodo}`}
            columns={exportColumns}
            title={`Balance General - ${formatMonth(`${periodo}-01`)}`}
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

            if (linea.level === 'validation') {
              const isOk = linea.amount === 1
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-center gap-2 px-6 py-4 ${
                    isOk ? 'bg-emerald-500/5' : 'bg-red-500/5'
                  }`}
                >
                  {isOk ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      isOk ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {linea.label}
                  </span>
                </div>
              )
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
                    ? 'bg-blue-500/5 border-t-2 border-blue-500/30'
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
                      ? 'font-bold text-blue-400 text-base'
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
                        ? 'font-bold text-blue-400 text-base'
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
        Basado en el Plan Contable General Empresarial (PCGE) del Peru. Saldos acumulados al cierre del periodo.
      </div>
    </div>
  )
}
