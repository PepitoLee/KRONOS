'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { ExportButton } from '@/components/import-export/ExportButton'
import { KPICard } from '@/components/charts/KPICard'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils/currency'
import { getCurrentPeriod } from '@/lib/utils/dates'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Activity,
  Users,
  DollarSign,
  BarChart3,
} from 'lucide-react'

interface AreaProductivity {
  area: string
  ventas: number
  empleados: number
  costoLaboral: number
  productividad: number
}

export default function ProductividadPage() {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState(getCurrentPeriod())
  const [ventasPorEmpleado, setVentasPorEmpleado] = useState(0)
  const [ventasPorEmpleadoAnterior, setVentasPorEmpleadoAnterior] = useState(0)
  const [costoLaboralRatio, setCostoLaboralRatio] = useState(0)
  const [costoLaboralRatioAnterior, setCostoLaboralRatioAnterior] = useState(0)
  const [totalVentas, setTotalVentas] = useState(0)
  const [totalVentasAnterior, setTotalVentasAnterior] = useState(0)
  const [headcount, setHeadcount] = useState(0)
  const [headcountAnterior, setHeadcountAnterior] = useState(0)
  const [areaData, setAreaData] = useState<AreaProductivity[]>([])

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [year, month] = periodo.split('-').map(Number)
        const startOfMonth = `${periodo}-01`
        const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0]

        // Previous month
        const prevMonth = month === 1 ? 12 : month - 1
        const prevYear = month === 1 ? year - 1 : year
        const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
        const startOfPrevMonth = `${prevPeriod}-01`
        const endOfPrevMonth = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0]

        // Fetch current month sales
        const { data: ventasData } = await supabase
          .from('documentos')
          .select('id, total')
          .eq('tipo_operacion', 'venta')
          .neq('estado', 'anulado')
          .gte('fecha_emision', startOfMonth)
          .lte('fecha_emision', endOfMonth)

        const currentVentas = (ventasData ?? []).reduce((sum, d) => sum + (d.total || 0), 0)
        setTotalVentas(currentVentas)

        // Fetch previous month sales
        const { data: ventasPrevData } = await supabase
          .from('documentos')
          .select('id, total')
          .eq('tipo_operacion', 'venta')
          .neq('estado', 'anulado')
          .gte('fecha_emision', startOfPrevMonth)
          .lte('fecha_emision', endOfPrevMonth)

        const prevVentas = (ventasPrevData ?? []).reduce((sum, d) => sum + (d.total || 0), 0)
        setTotalVentasAnterior(prevVentas)

        // Fetch employees (active)
        const { data: empleadosData } = await supabase
          .from('empleados')
          .select('id, area, estado, fecha_ingreso')

        const allEmpleados = empleadosData ?? []
        const activeEmpleados = allEmpleados.filter(
          (e) => e.estado === 'activo' || !e.estado
        )
        const currentHeadcount = activeEmpleados.length
        setHeadcount(currentHeadcount)

        // Approximate previous headcount (employees hired before previous period end)
        const prevActiveEmpleados = allEmpleados.filter((e) => {
          if (e.estado === 'inactivo' || e.estado === 'cesado') return false
          if (e.fecha_ingreso && e.fecha_ingreso > endOfPrevMonth) return false
          return true
        })
        setHeadcountAnterior(prevActiveEmpleados.length)

        // Ventas por empleado
        const ventasEmpleado = currentHeadcount > 0 ? currentVentas / currentHeadcount : 0
        setVentasPorEmpleado(ventasEmpleado)
        const ventasEmpleadoPrev = prevActiveEmpleados.length > 0
          ? prevVentas / prevActiveEmpleados.length
          : 0
        setVentasPorEmpleadoAnterior(ventasEmpleadoPrev)

        // Fetch payroll costs for current period (join through planillas for periodo)
        const { data: planillaData } = await supabase
          .from('planilla_detalles')
          .select('empleado_id, total_bruto, total_descuentos, essalud_empleador, planilla:planillas!inner(periodo)')
          .eq('planillas.periodo', periodo)

        const totalCostoLaboral = (planillaData ?? []).reduce(
          (sum: number, p: any) => sum + (p.total_bruto || 0) + (p.essalud_empleador || 0),
          0
        )

        // Costo laboral / ventas ratio
        const ratio = currentVentas > 0 ? (totalCostoLaboral / currentVentas) * 100 : 0
        setCostoLaboralRatio(ratio)

        // Previous period payroll
        const { data: planillaPrevData } = await supabase
          .from('planilla_detalles')
          .select('total_bruto, essalud_empleador, planilla:planillas!inner(periodo)')
          .eq('planillas.periodo', prevPeriod)

        const prevCostoLaboral = (planillaPrevData ?? []).reduce(
          (sum: number, p: any) => sum + (p.total_bruto || 0) + (p.essalud_empleador || 0),
          0
        )
        const prevRatio = prevVentas > 0 ? (prevCostoLaboral / prevVentas) * 100 : 0
        setCostoLaboralRatioAnterior(prevRatio)

        // Productivity by area
        const areaMap: Record<string, { ventas: number; empleados: number; costoLaboral: number }> = {}

        // Group employees by area
        activeEmpleados.forEach((emp) => {
          const area = emp.area || 'Sin área'
          if (!areaMap[area]) {
            areaMap[area] = { ventas: 0, empleados: 0, costoLaboral: 0 }
          }
          areaMap[area].empleados += 1
        })

        // Group payroll costs by area (match empleado_id to employee area)
        const empAreaMap: Record<string, string> = {}
        allEmpleados.forEach((e: any) => { empAreaMap[e.id] = e.area || 'Sin área' })
        ;(planillaData ?? []).forEach((p: any) => {
          const area = empAreaMap[p.empleado_id] || 'Sin área'
          if (!areaMap[area]) {
            areaMap[area] = { ventas: 0, empleados: 0, costoLaboral: 0 }
          }
          areaMap[area].costoLaboral += (p.total_bruto || 0) + (p.essalud_empleador || 0)
        })

        // Distribute sales proportionally by headcount for areas
        // (simplified: commercial areas get sales, others get 0)
        const totalEmps = Object.values(areaMap).reduce((s, a) => s + a.empleados, 0)
        Object.entries(areaMap).forEach(([, val]) => {
          if (totalEmps > 0) {
            val.ventas = (val.empleados / totalEmps) * currentVentas
          }
        })

        const areaArr = Object.entries(areaMap)
          .map(([area, val]) => ({
            area,
            ventas: val.ventas,
            empleados: val.empleados,
            costoLaboral: val.costoLaboral,
            productividad: val.empleados > 0 ? val.ventas / val.empleados : 0,
          }))
          .filter((a) => a.empleados > 0)
          .sort((a, b) => b.productividad - a.productividad)

        setAreaData(areaArr)
      } catch (err) {
        console.error('Error fetching productivity data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [periodo, supabase])

  const exportDataArr = areaData.map((a) => ({
    area: a.area,
    empleados: a.empleados,
    ventas: a.ventas,
    costo_laboral: a.costoLaboral,
    productividad: a.productividad,
  }))

  const exportColumns = [
    { header: 'Área', key: 'area' },
    { header: 'Empleados', key: 'empleados' },
    { header: 'Ventas (PEN)', key: 'ventas' },
    { header: 'Costo Laboral (PEN)', key: 'costo_laboral' },
    { header: 'Productividad (PEN/emp)', key: 'productividad' },
  ]

  const customTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; dataKey: string }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
        <p className="mb-1 text-xs font-medium text-zinc-400">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-mono" style={{ color: entry.color }}>
            {entry.name}:{' '}
            {entry.dataKey === 'empleados'
              ? entry.value
              : formatCurrency(entry.value)}
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
          <div className="mt-4 h-72 animate-pulse rounded bg-zinc-800/30" />
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
            <Activity className="h-7 w-7 text-emerald-400" />
            Indicadores de Productividad
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Análisis de productividad laboral y eficiencia por área
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
            data={exportDataArr}
            filename={`productividad-${periodo}`}
            columns={exportColumns}
            title="Indicadores de Productividad"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Ventas por Empleado"
          value={ventasPorEmpleado}
          previousValue={ventasPorEmpleadoAnterior}
          format="currency"
          icon={DollarSign}
        />
        <KPICard
          title="Costo Laboral / Ventas"
          value={costoLaboralRatio}
          previousValue={costoLaboralRatioAnterior}
          format="percent"
          icon={BarChart3}
        />
        <KPICard
          title="Total Ventas Mes"
          value={totalVentas}
          previousValue={totalVentasAnterior}
          format="currency"
          icon={DollarSign}
        />
        <KPICard
          title="Headcount Activo"
          value={headcount}
          previousValue={headcountAnterior}
          format="number"
          icon={Users}
        />
      </div>

      {/* Productivity by Area Chart */}
      <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-100">
          Productividad por Área
        </h3>
        {areaData.length > 0 ? (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={areaData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="area"
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={{ stroke: '#3f3f46' }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#a1a1aa', fontSize: 12 }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={{ stroke: '#3f3f46' }}
                tickFormatter={(val) => `S/ ${(val / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#a1a1aa', fontSize: 12 }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={{ stroke: '#3f3f46' }}
              />
              <Tooltip content={customTooltip as any} />
              <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
              <Bar
                yAxisId="left"
                dataKey="productividad"
                name="Productividad (PEN/emp)"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
              <Bar
                yAxisId="right"
                dataKey="empleados"
                name="Empleados"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-zinc-500">
            No hay datos para el periodo seleccionado
          </div>
        )}
      </div>

      {/* Area Detail Table */}
      {areaData.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">
            Detalle por Área
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="pb-3 text-left font-medium text-zinc-400">Área</th>
                  <th className="pb-3 text-right font-medium text-zinc-400">Empleados</th>
                  <th className="pb-3 text-right font-medium text-zinc-400">Ventas</th>
                  <th className="pb-3 text-right font-medium text-zinc-400">Costo Laboral</th>
                  <th className="pb-3 text-right font-medium text-zinc-400">Productividad</th>
                  <th className="pb-3 text-right font-medium text-zinc-400">Ratio C.L./Ventas</th>
                </tr>
              </thead>
              <tbody>
                {areaData.map((area, idx) => {
                  const areaRatio = area.ventas > 0
                    ? (area.costoLaboral / area.ventas) * 100
                    : 0
                  return (
                    <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="py-3 text-zinc-200 font-medium">{area.area}</td>
                      <td className="py-3 text-right font-mono text-blue-400">
                        {area.empleados}
                      </td>
                      <td className="py-3 text-right font-mono text-emerald-400">
                        {formatCurrency(area.ventas)}
                      </td>
                      <td className="py-3 text-right font-mono text-amber-400">
                        {formatCurrency(area.costoLaboral)}
                      </td>
                      <td className="py-3 text-right font-mono text-zinc-200">
                        {formatCurrency(area.productividad)}
                      </td>
                      <td className="py-3 text-right font-mono">
                        <span
                          className={
                            areaRatio > 50
                              ? 'text-red-400'
                              : areaRatio > 30
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                          }
                        >
                          {formatPercent(areaRatio)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700">
                  <td className="pt-3 font-semibold text-zinc-200">Total</td>
                  <td className="pt-3 text-right font-mono font-semibold text-blue-400">
                    {areaData.reduce((s, a) => s + a.empleados, 0)}
                  </td>
                  <td className="pt-3 text-right font-mono font-semibold text-emerald-400">
                    {formatCurrency(areaData.reduce((s, a) => s + a.ventas, 0))}
                  </td>
                  <td className="pt-3 text-right font-mono font-semibold text-amber-400">
                    {formatCurrency(areaData.reduce((s, a) => s + a.costoLaboral, 0))}
                  </td>
                  <td className="pt-3 text-right font-mono font-semibold text-zinc-200">
                    {formatCurrency(ventasPorEmpleado)}
                  </td>
                  <td className="pt-3 text-right font-mono font-semibold">
                    <span
                      className={
                        costoLaboralRatio > 50
                          ? 'text-red-400'
                          : costoLaboralRatio > 30
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                      }
                    >
                      {formatPercent(costoLaboralRatio)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
