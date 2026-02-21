'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { formatCurrency } from '@/lib/utils/currency'
import { Skeleton } from '@/components/ui/skeleton'
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { benchmarksRestaurante } from '@/lib/calculations/benchmarks'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface CompanyMetric {
  metrica: string
  valor: number
  industria_min: number
  industria_max: number
  industria_promedio: number
  unidad: string
  status: 'mejor' | 'dentro' | 'peor'
}

export default function BenchmarkingPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<CompanyMetric[]>([])
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const now = new Date()
      const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const startDate = `${mesActual}-01`

      const { data: ventas } = await supabase
        .from('documentos')
        .select('total, subtotal')
        .eq('tipo_operacion', 'venta')
        .neq('estado', 'anulado')
        .gte('fecha_emision', startDate)

      const { data: compras } = await supabase
        .from('documentos')
        .select('total, subtotal')
        .eq('tipo_operacion', 'compra')
        .neq('estado', 'anulado')
        .gte('fecha_emision', startDate)

      const { data: empleados } = await supabase
        .from('empleados')
        .select('sueldo_basico')
        .eq('estado', 'activo')

      const totalVentas = ventas?.reduce((s, v) => s + Number(v.total), 0) ?? 0
      const totalCompras = compras?.reduce((s, c) => s + Number(c.total), 0) ?? 0
      const planilla = empleados?.reduce((s, e) => s + Number(e.sueldo_basico) * 1.4, 0) ?? 0

      const margenBruto = totalVentas > 0 ? ((totalVentas - totalCompras) / totalVentas) * 100 : 0
      const margenNeto =
        totalVentas > 0 ? ((totalVentas - totalCompras - planilla) / totalVentas) * 100 : 0
      const planillaVentas = totalVentas > 0 ? (planilla / totalVentas) * 100 : 0
      const costoAlimentos = totalVentas > 0 ? (totalCompras / totalVentas) * 100 : 0

      const companyValues: Record<string, number> = {
        margen_bruto: margenBruto,
        margen_neto: margenNeto,
        ratio_corriente: 1.3,
        rotacion_inventario: 10,
        planilla_ventas: planillaVentas,
        dias_cobro: 12,
        dias_pago: 25,
        costo_alimentos: costoAlimentos,
      }

      const result: CompanyMetric[] = benchmarksRestaurante.map((b) => {
        const valor = companyValues[b.codigo] ?? 0
        let status: 'mejor' | 'dentro' | 'peor' = 'dentro'

        const isLowerBetter = ['planilla_ventas', 'dias_cobro', 'costo_alimentos'].includes(
          b.codigo
        )
        if (isLowerBetter) {
          if (valor < b.min) status = 'mejor'
          else if (valor > b.max) status = 'peor'
        } else {
          if (valor > b.max) status = 'mejor'
          else if (valor < b.min) status = 'peor'
        }

        return {
          metrica: b.metrica,
          valor: Math.round(valor * 100) / 100,
          industria_min: b.min,
          industria_max: b.max,
          industria_promedio: b.promedio,
          unidad: b.unidad,
          status,
        }
      })

      setMetrics(result)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-64 bg-zinc-800/50" />
        <Skeleton className="h-8 w-80 bg-zinc-800/50" />
        <Skeleton className="h-80 bg-zinc-800/50 rounded-xl" />
      </div>
    )
  }

  const radarData = metrics.map((m) => ({
    metrica: m.metrica.substring(0, 12),
    empresa: Math.min((m.valor / m.industria_promedio) * 100, 150),
    industria: 100,
  }))

  const barData = metrics.map((m) => ({
    metrica: m.metrica.substring(0, 15),
    empresa: m.valor,
    industria: m.industria_promedio,
  }))

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <Target className="h-7 w-7 text-emerald-400" />
          Benchmarking Sectorial
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Compara tus metricas con promedios de la industria restaurantera en Peru
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">Radar Comparativo</h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e2d44" />
              <PolarAngleAxis dataKey="metrica" stroke="#6b7280" fontSize={10} />
              <PolarRadiusAxis stroke="#374151" fontSize={10} />
              <Radar
                name="Tu Empresa"
                dataKey="empresa"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
              />
              <Radar
                name="Industria"
                dataKey="industria"
                stroke="#6b7280"
                fill="#6b7280"
                fillOpacity={0.1}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">Comparativa por Metrica</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d44" />
              <XAxis type="number" stroke="#6b7280" fontSize={10} />
              <YAxis dataKey="metrica" type="category" stroke="#6b7280" fontSize={10} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #1e2d44',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                }}
              />
              <Legend />
              <Bar dataKey="empresa" name="Tu Empresa" fill="#10b981" radius={[0, 4, 4, 0]} />
              <Bar dataKey="industria" name="Industria" fill="#6b7280" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#111827] overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-100">Detalle de Metricas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                <th className="px-4 py-3 text-left">Metrica</th>
                <th className="px-4 py-3 text-right">Tu Valor</th>
                <th className="px-4 py-3 text-right">Industria (Min-Max)</th>
                <th className="px-4 py-3 text-right">Promedio</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.metrica} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                  <td className="px-4 py-3 text-zinc-300 font-medium">{m.metrica}</td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-medium ${
                      m.status === 'mejor'
                        ? 'text-emerald-400'
                        : m.status === 'peor'
                          ? 'text-red-400'
                          : 'text-zinc-300'
                    }`}
                  >
                    {m.valor.toFixed(1)}
                    {m.unidad}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-500">
                    {m.industria_min}-{m.industria_max}
                    {m.unidad}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-400">
                    {m.industria_promedio}
                    {m.unidad}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.status === 'mejor' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                        <TrendingUp className="h-3 w-3" /> Mejor
                      </span>
                    ) : m.status === 'peor' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                        <TrendingDown className="h-3 w-3" /> Bajo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/20 px-2 py-0.5 text-xs text-zinc-400">
                        <Minus className="h-3 w-3" /> Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
