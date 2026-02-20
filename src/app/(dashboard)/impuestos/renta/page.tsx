'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { ExportButton } from '@/components/import-export/ExportButton'
import { formatCurrency, formatPercent } from '@/lib/utils/currency'
import { formatDate, getCurrentPeriod } from '@/lib/utils/dates'
import { calcularRentaAnual, getCalendarioTributario } from '@/lib/calculations/taxes'
import { IGV_TASA, UIT_2025, RENTA_GENERAL_TASA } from '@/types/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Landmark,
  Calculator,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

type Regimen = 'GENERAL' | 'MYPE'

export default function RentaPage() {
  const [regimen, setRegimen] = useState<Regimen>('GENERAL')
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [ingresosMensuales, setIngresosMensuales] = useState<number[]>(Array(12).fill(0))
  const [gastosMensuales, setGastosMensuales] = useState<number[]>(Array(12).fill(0))
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const ingresos: number[] = Array(12).fill(0)
        const gastos: number[] = Array(12).fill(0)

        for (let mes = 1; mes <= 12; mes++) {
          const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`
          const fin = new Date(anio, mes, 0).toISOString().split('T')[0]

          const { data: docs } = await supabase
            .from('documentos')
            .select('tipo_operacion, subtotal, total')
            .gte('fecha_emision', inicio)
            .lte('fecha_emision', fin)
            .neq('estado', 'anulado')

          const documentos = docs ?? []

          ingresos[mes - 1] = documentos
            .filter((d) => d.tipo_operacion === 'venta')
            .reduce((sum, d) => sum + (d.subtotal ?? d.total / (1 + IGV_TASA)), 0)

          gastos[mes - 1] = documentos
            .filter((d) => d.tipo_operacion === 'compra')
            .reduce((sum, d) => sum + (d.subtotal ?? d.total / (1 + IGV_TASA)), 0)
        }

        setIngresosMensuales(ingresos)
        setGastosMensuales(gastos)
      } catch (error) {
        console.error('Error fetching income data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, anio])

  const mesActual = new Date().getMonth() + 1
  const ingresosAcumulados = ingresosMensuales.reduce((sum, v) => sum + v, 0)
  const gastosAcumulados = gastosMensuales.reduce((sum, v) => sum + v, 0)

  const promedioMensualIngreso = mesActual > 0 ? ingresosAcumulados / mesActual : 0
  const ingresoAnualProyectado = ingresosAcumulados + promedioMensualIngreso * (12 - mesActual)

  const promedioMensualGasto = mesActual > 0 ? gastosAcumulados / mesActual : 0
  const gastoAnualProyectado = gastosAcumulados + promedioMensualGasto * (12 - mesActual)

  const utilidadProyectada = ingresoAnualProyectado - gastoAnualProyectado

  const rentaCalc = useMemo(() => {
    return calcularRentaAnual(
      Math.max(utilidadProyectada, 0),
      regimen,
      promedioMensualIngreso
    )
  }, [utilidadProyectada, regimen, promedioMensualIngreso])

  const calendario = useMemo(() => getCalendarioTributario(anio), [anio])

  const chartDataMensual = ingresosMensuales.map((ingreso, i) => {
    const mesLabel = new Date(anio, i).toLocaleDateString('es-PE', { month: 'short' })
    return {
      mes: mesLabel,
      ingresos: Math.round(ingreso * 100) / 100,
      gastos: Math.round(gastosMensuales[i] * 100) / 100,
      utilidad: Math.round((ingreso - gastosMensuales[i]) * 100) / 100,
    }
  })

  const pieData = [
    { name: 'Impuesto a la Renta', value: rentaCalc.impuestoRenta, color: '#f59e0b' },
    { name: 'Utilidad Neta (despues de IR)', value: Math.max(utilidadProyectada - rentaCalc.impuestoRenta, 0), color: '#10b981' },
  ]

  const exportCalendario = calendario.map((c, i) => ({
    periodo: c.periodo,
    mes: c.mesNombre,
    vencimiento_aprox: formatDate(c.fechaVencimientoAprox),
    obligaciones: c.obligaciones.join(', '),
    ingreso_neto: ingresosMensuales[i],
    pago_a_cuenta: Math.round(ingresosMensuales[i] * 0.015 * 100) / 100,
    estado: i < mesActual ? 'Vencido' : 'Pendiente',
  }))

  const exportColumns = [
    { header: 'Periodo', key: 'periodo' },
    { header: 'Mes', key: 'mes' },
    { header: 'Vencimiento Aprox.', key: 'vencimiento_aprox' },
    { header: 'Obligaciones', key: 'obligaciones' },
    { header: 'Ingreso Neto', key: 'ingreso_neto' },
    { header: 'Pago a Cuenta (1.5%)', key: 'pago_a_cuenta' },
    { header: 'Estado', key: 'estado' },
  ]

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <Landmark className="h-7 w-7 text-emerald-400" />
            Impuesto a la Renta
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Proyeccion anual, pagos a cuenta mensuales y calendario tributario
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={exportCalendario}
            filename={`renta-${anio}`}
            columns={exportColumns}
            title={`Impuesto a la Renta - ${anio}`}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-zinc-400">Ejercicio:</Label>
          <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
            <SelectTrigger className="w-28 bg-zinc-900 border-zinc-700 text-zinc-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[anio - 1, anio, anio + 1].map((a) => (
                <SelectItem key={a} value={String(a)}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm text-zinc-400">Regimen:</Label>
          <Select value={regimen} onValueChange={(v) => setRegimen(v as Regimen)}>
            <SelectTrigger className="w-56 bg-zinc-900 border-zinc-700 text-zinc-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GENERAL">
                Regimen General (29.5%)
              </SelectItem>
              <SelectItem value="MYPE">
                Regimen MYPE (10% / 29.5%)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Info className="h-4 w-4 text-zinc-500" />
          <span className="text-xs text-zinc-500">UIT {anio}: {formatCurrency(UIT_2025)}</span>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-zinc-800/50" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-400">Ingreso Anual Proyectado</p>
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-400 font-mono">
                {formatCurrency(ingresoAnualProyectado)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Acumulado: {formatCurrency(ingresosAcumulados)}
              </p>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-400">Utilidad Neta Proyectada</p>
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Calculator className="h-4 w-4 text-blue-400" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-blue-400 font-mono">
                {formatCurrency(utilidadProyectada)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Margen: {formatPercent(ingresoAnualProyectado > 0 ? (utilidadProyectada / ingresoAnualProyectado) * 100 : 0)}
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-400">IR Estimado Anual</p>
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-amber-400 font-mono">
                {formatCurrency(rentaCalc.impuestoRenta)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Tasa efectiva: {formatPercent(rentaCalc.tasa * 100)} ({regimen})
              </p>
            </div>

            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-400">Pago a Cuenta Mensual</p>
                <div className="rounded-lg bg-red-500/10 p-2">
                  <Calendar className="h-4 w-4 text-red-400" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-red-400 font-mono">
                {formatCurrency(rentaCalc.pagoACuentaMensual)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                1.5% de ingresos netos mensuales
              </p>
            </div>
          </div>

          {/* Regime Info Banner */}
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-200">
                  {regimen === 'GENERAL' ? 'Regimen General' : 'Regimen MYPE Tributario'}
                </p>
                {regimen === 'GENERAL' ? (
                  <p className="text-sm text-zinc-400">
                    Tasa unica del 29.5% sobre la utilidad neta. Pagos a cuenta mensuales del 1.5%
                    sobre ingresos netos o coeficiente del ejercicio anterior (el que sea mayor).
                  </p>
                ) : (
                  <div className="space-y-1 text-sm text-zinc-400">
                    <p>Hasta 15 UIT ({formatCurrency(15 * UIT_2025)}): tasa del 10%</p>
                    <p>Exceso de 15 UIT: tasa del 29.5%</p>
                    <p>Pagos a cuenta mensuales: 1.0% (hasta 300 UIT de ingresos) o 1.5% (exceso).</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Bar Chart - Monthly Income vs Expenses */}
            <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">
                Ingresos vs Gastos Mensuales - {anio}
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataMensual} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="mes"
                      tick={{ fill: '#a1a1aa', fontSize: 11 }}
                      axisLine={{ stroke: '#3f3f46' }}
                    />
                    <YAxis
                      tick={{ fill: '#a1a1aa', fontSize: 11 }}
                      axisLine={{ stroke: '#3f3f46' }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        color: '#e4e4e7',
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={((value: any, name: any) => [
                        formatCurrency(Number(value) || 0),
                        name === 'ingresos' ? 'Ingresos' : name === 'gastos' ? 'Gastos' : 'Utilidad',
                      ]) as any}
                    />
                    <Bar dataKey="ingresos" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="gastos" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center justify-center gap-6 text-xs text-zinc-500">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                  <span>Ingresos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-red-500" />
                  <span>Gastos</span>
                </div>
              </div>
            </div>

            {/* Pie Chart - Tax Distribution */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">
                Distribucion de Utilidad
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        color: '#e4e4e7',
                      }}
                      formatter={((value: any) => formatCurrency(Number(value) || 0)) as any}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-zinc-400">{item.name}</span>
                    </div>
                    <span className="font-mono text-zinc-300">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tax Calendar */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-zinc-400" />
              <h3 className="text-lg font-semibold text-zinc-100">
                Calendario Tributario {anio}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 font-medium text-zinc-400">Periodo</th>
                    <th className="text-left py-3 px-4 font-medium text-zinc-400">Mes</th>
                    <th className="text-left py-3 px-4 font-medium text-zinc-400">Vencimiento Aprox.</th>
                    <th className="text-left py-3 px-4 font-medium text-zinc-400">Obligaciones</th>
                    <th className="text-right py-3 px-4 font-medium text-zinc-400">Ingreso Neto</th>
                    <th className="text-right py-3 px-4 font-medium text-zinc-400">Pago a Cuenta (1.5%)</th>
                    <th className="text-center py-3 px-4 font-medium text-zinc-400">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {calendario.map((item, i) => {
                    const isPast = i < mesActual - 1
                    const isCurrent = i === mesActual - 1
                    const pagoACuenta = Math.round(ingresosMensuales[i] * 0.015 * 100) / 100

                    return (
                      <tr
                        key={item.periodo}
                        className={`border-b border-zinc-800/50 ${
                          isCurrent ? 'bg-emerald-500/5' : 'hover:bg-zinc-800/30'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-zinc-300">{item.periodo}</td>
                        <td className="py-3 px-4 text-zinc-300 capitalize">{item.mesNombre}</td>
                        <td className="py-3 px-4 text-zinc-400">
                          {formatDate(item.fechaVencimientoAprox)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {item.obligaciones.map((ob) => (
                              <Badge
                                key={ob}
                                className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20 border text-xs"
                              >
                                {ob}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-zinc-300">
                          {formatCurrency(ingresosMensuales[i])}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-400">
                          {formatCurrency(pagoACuenta)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isPast ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 border text-xs">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Vencido
                            </Badge>
                          ) : isCurrent ? (
                            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 border text-xs">
                              <Clock className="mr-1 h-3 w-3" />
                              En curso
                            </Badge>
                          ) : (
                            <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/20 border text-xs">
                              Pendiente
                            </Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-700 bg-zinc-900/50">
                    <td colSpan={4} className="py-3 px-4 text-sm font-semibold text-zinc-300">
                      Total Anual
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                      {formatCurrency(ingresosAcumulados)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-amber-400">
                      {formatCurrency(
                        ingresosMensuales.reduce((sum, v) => sum + Math.round(v * 0.015 * 100) / 100, 0)
                      )}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
