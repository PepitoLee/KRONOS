'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { ExportButton } from '@/components/import-export/ExportButton'
import { formatCurrency } from '@/lib/utils/currency'
import { getCurrentPeriod } from '@/lib/utils/dates'
import { Skeleton } from '@/components/ui/skeleton'
import { Calculator, Calendar, FileCheck } from 'lucide-react'

interface CasillaPDT {
  casilla: string
  descripcion: string
  monto: number
  tipo: 'base' | 'impuesto' | 'credito' | 'resultado'
}

export default function PDT621Page() {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState(getCurrentPeriod())
  const [ventasGravadas, setVentasGravadas] = useState(0)
  const [comprasGravadas, setComprasGravadas] = useState(0)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [year, month] = periodo.split('-').map(Number)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endMonth = month === 12 ? 1 : month + 1
      const endYear = month === 12 ? year + 1 : year
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

      const { data: ventas } = await supabase
        .from('documentos')
        .select('subtotal')
        .eq('tipo_operacion', 'venta')
        .neq('estado', 'anulado')
        .gte('fecha_emision', startDate)
        .lt('fecha_emision', endDate)

      const { data: compras } = await supabase
        .from('documentos')
        .select('subtotal')
        .eq('tipo_operacion', 'compra')
        .neq('estado', 'anulado')
        .gte('fecha_emision', startDate)
        .lt('fecha_emision', endDate)

      setVentasGravadas(ventas?.reduce((s, v) => s + Number(v.subtotal), 0) ?? 0)
      setComprasGravadas(compras?.reduce((s, c) => s + Number(c.subtotal), 0) ?? 0)
    } finally {
      setLoading(false)
    }
  }, [periodo, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const casillas = useMemo((): CasillaPDT[] => {
    const igvVentas = ventasGravadas * 0.18
    const creditoFiscal = comprasGravadas * 0.18
    const igvAPagar = Math.max(igvVentas - creditoFiscal, 0)
    const saldoAFavor = Math.max(creditoFiscal - igvVentas, 0)
    const pagoACuentaIR = ventasGravadas * 0.015 // Coeficiente 1.5%

    return [
      { casilla: '100', descripcion: 'Ventas netas gravadas', monto: ventasGravadas, tipo: 'base' },
      { casilla: '105', descripcion: 'Ventas no gravadas', monto: 0, tipo: 'base' },
      { casilla: '106', descripcion: 'Ventas por exportacion', monto: 0, tipo: 'base' },
      { casilla: '102', descripcion: 'IGV resultante (18%)', monto: igvVentas, tipo: 'impuesto' },
      { casilla: '107', descripcion: 'Adquisiciones gravadas', monto: comprasGravadas, tipo: 'base' },
      { casilla: '110', descripcion: 'Credito fiscal (18%)', monto: creditoFiscal, tipo: 'credito' },
      { casilla: '140', descripcion: 'IGV a pagar del periodo', monto: igvAPagar, tipo: 'resultado' },
      { casilla: '145', descripcion: 'Saldo a favor', monto: saldoAFavor, tipo: 'credito' },
      { casilla: '301', descripcion: 'Ingresos netos (Renta)', monto: ventasGravadas, tipo: 'base' },
      { casilla: '312', descripcion: 'Pago a cuenta IR (1.5%)', monto: pagoACuentaIR, tipo: 'resultado' },
      { casilla: '000', descripcion: 'TOTAL TRIBUTOS A PAGAR', monto: igvAPagar + pagoACuentaIR, tipo: 'resultado' },
    ]
  }, [ventasGravadas, comprasGravadas])

  const exportData = casillas.map((c) => ({
    casilla: c.casilla,
    descripcion: c.descripcion,
    monto: c.monto,
    monto_formateado: formatCurrency(c.monto),
  }))

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-64 bg-zinc-800/50" />
        <Skeleton className="h-8 w-80 bg-zinc-800/50" />
        <Skeleton className="h-96 bg-zinc-800/50 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <Calculator className="h-7 w-7 text-emerald-400" />
            PDT 621 - IGV Renta Mensual
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Pre-llenado de casillas para declaracion mensual</p>
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
          <ExportButton data={exportData} filename={`pdt621-${periodo}`} title={`PDT 621 - ${periodo}`} />
        </div>
      </div>

      {/* PDT Form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-700 flex items-center gap-3">
          <FileCheck className="h-5 w-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Formulario Virtual 621</h3>
            <p className="text-xs text-zinc-500">Los montos se calculan automaticamente desde los documentos registrados</p>
          </div>
        </div>

        <div className="divide-y divide-zinc-800/50">
          {/* IGV Section */}
          <div className="px-6 py-3 bg-blue-500/5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Impuesto General a las Ventas
            </h4>
          </div>
          {casillas.slice(0, 8).map((c) => (
            <div key={c.casilla} className={`grid grid-cols-[80px_1fr_auto] items-center gap-4 px-6 py-3 ${c.tipo === 'resultado' ? 'bg-emerald-500/5' : ''}`}>
              <span className="font-mono text-xs text-zinc-500">Cas. {c.casilla}</span>
              <span className={`text-sm ${c.tipo === 'resultado' ? 'font-semibold text-zinc-100' : 'text-zinc-300'}`}>
                {c.descripcion}
              </span>
              <span className={`font-mono text-sm text-right min-w-[140px] ${
                c.tipo === 'resultado' ? 'font-bold text-emerald-400' :
                c.tipo === 'credito' ? 'text-blue-400' :
                c.tipo === 'impuesto' ? 'text-amber-400' : 'text-zinc-300'
              }`}>
                {formatCurrency(c.monto)}
              </span>
            </div>
          ))}

          {/* Renta Section */}
          <div className="px-6 py-3 bg-purple-500/5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Impuesto a la Renta - Pagos a Cuenta
            </h4>
          </div>
          {casillas.slice(8, 10).map((c) => (
            <div key={c.casilla} className={`grid grid-cols-[80px_1fr_auto] items-center gap-4 px-6 py-3 ${c.tipo === 'resultado' ? 'bg-emerald-500/5' : ''}`}>
              <span className="font-mono text-xs text-zinc-500">Cas. {c.casilla}</span>
              <span className={`text-sm ${c.tipo === 'resultado' ? 'font-semibold text-zinc-100' : 'text-zinc-300'}`}>
                {c.descripcion}
              </span>
              <span className={`font-mono text-sm text-right min-w-[140px] ${c.tipo === 'resultado' ? 'font-bold text-purple-400' : 'text-zinc-300'}`}>
                {formatCurrency(c.monto)}
              </span>
            </div>
          ))}

          {/* Total */}
          <div className="grid grid-cols-[80px_1fr_auto] items-center gap-4 px-6 py-4 bg-emerald-500/10 border-t-2 border-emerald-500/30">
            <span className="font-mono text-xs text-zinc-500"></span>
            <span className="text-base font-bold text-emerald-400">{casillas[10].descripcion}</span>
            <span className="font-mono text-lg font-bold text-emerald-400 text-right min-w-[140px]">
              {formatCurrency(casillas[10].monto)}
            </span>
          </div>
        </div>
      </div>

      <div className="text-xs text-zinc-600 text-center">
        Este es un calculo referencial. Verifique los montos con su contador antes de presentar la declaracion.
        Coeficiente IR: 1.5% (puede variar segun declaracion jurada anual).
      </div>
    </div>
  )
}
