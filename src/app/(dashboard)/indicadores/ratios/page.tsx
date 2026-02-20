'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { ExportButton } from '@/components/import-export/ExportButton'
import { formatNumber, formatPercent } from '@/lib/utils/currency'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCurrentPeriod } from '@/lib/utils/dates'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'

interface RatioDisplay {
  nombre: string
  valor: number
  unidad: string
  semaforo: 'verde' | 'amarillo' | 'rojo'
  formula: string
  categoria: string
}

export default function RatiosPage() {
  const [ratios, setRatios] = useState<RatioDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState(getCurrentPeriod())
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      // Fetch account balances from movimientos_contables
      const { data: movimientos } = await supabase
        .from('movimientos_contables')
        .select(`
          debe, haber,
          cuenta_contable:cuentas_contables(codigo, nombre, tipo)
        `)

      // Aggregate by account prefix (first 2 digits)
      const saldos: Record<string, { debe: number; haber: number }> = {}
      for (const mov of movimientos ?? []) {
        const cuenta = mov.cuenta_contable as unknown as { codigo: string; nombre: string; tipo: string } | null
        if (!cuenta) continue
        const prefijo = cuenta.codigo.substring(0, 2)
        if (!saldos[prefijo]) saldos[prefijo] = { debe: 0, haber: 0 }
        saldos[prefijo].debe += Number(mov.debe) || 0
        saldos[prefijo].haber += Number(mov.haber) || 0
      }

      const s = (p: string) => Math.abs((saldos[p]?.debe ?? 0) - (saldos[p]?.haber ?? 0))
      const safe = (n: number, d: number) => (d === 0 ? 0 : n / d)

      // Balance components
      const efectivo = s('10')
      const cxc = s('12')
      const inventarios = s('20') + s('21')
      const activoCorriente = efectivo + cxc + inventarios
      const cxp = s('42')
      const tributos = s('40')
      const remuneraciones = s('41')
      const pasivoCorriente = cxp + tributos + remuneraciones
      const activoTotal = activoCorriente + s('33') - s('39') + s('34')
      const pasivoTotal = pasivoCorriente + s('45')
      const patrimonio = s('50') + s('59')

      // P&L components
      const ventas = s('70')
      const costoVentas = s('69')
      const gastosAdmin = s('94') || s('63')
      const gastosVenta = s('95') || s('64')
      const gastosFinancieros = s('67')
      const utilidadBruta = ventas - costoVentas
      const utilidadOperativa = utilidadBruta - gastosAdmin - gastosVenta
      const utilidadNeta = utilidadOperativa - gastosFinancieros - (utilidadOperativa > 0 ? utilidadOperativa * 0.295 : 0)

      const evalSemaforo = (valor: number, verde: [number, number], amarillo: [number, number]): 'verde' | 'amarillo' | 'rojo' => {
        if (valor >= verde[0] && valor <= verde[1]) return 'verde'
        if (valor >= amarillo[0] && valor <= amarillo[1]) return 'amarillo'
        return 'rojo'
      }

      const calculados: RatioDisplay[] = [
        // Liquidez
        { nombre: 'Liquidez Corriente', valor: safe(activoCorriente, pasivoCorriente), unidad: 'veces', semaforo: evalSemaforo(safe(activoCorriente, pasivoCorriente), [1.5, 3], [1, 1.5]), formula: 'Act.Corriente / Pas.Corriente', categoria: 'Liquidez' },
        { nombre: 'Prueba Ácida', valor: safe(activoCorriente - inventarios, pasivoCorriente), unidad: 'veces', semaforo: evalSemaforo(safe(activoCorriente - inventarios, pasivoCorriente), [1, 2], [0.5, 1]), formula: '(Act.Corr - Inv) / Pas.Corr', categoria: 'Liquidez' },
        { nombre: 'Capital de Trabajo', valor: activoCorriente - pasivoCorriente, unidad: 'S/', semaforo: activoCorriente - pasivoCorriente > 0 ? 'verde' : 'rojo', formula: 'Act.Corriente - Pas.Corriente', categoria: 'Liquidez' },
        { nombre: 'Liquidez Absoluta', valor: safe(efectivo, pasivoCorriente), unidad: 'veces', semaforo: evalSemaforo(safe(efectivo, pasivoCorriente), [0.3, 1], [0.1, 0.3]), formula: 'Efectivo / Pas.Corriente', categoria: 'Liquidez' },
        // Endeudamiento
        { nombre: 'Endeudamiento Total', valor: safe(pasivoTotal, activoTotal), unidad: 'ratio', semaforo: evalSemaforo(safe(pasivoTotal, activoTotal), [0, 0.5], [0.5, 0.7]), formula: 'Pasivo / Activo Total', categoria: 'Endeudamiento' },
        { nombre: 'Endeudamiento Patrimonial', valor: safe(pasivoTotal, patrimonio), unidad: 'ratio', semaforo: evalSemaforo(safe(pasivoTotal, patrimonio), [0, 1], [1, 2]), formula: 'Pasivo / Patrimonio', categoria: 'Endeudamiento' },
        { nombre: 'Cobertura de Intereses', valor: safe(utilidadOperativa, gastosFinancieros), unidad: 'veces', semaforo: evalSemaforo(safe(utilidadOperativa, gastosFinancieros), [3, 100], [1.5, 3]), formula: 'EBIT / Gastos Financieros', categoria: 'Endeudamiento' },
        // Rentabilidad
        { nombre: 'Margen Bruto', valor: safe(utilidadBruta, ventas) * 100, unidad: '%', semaforo: evalSemaforo(safe(utilidadBruta, ventas) * 100, [30, 100], [15, 30]), formula: 'Util.Bruta / Ventas × 100', categoria: 'Rentabilidad' },
        { nombre: 'Margen Operativo', valor: safe(utilidadOperativa, ventas) * 100, unidad: '%', semaforo: evalSemaforo(safe(utilidadOperativa, ventas) * 100, [15, 100], [5, 15]), formula: 'EBIT / Ventas × 100', categoria: 'Rentabilidad' },
        { nombre: 'Margen Neto', valor: safe(utilidadNeta, ventas) * 100, unidad: '%', semaforo: evalSemaforo(safe(utilidadNeta, ventas) * 100, [10, 100], [3, 10]), formula: 'Util.Neta / Ventas × 100', categoria: 'Rentabilidad' },
        { nombre: 'ROA', valor: safe(utilidadNeta, activoTotal) * 100, unidad: '%', semaforo: evalSemaforo(safe(utilidadNeta, activoTotal) * 100, [5, 100], [2, 5]), formula: 'Util.Neta / Activo Total × 100', categoria: 'Rentabilidad' },
        { nombre: 'ROE', valor: safe(utilidadNeta, patrimonio) * 100, unidad: '%', semaforo: evalSemaforo(safe(utilidadNeta, patrimonio) * 100, [15, 100], [5, 15]), formula: 'Util.Neta / Patrimonio × 100', categoria: 'Rentabilidad' },
        // Gestión
        { nombre: 'Período Promedio de Cobro', valor: safe(365, safe(ventas, cxc)), unidad: 'días', semaforo: evalSemaforo(safe(365, safe(ventas, cxc)), [0, 30], [30, 60]), formula: '365 / (Ventas / CxC)', categoria: 'Gestión' },
        { nombre: 'Período Promedio de Pago', valor: safe(365, safe(costoVentas, cxp)), unidad: 'días', semaforo: evalSemaforo(safe(365, safe(costoVentas, cxp)), [30, 60], [60, 90]), formula: '365 / (Compras / CxP)', categoria: 'Gestión' },
      ]

      setRatios(calculados)
      setLoading(false)
    }
    load()
  }, [supabase, periodo])

  const categorias = [...new Set(ratios.map((r) => r.categoria))]

  const semaforoColor = {
    verde: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    amarillo: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    rojo: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  // Radar data for health overview
  const radarData = categorias.map((cat) => {
    const catRatios = ratios.filter((r) => r.categoria === cat)
    const score = catRatios.reduce((s, r) => s + (r.semaforo === 'verde' ? 100 : r.semaforo === 'amarillo' ? 60 : 20), 0) / catRatios.length
    return { categoria: cat, score }
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-800/50" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Ratios Financieros</h2>
          <p className="text-sm text-zinc-500">Análisis de liquidez, endeudamiento, rentabilidad y gestión</p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <Label className="text-xs text-zinc-500">Periodo</Label>
            <Input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="w-40 bg-zinc-900 border-zinc-800 font-mono" />
          </div>
          <ExportButton
            data={ratios as unknown as Record<string, unknown>[]}
            filename={`ratios-${periodo}`}
            title="Ratios Financieros"
            columns={[
              { header: 'Categoría', key: 'categoria' },
              { header: 'Ratio', key: 'nombre' },
              { header: 'Valor', key: 'valor' },
              { header: 'Unidad', key: 'unidad' },
              { header: 'Estado', key: 'semaforo' },
            ]}
          />
        </div>
      </div>

      {/* Radar Chart */}
      <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-100">Salud Financiera</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#1e2d44" />
            <PolarAngleAxis dataKey="categoria" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
            <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Ratios by category */}
      {categorias.map((cat) => (
        <div key={cat} className="space-y-3">
          <h3 className="text-lg font-semibold text-zinc-100">{cat}</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ratios
              .filter((r) => r.categoria === cat)
              .map((ratio) => (
                <div
                  key={ratio.nombre}
                  className={`rounded-lg border p-4 ${semaforoColor[ratio.semaforo]}`}
                >
                  <p className="text-sm font-medium">{ratio.nombre}</p>
                  <p className="mt-1 text-2xl font-bold font-mono">
                    {ratio.unidad === '%'
                      ? formatPercent(ratio.valor)
                      : ratio.unidad === 'S/'
                        ? `S/ ${formatNumber(ratio.valor, 0)}`
                        : formatNumber(ratio.valor, 2)}
                  </p>
                  <p className="mt-1 text-xs opacity-70">{ratio.formula}</p>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
