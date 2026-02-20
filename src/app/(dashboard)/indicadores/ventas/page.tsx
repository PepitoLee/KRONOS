'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { ExportButton } from '@/components/import-export/ExportButton'
import { KPICard } from '@/components/charts/KPICard'
import { formatCurrency } from '@/lib/utils/currency'
import { getCurrentPeriod } from '@/lib/utils/dates'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AreaChart,
  BarChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Receipt,
} from 'lucide-react'

interface DocumentoVenta {
  id: string
  fecha_emision: string
  total: number
  nombre_tercero: string
  estado: string
}

interface TransaccionVenta {
  id: string
  documento_id: string | null
  fecha: string
  monto: number
  items_cantidad: number | null
  medio_pago: string | null
}

interface MonthlyData {
  mes: string
  ventas: number
  transacciones: number
}

interface MedioPagoData {
  medio_pago: string
  total: number
  cantidad: number
}

export default function VentasIndicadoresPage() {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState(getCurrentPeriod())
  const [ventasMes, setVentasMes] = useState(0)
  const [ventasMesAnterior, setVentasMesAnterior] = useState(0)
  const [ventasAcumulado, setVentasAcumulado] = useState(0)
  const [ventasAcumuladoAnterior, setVentasAcumuladoAnterior] = useState(0)
  const [ticketPromedio, setTicketPromedio] = useState(0)
  const [ticketPromedioAnterior, setTicketPromedioAnterior] = useState(0)
  const [cantidadTransacciones, setCantidadTransacciones] = useState(0)
  const [cantidadTransaccionesAnterior, setCantidadTransaccionesAnterior] = useState(0)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [medioPagoData, setMedioPagoData] = useState<MedioPagoData[]>([])

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [year, month] = periodo.split('-').map(Number)
        const startOfMonth = `${periodo}-01`
        const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0]
        const startOfYear = `${year}-01-01`

        // Previous month
        const prevMonth = month === 1 ? 12 : month - 1
        const prevYear = month === 1 ? year - 1 : year
        const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
        const startOfPrevMonth = `${prevPeriod}-01`
        const endOfPrevMonth = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0]
        const startOfPrevYear = `${prevYear}-01-01`

        // Current month sales
        const { data: ventasMesData } = await supabase
          .from('documentos')
          .select('id, fecha_emision, total, nombre_tercero, estado')
          .eq('tipo_operacion', 'venta')
          .neq('estado', 'anulado')
          .gte('fecha_emision', startOfMonth)
          .lte('fecha_emision', endOfMonth)

        const ventasMesArr = ventasMesData ?? []
        const totalVentasMes = ventasMesArr.reduce((sum, d) => sum + (d.total || 0), 0)
        const cantTxMes = ventasMesArr.length
        const ticketAvg = cantTxMes > 0 ? totalVentasMes / cantTxMes : 0

        setVentasMes(totalVentasMes)
        setCantidadTransacciones(cantTxMes)
        setTicketPromedio(ticketAvg)

        // Previous month sales (for comparison)
        const { data: ventasPrevData } = await supabase
          .from('documentos')
          .select('id, total')
          .eq('tipo_operacion', 'venta')
          .neq('estado', 'anulado')
          .gte('fecha_emision', startOfPrevMonth)
          .lte('fecha_emision', endOfPrevMonth)

        const ventasPrevArr = ventasPrevData ?? []
        const totalVentasPrev = ventasPrevArr.reduce((sum, d) => sum + (d.total || 0), 0)
        const cantTxPrev = ventasPrevArr.length
        const ticketAvgPrev = cantTxPrev > 0 ? totalVentasPrev / cantTxPrev : 0

        setVentasMesAnterior(totalVentasPrev)
        setCantidadTransaccionesAnterior(cantTxPrev)
        setTicketPromedioAnterior(ticketAvgPrev)

        // Year-to-date sales
        const { data: ventasYTDData } = await supabase
          .from('documentos')
          .select('id, total')
          .eq('tipo_operacion', 'venta')
          .neq('estado', 'anulado')
          .gte('fecha_emision', startOfYear)
          .lte('fecha_emision', endOfMonth)

        const totalYTD = (ventasYTDData ?? []).reduce((sum, d) => sum + (d.total || 0), 0)
        setVentasAcumulado(totalYTD)

        // Previous year-to-date for comparison
        const endCompPrev = `${prevYear}-${String(month).padStart(2, '0')}-${new Date(prevYear, month, 0).getDate()}`
        const { data: ventasPrevYTDData } = await supabase
          .from('documentos')
          .select('id, total')
          .eq('tipo_operacion', 'venta')
          .neq('estado', 'anulado')
          .gte('fecha_emision', startOfPrevYear)
          .lte('fecha_emision', endCompPrev)

        const totalPrevYTD = (ventasPrevYTDData ?? []).reduce((sum, d) => sum + (d.total || 0), 0)
        setVentasAcumuladoAnterior(totalPrevYTD)

        // Monthly evolution (last 12 months)
        const monthlyMap: Record<string, { ventas: number; transacciones: number }> = {}
        for (let i = 11; i >= 0; i--) {
          const d = new Date(year, month - 1 - i, 1)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          monthlyMap[key] = { ventas: 0, transacciones: 0 }
        }

        const twelveMonthsAgo = Object.keys(monthlyMap).sort()[0] + '-01'
        const { data: monthlyDocs } = await supabase
          .from('documentos')
          .select('fecha_emision, total')
          .eq('tipo_operacion', 'venta')
          .neq('estado', 'anulado')
          .gte('fecha_emision', twelveMonthsAgo)
          .lte('fecha_emision', endOfMonth)

        ;(monthlyDocs ?? []).forEach((doc) => {
          const key = doc.fecha_emision?.substring(0, 7)
          if (key && monthlyMap[key]) {
            monthlyMap[key].ventas += doc.total || 0
            monthlyMap[key].transacciones += 1
          }
        })

        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        const monthlyArr = Object.entries(monthlyMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, val]) => ({
            mes: monthNames[parseInt(key.split('-')[1]) - 1] + ' ' + key.split('-')[0].slice(2),
            ventas: val.ventas,
            transacciones: val.transacciones,
          }))

        setMonthlyData(monthlyArr)

        // Payment methods distribution
        const { data: txData } = await supabase
          .from('transacciones_venta')
          .select('monto, medio_pago, fecha')
          .gte('fecha', startOfMonth)
          .lte('fecha', endOfMonth + 'T23:59:59')

        if (txData && txData.length > 0) {
          const pagoMap: Record<string, { total: number; cantidad: number }> = {}
          txData.forEach((tx) => {
            const mp = tx.medio_pago || 'otro'
            if (!pagoMap[mp]) pagoMap[mp] = { total: 0, cantidad: 0 }
            pagoMap[mp].total += tx.monto || 0
            pagoMap[mp].cantidad += 1
          })

          const pagoArr = Object.entries(pagoMap)
            .map(([medio_pago, val]) => ({ medio_pago, ...val }))
            .sort((a, b) => b.total - a.total)

          setMedioPagoData(pagoArr)
        }
      } catch (err) {
        console.error('Error fetching sales data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [periodo, supabase])

  const exportData = monthlyData.map((m) => ({
    periodo: m.mes,
    ventas: m.ventas,
    transacciones: m.transacciones,
  }))

  const exportColumns = [
    { header: 'Periodo', key: 'periodo' },
    { header: 'Ventas (PEN)', key: 'ventas' },
    { header: 'Transacciones', key: 'transacciones' },
  ]

  const customTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
        <p className="mb-1 text-xs font-medium text-zinc-400">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-mono" style={{ color: entry.color }}>
            {entry.name}: {entry.name === 'Ventas' ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-64 animate-pulse rounded bg-zinc-800/50" />
        <div className="space-y-2">
          <div className="h-8 w-80 animate-pulse rounded bg-zinc-800/50" />
          <div className="h-4 w-48 animate-pulse rounded bg-zinc-800/50" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-[#111827] p-5">
              <div className="h-4 w-24 animate-pulse rounded bg-zinc-800/50" />
              <div className="mt-3 h-8 w-32 animate-pulse rounded bg-zinc-800/50" />
              <div className="mt-2 h-3 w-20 animate-pulse rounded bg-zinc-800/50" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
          <div className="h-5 w-48 animate-pulse rounded bg-zinc-800/50" />
          <div className="mt-4 h-64 animate-pulse rounded bg-zinc-800/30" />
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
          <div className="h-5 w-40 animate-pulse rounded bg-zinc-800/50" />
          <div className="mt-4 h-64 animate-pulse rounded bg-zinc-800/30" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <TrendingUp className="h-7 w-7 text-emerald-400" />
            Indicadores de Ventas
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Seguimiento de KPIs comerciales y evolución de ventas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="periodo" className="text-sm text-zinc-400">
              Periodo:
            </Label>
            <Input
              id="periodo"
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-44 bg-zinc-900 border-zinc-700 text-zinc-300"
            />
          </div>
          <ExportButton
            data={exportData}
            filename={`indicadores-ventas-${periodo}`}
            columns={exportColumns}
            title="Indicadores de Ventas"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Ventas del Mes"
          value={ventasMes}
          previousValue={ventasMesAnterior}
          format="currency"
          icon={DollarSign}
        />
        <KPICard
          title="Ventas Acumulado Año"
          value={ventasAcumulado}
          previousValue={ventasAcumuladoAnterior}
          format="currency"
          icon={TrendingUp}
        />
        <KPICard
          title="Ticket Promedio"
          value={ticketPromedio}
          previousValue={ticketPromedioAnterior}
          format="currency"
          icon={Receipt}
        />
        <KPICard
          title="Transacciones"
          value={cantidadTransacciones}
          previousValue={cantidadTransaccionesAnterior}
          format="number"
          icon={ShoppingCart}
        />
      </div>

      {/* Monthly Evolution Chart */}
      <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-100">
          Evolución Mensual de Ventas
        </h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="mes"
                tick={{ fill: '#a1a1aa', fontSize: 12 }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={{ stroke: '#3f3f46' }}
              />
              <YAxis
                tick={{ fill: '#a1a1aa', fontSize: 12 }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={{ stroke: '#3f3f46' }}
                tickFormatter={(val) => `S/ ${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={customTooltip as any} />
              <Legend
                wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="ventas"
                name="Ventas"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorVentas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-zinc-500">
            No hay datos para el periodo seleccionado
          </div>
        )}
      </div>

      {/* Payment Methods Chart */}
      <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-100">
          Ventas por Medio de Pago
        </h3>
        {medioPagoData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={medioPagoData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#a1a1aa', fontSize: 12 }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={{ stroke: '#3f3f46' }}
                tickFormatter={(val) => `S/ ${(val / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="medio_pago"
                width={120}
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={{ stroke: '#3f3f46' }}
              />
              <Tooltip content={customTooltip as any} />
              <Bar
                dataKey="total"
                name="Ventas"
                fill="#10b981"
                radius={[0, 4, 4, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-zinc-500">
            No hay datos de transacciones para el periodo seleccionado
          </div>
        )}
      </div>

      {/* Payment Methods Table */}
      {medioPagoData.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">
            Detalle por Medio de Pago
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="pb-3 text-left font-medium text-zinc-400">Medio de Pago</th>
                  <th className="pb-3 text-right font-medium text-zinc-400">Transacciones</th>
                  <th className="pb-3 text-right font-medium text-zinc-400">Total</th>
                  <th className="pb-3 text-right font-medium text-zinc-400">% del Total</th>
                </tr>
              </thead>
              <tbody>
                {medioPagoData.map((mp, idx) => {
                  const totalMP = medioPagoData.reduce((s, p) => s + p.total, 0)
                  const porcentaje = totalMP > 0 ? (mp.total / totalMP) * 100 : 0
                  return (
                    <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="py-3 text-zinc-200 capitalize">{mp.medio_pago}</td>
                      <td className="py-3 text-right font-mono text-zinc-300">{mp.cantidad}</td>
                      <td className="py-3 text-right font-mono text-emerald-400">
                        {formatCurrency(mp.total)}
                      </td>
                      <td className="py-3 text-right font-mono text-zinc-400">
                        {porcentaje.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
