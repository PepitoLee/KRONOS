'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { ExportButton } from '@/components/import-export/ExportButton'
import { KPICard } from '@/components/charts/KPICard'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
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
  Users,
  UserMinus,
  Clock,
  DollarSign,
} from 'lucide-react'

interface Empleado {
  id: string
  nombres: string
  apellidos: string
  area: string
  estado: string
  fecha_ingreso: string
  fecha_cese?: string | null
}

interface AreaHeadcount {
  area: string
  activos: number
  cesados: number
  total: number
}

interface EstadoDistribucion {
  estado: string
  cantidad: number
  porcentaje: number
  color: string
}

export default function RRHHIndicadoresPage() {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState(getCurrentPeriod())
  const [headcountTotal, setHeadcountTotal] = useState(0)
  const [headcountAnterior, setHeadcountAnterior] = useState(0)
  const [rotacion, setRotacion] = useState(0)
  const [rotacionAnterior, setRotacionAnterior] = useState(0)
  const [antiguedadPromedio, setAntiguedadPromedio] = useState(0)
  const [antiguedadAnterior, setAntiguedadAnterior] = useState(0)
  const [costoLaboralTotal, setCostoLaboralTotal] = useState(0)
  const [costoLaboralAnterior, setCostoLaboralAnterior] = useState(0)
  const [areaData, setAreaData] = useState<AreaHeadcount[]>([])
  const [estadoData, setEstadoData] = useState<EstadoDistribucion[]>([])

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [year, month] = periodo.split('-').map(Number)
        const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0]
        const startOfMonth = `${periodo}-01`

        // Previous month
        const prevMonth = month === 1 ? 12 : month - 1
        const prevYear = month === 1 ? year - 1 : year
        const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
        const endOfPrevMonth = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0]

        // Fetch all employees
        const { data: empleadosData } = await supabase
          .from('empleados')
          .select('id, nombres, apellidos, area, estado, fecha_ingreso, fecha_cese')

        const allEmpleados: Empleado[] = (empleadosData ?? []) as Empleado[]

        // Current period active employees
        const activosActuales = allEmpleados.filter((e) => {
          const ingresado = !e.fecha_ingreso || e.fecha_ingreso <= endOfMonth
          const noCesado = !e.fecha_cese || e.fecha_cese > endOfMonth
          const estadoActivo = e.estado === 'activo' || !e.estado
          return ingresado && (noCesado || estadoActivo)
        })
        setHeadcountTotal(activosActuales.length)

        // Previous period active employees
        const activosPrev = allEmpleados.filter((e) => {
          const ingresado = !e.fecha_ingreso || e.fecha_ingreso <= endOfPrevMonth
          const noCesado = !e.fecha_cese || e.fecha_cese > endOfPrevMonth
          return ingresado && noCesado
        })
        setHeadcountAnterior(activosPrev.length)

        // Turnover rate: employees who left during the month / average headcount
        const cesadosMes = allEmpleados.filter(
          (e) => e.fecha_cese && e.fecha_cese >= startOfMonth && e.fecha_cese <= endOfMonth
        )
        const avgHeadcount = (activosActuales.length + activosPrev.length) / 2
        const turnover = avgHeadcount > 0 ? (cesadosMes.length / avgHeadcount) * 100 : 0
        setRotacion(turnover)

        // Previous month turnover
        const startOfPrevMonth = `${prevPeriod}-01`
        const prevPrevMonth = prevMonth === 1 ? 12 : prevMonth - 1
        const prevPrevYear = prevMonth === 1 ? prevYear - 1 : prevYear
        const endOfPrevPrevMonth = new Date(prevPrevYear, prevPrevMonth, 0).toISOString().split('T')[0]
        const cesadosPrev = allEmpleados.filter(
          (e) => e.fecha_cese && e.fecha_cese >= startOfPrevMonth && e.fecha_cese <= endOfPrevMonth
        )
        const activosPrevPrev = allEmpleados.filter((e) => {
          const ingresado = !e.fecha_ingreso || e.fecha_ingreso <= endOfPrevPrevMonth
          const noCesado = !e.fecha_cese || e.fecha_cese > endOfPrevPrevMonth
          return ingresado && noCesado
        })
        const avgHeadcountPrev = (activosPrev.length + activosPrevPrev.length) / 2
        const turnoverPrev = avgHeadcountPrev > 0 ? (cesadosPrev.length / avgHeadcountPrev) * 100 : 0
        setRotacionAnterior(turnoverPrev)

        // Average tenure (in years)
        const referenceDate = new Date(year, month - 1, 1)
        const tenures = activosActuales
          .filter((e) => e.fecha_ingreso)
          .map((e) => {
            const ingreso = new Date(e.fecha_ingreso)
            return (referenceDate.getTime() - ingreso.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
          })
        const avgTenure = tenures.length > 0
          ? tenures.reduce((s, t) => s + t, 0) / tenures.length
          : 0
        setAntiguedadPromedio(avgTenure)

        // Previous period tenure
        const referenceDatePrev = new Date(prevYear, prevMonth - 1, 1)
        const tenuresPrev = activosPrev
          .filter((e) => e.fecha_ingreso)
          .map((e) => {
            const ingreso = new Date(e.fecha_ingreso)
            return (referenceDatePrev.getTime() - ingreso.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
          })
        const avgTenurePrev = tenuresPrev.length > 0
          ? tenuresPrev.reduce((s, t) => s + t, 0) / tenuresPrev.length
          : 0
        setAntiguedadAnterior(avgTenurePrev)

        // Payroll cost current month (join through planillas for periodo)
        const { data: planillaData } = await supabase
          .from('planilla_detalles')
          .select('total_bruto, essalud_empleador, planilla:planillas!inner(periodo)')
          .eq('planillas.periodo', periodo)

        const totalCosto = (planillaData ?? []).reduce(
          (sum: number, p: any) => sum + (p.total_bruto || 0) + (p.essalud_empleador || 0),
          0
        )
        setCostoLaboralTotal(totalCosto)

        // Payroll cost previous month
        const { data: planillaPrevData } = await supabase
          .from('planilla_detalles')
          .select('total_bruto, essalud_empleador, planilla:planillas!inner(periodo)')
          .eq('planillas.periodo', prevPeriod)

        const totalCostoPrev = (planillaPrevData ?? []).reduce(
          (sum: number, p: any) => sum + (p.total_bruto || 0) + (p.essalud_empleador || 0),
          0
        )
        setCostoLaboralAnterior(totalCostoPrev)

        // Headcount by area
        const areaMap: Record<string, { activos: number; cesados: number }> = {}
        allEmpleados.forEach((emp) => {
          const area = emp.area || 'Sin área'
          if (!areaMap[area]) {
            areaMap[area] = { activos: 0, cesados: 0 }
          }
          const isActive = activosActuales.some((a) => a.id === emp.id)
          if (isActive) {
            areaMap[area].activos += 1
          } else {
            areaMap[area].cesados += 1
          }
        })

        const areaArr = Object.entries(areaMap)
          .map(([area, val]) => ({
            area,
            activos: val.activos,
            cesados: val.cesados,
            total: val.activos + val.cesados,
          }))
          .sort((a, b) => b.activos - a.activos)

        setAreaData(areaArr)

        // Employee status distribution
        const estadoMap: Record<string, number> = {}
        allEmpleados.forEach((emp) => {
          const estado = emp.estado || 'activo'
          estadoMap[estado] = (estadoMap[estado] || 0) + 1
        })

        const estadoColors: Record<string, string> = {
          activo: 'text-emerald-400',
          inactivo: 'text-amber-400',
          cesado: 'text-red-400',
          vacaciones: 'text-blue-400',
          licencia: 'text-purple-400',
          prueba: 'text-cyan-400',
        }

        const totalEmp = allEmpleados.length
        const estadoArr = Object.entries(estadoMap)
          .map(([estado, cantidad]) => ({
            estado: estado.charAt(0).toUpperCase() + estado.slice(1),
            cantidad,
            porcentaje: totalEmp > 0 ? (cantidad / totalEmp) * 100 : 0,
            color: estadoColors[estado] || 'text-zinc-400',
          }))
          .sort((a, b) => b.cantidad - a.cantidad)

        setEstadoData(estadoArr)
      } catch (err) {
        console.error('Error fetching HR data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [periodo, supabase])

  const exportDataArr = areaData.map((a) => ({
    area: a.area,
    activos: a.activos,
    cesados: a.cesados,
    total: a.total,
  }))

  const exportColumns = [
    { header: 'Área', key: 'area' },
    { header: 'Activos', key: 'activos' },
    { header: 'Cesados', key: 'cesados' },
    { header: 'Total', key: 'total' },
  ]

  const customTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
        <p className="mb-1 text-xs font-medium text-zinc-400">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-mono" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
            <div className="h-5 w-48 animate-pulse rounded bg-zinc-800/50" />
            <div className="mt-4 h-72 animate-pulse rounded bg-zinc-800/30" />
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
            <div className="h-5 w-48 animate-pulse rounded bg-zinc-800/50" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-zinc-800/30" />
              ))}
            </div>
          </div>
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
            <Users className="h-7 w-7 text-emerald-400" />
            Indicadores de RRHH
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Métricas de gestión del capital humano y costos laborales
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
            filename={`indicadores-rrhh-${periodo}`}
            columns={exportColumns}
            title="Indicadores de RRHH"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Headcount Total"
          value={headcountTotal}
          previousValue={headcountAnterior}
          format="number"
          icon={Users}
        />
        <KPICard
          title="Rotación de Personal"
          value={rotacion}
          previousValue={rotacionAnterior}
          format="percent"
          icon={UserMinus}
        />
        <KPICard
          title="Antigüedad Promedio (años)"
          value={antiguedadPromedio}
          previousValue={antiguedadAnterior}
          format="number"
          icon={Clock}
        />
        <KPICard
          title="Costo Laboral Total"
          value={costoLaboralTotal}
          previousValue={costoLaboralAnterior}
          format="currency"
          icon={DollarSign}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Headcount by Area Chart */}
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">
            Distribución por Área
          </h3>
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={areaData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="area"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickLine={{ stroke: '#3f3f46' }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickLine={{ stroke: '#3f3f46' }}
                  allowDecimals={false}
                />
                <Tooltip content={customTooltip as any} />
                <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
                <Bar
                  dataKey="activos"
                  name="Activos"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  stackId="stack"
                  barSize={28}
                />
                <Bar
                  dataKey="cesados"
                  name="Cesados"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  stackId="stack"
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-zinc-500">
              No hay datos de empleados disponibles
            </div>
          )}
        </div>

        {/* Employee Status Distribution */}
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">
            Distribución por Estado
          </h3>
          {estadoData.length > 0 ? (
            <div className="space-y-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="pb-3 text-left font-medium text-zinc-400">Estado</th>
                    <th className="pb-3 text-right font-medium text-zinc-400">Cantidad</th>
                    <th className="pb-3 text-right font-medium text-zinc-400">%</th>
                    <th className="pb-3 w-1/3 text-left font-medium text-zinc-400 pl-4">
                      Distribución
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {estadoData.map((estado, idx) => (
                    <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="py-3">
                        <span className={`font-medium ${estado.color}`}>
                          {estado.estado}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-zinc-200">
                        {estado.cantidad}
                      </td>
                      <td className="py-3 text-right font-mono text-zinc-400">
                        {estado.porcentaje.toFixed(1)}%
                      </td>
                      <td className="py-3 pl-4">
                        <div className="h-3 w-full rounded-full bg-zinc-800">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              estado.estado.toLowerCase() === 'activo'
                                ? 'bg-emerald-500'
                                : estado.estado.toLowerCase() === 'cesado'
                                  ? 'bg-red-500'
                                  : estado.estado.toLowerCase() === 'vacaciones'
                                    ? 'bg-blue-500'
                                    : estado.estado.toLowerCase() === 'licencia'
                                      ? 'bg-purple-500'
                                      : estado.estado.toLowerCase() === 'inactivo'
                                        ? 'bg-amber-500'
                                        : 'bg-cyan-500'
                            }`}
                            style={{ width: `${Math.max(estado.porcentaje, 2)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-700">
                    <td className="pt-3 font-semibold text-zinc-200">Total</td>
                    <td className="pt-3 text-right font-mono font-semibold text-zinc-200">
                      {estadoData.reduce((s, e) => s + e.cantidad, 0)}
                    </td>
                    <td className="pt-3 text-right font-mono font-semibold text-zinc-400">
                      100.0%
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-zinc-500">
              No hay datos de estado disponibles
            </div>
          )}
        </div>
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
                  <th className="pb-3 text-right font-medium text-zinc-400">Activos</th>
                  <th className="pb-3 text-right font-medium text-zinc-400">Cesados</th>
                  <th className="pb-3 text-right font-medium text-zinc-400">Total Histórico</th>
                  <th className="pb-3 text-right font-medium text-zinc-400">% de Plantilla</th>
                </tr>
              </thead>
              <tbody>
                {areaData.map((area, idx) => {
                  const pctPlantilla = headcountTotal > 0
                    ? (area.activos / headcountTotal) * 100
                    : 0
                  return (
                    <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="py-3 text-zinc-200 font-medium">{area.area}</td>
                      <td className="py-3 text-right font-mono text-emerald-400">
                        {area.activos}
                      </td>
                      <td className="py-3 text-right font-mono text-red-400">
                        {area.cesados}
                      </td>
                      <td className="py-3 text-right font-mono text-zinc-300">
                        {area.total}
                      </td>
                      <td className="py-3 text-right font-mono text-blue-400">
                        {pctPlantilla.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700">
                  <td className="pt-3 font-semibold text-zinc-200">Total</td>
                  <td className="pt-3 text-right font-mono font-semibold text-emerald-400">
                    {areaData.reduce((s, a) => s + a.activos, 0)}
                  </td>
                  <td className="pt-3 text-right font-mono font-semibold text-red-400">
                    {areaData.reduce((s, a) => s + a.cesados, 0)}
                  </td>
                  <td className="pt-3 text-right font-mono font-semibold text-zinc-300">
                    {areaData.reduce((s, a) => s + a.total, 0)}
                  </td>
                  <td className="pt-3 text-right font-mono font-semibold text-blue-400">
                    100.0%
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
