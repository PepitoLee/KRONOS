'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { ExportButton } from '@/components/import-export/ExportButton'
import { formatCurrency } from '@/lib/utils/currency'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts'

interface ProyeccionMes {
  mes: string
  periodo: string
  ingresos: number
  egresos: number
  saldo_inicial: number
  saldo_final: number
}

export default function FlujoCajaProyectadoPage() {
  const [loading, setLoading] = useState(true)
  const [proyecciones, setProyecciones] = useState<ProyeccionMes[]>([])
  const [saldoBancario, setSaldoBancario] = useState(0)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Obtener saldo actual de cuentas bancarias
      const { data: cuentas } = await supabase
        .from('cuentas_bancarias')
        .select('saldo_actual')
        .eq('activa', true)

      const saldoTotal = cuentas?.reduce((s, c) => s + Number(c.saldo_actual), 0) ?? 0
      setSaldoBancario(saldoTotal)

      // Obtener CxC (ventas pendientes - ingresos futuros)
      const { data: cxc } = await supabase
        .from('documentos')
        .select('fecha_vencimiento, fecha_emision, total')
        .eq('tipo_operacion', 'venta')
        .neq('estado', 'anulado')

      // Obtener CxP (compras pendientes - egresos futuros)
      const { data: cxp } = await supabase
        .from('documentos')
        .select('fecha_vencimiento, fecha_emision, total')
        .eq('tipo_operacion', 'compra')
        .neq('estado', 'anulado')

      // Obtener gastos de planilla promedio
      const { data: empleados } = await supabase
        .from('empleados')
        .select('sueldo_basico')
        .eq('estado', 'activo')

      const planillaMensual = empleados?.reduce((s, e) => s + Number(e.sueldo_basico) * 1.4, 0) ?? 0

      // Proyectar 6 meses
      const hoy = new Date()
      const meses: ProyeccionMes[] = []
      let saldoRunning = saldoTotal

      for (let i = 0; i < 6; i++) {
        const mesDate = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1)
        const mesStr = mesDate.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })
        const mesPeriodo = `${mesDate.getFullYear()}-${String(mesDate.getMonth() + 1).padStart(2, '0')}`
        const mesEnd = new Date(mesDate.getFullYear(), mesDate.getMonth() + 1, 0)

        // Ingresos: CxC que vencen este mes
        const ingresosCxC = (cxc ?? [])
          .filter((d) => {
            const venc = d.fecha_vencimiento || d.fecha_emision
            if (!venc) return false
            const vencDate = new Date(venc)
            return vencDate >= mesDate && vencDate <= mesEnd
          })
          .reduce((s, d) => s + Number(d.total), 0)

        // Egresos: CxP + planilla + gastos fijos estimados
        const egresosCxP = (cxp ?? [])
          .filter((d) => {
            const venc = d.fecha_vencimiento || d.fecha_emision
            if (!venc) return false
            const vencDate = new Date(venc)
            return vencDate >= mesDate && vencDate <= mesEnd
          })
          .reduce((s, d) => s + Number(d.total), 0)

        const egresosTotal = egresosCxP + planillaMensual
        const saldoInicial = saldoRunning
        const saldoFinal = saldoInicial + ingresosCxC - egresosTotal
        saldoRunning = saldoFinal

        meses.push({
          mes: mesStr,
          periodo: mesPeriodo,
          ingresos: ingresosCxC,
          egresos: egresosTotal,
          saldo_inicial: saldoInicial,
          saldo_final: saldoFinal,
        })
      }

      setProyecciones(meses)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const exportData = proyecciones.map((p) => ({
    periodo: p.periodo,
    mes: p.mes,
    saldo_inicial: p.saldo_inicial,
    ingresos: p.ingresos,
    egresos: p.egresos,
    saldo_final: p.saldo_final,
  }))

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-64 bg-zinc-800/50" />
        <Skeleton className="h-8 w-80 bg-zinc-800/50" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-zinc-800/50 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 bg-zinc-800/50 rounded-xl" />
      </div>
    )
  }

  const totalIngresos = proyecciones.reduce((s, p) => s + p.ingresos, 0)
  const totalEgresos = proyecciones.reduce((s, p) => s + p.egresos, 0)
  const saldoFinal6M = proyecciones[proyecciones.length - 1]?.saldo_final ?? 0

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <TrendingUp className="h-7 w-7 text-emerald-400" />
            Flujo de Caja Proyectado
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Proyeccion a 6 meses basada en CxC, CxP y gastos fijos</p>
        </div>
        <ExportButton data={exportData} filename="flujo-caja-proyectado" title="Flujo de Caja Proyectado" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Saldo Actual</span>
          </div>
          <p className="text-lg font-bold text-blue-400 font-mono">{formatCurrency(saldoBancario)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Ingresos 6M</span>
          </div>
          <p className="text-lg font-bold text-emerald-400 font-mono">{formatCurrency(totalIngresos)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight className="h-4 w-4 text-red-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Egresos 6M</span>
          </div>
          <p className="text-lg font-bold text-red-400 font-mono">{formatCurrency(totalEgresos)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Saldo Proyectado</span>
          <p className={`text-lg font-bold font-mono mt-2 ${saldoFinal6M >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(saldoFinal6M)}
          </p>
          <p className="text-xs text-zinc-500">Al cierre 6 meses</p>
        </div>
      </div>

      {/* Area Chart - Saldo Evolution */}
      <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-100">Evolucion del Saldo</h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={proyecciones}>
            <defs>
              <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d44" />
            <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e2d44', borderRadius: '8px', color: '#f3f4f6' }}
              formatter={(value) => [formatCurrency(value as number)]}
            />
            <Legend />
            <Area type="monotone" dataKey="saldo_final" name="Saldo" stroke="#10b981" fill="url(#colorSaldo)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart - Ingresos vs Egresos */}
      <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-100">Ingresos vs Egresos Mensuales</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={proyecciones}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d44" />
            <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e2d44', borderRadius: '8px', color: '#f3f4f6' }}
              formatter={(value) => [formatCurrency(value as number)]}
            />
            <Legend />
            <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail Table */}
      <div className="rounded-xl border border-zinc-800 bg-[#111827] overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-100">Detalle Mensual</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                <th className="px-4 py-3 text-left">Periodo</th>
                <th className="px-4 py-3 text-right">Saldo Inicial</th>
                <th className="px-4 py-3 text-right">Ingresos</th>
                <th className="px-4 py-3 text-right">Egresos</th>
                <th className="px-4 py-3 text-right">Saldo Final</th>
              </tr>
            </thead>
            <tbody>
              {proyecciones.map((p) => (
                <tr key={p.periodo} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                  <td className="px-4 py-3 text-zinc-300 font-medium">{p.mes}</td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-400">{formatCurrency(p.saldo_inicial)}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-400">+{formatCurrency(p.ingresos)}</td>
                  <td className="px-4 py-3 text-right font-mono text-red-400">-{formatCurrency(p.egresos)}</td>
                  <td className={`px-4 py-3 text-right font-mono font-medium ${p.saldo_final >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(p.saldo_final)}
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
