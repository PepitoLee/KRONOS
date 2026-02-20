'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { ExportButton } from '@/components/import-export/ExportButton'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface Reclamo {
  id: string
  fecha: string
  estado: 'pendiente' | 'en_proceso' | 'resuelto' | 'cerrado'
  tipo: 'producto' | 'servicio' | 'entrega' | 'facturacion'
  prioridad: 'alta' | 'media' | 'baja'
  fecha_resolucion?: string | null
}

const TIPO_COLORS: Record<string, string> = {
  producto: '#3b82f6',
  servicio: '#10b981',
  entrega: '#f59e0b',
  facturacion: '#ef4444',
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: '#f59e0b',
  en_proceso: '#3b82f6',
  resuelto: '#10b981',
  cerrado: '#6b7280',
}

const tipoLabels: Record<string, string> = {
  producto: 'Producto',
  servicio: 'Servicio',
  entrega: 'Entrega',
  facturacion: 'Facturación',
}

const estadoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
}

export default function ReclamosIndicadoresPage() {
  const [reclamos, setReclamos] = useState<Reclamo[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchReclamos() {
      try {
        const { data, error } = await supabase
          .from('reclamos')
          .select('id, fecha, estado, tipo, prioridad, fecha_resolucion')
          .order('fecha', { ascending: false })

        if (error) {
          console.error('Error fetching reclamos:', error)
          return
        }

        setReclamos(data ?? [])
      } finally {
        setLoading(false)
      }
    }

    fetchReclamos()
  }, [supabase])

  const totalReclamos = reclamos.length
  const resueltos = reclamos.filter((r) => r.estado === 'resuelto' || r.estado === 'cerrado').length
  const pendientes = reclamos.filter((r) => r.estado === 'pendiente').length
  const enProceso = reclamos.filter((r) => r.estado === 'en_proceso').length

  // Calculate average resolution time
  const reclamosConResolucion = reclamos.filter((r) => r.fecha_resolucion && r.fecha)
  const tiempoPromedioMs = reclamosConResolucion.length > 0
    ? reclamosConResolucion.reduce((acc, r) => {
        const diff = new Date(r.fecha_resolucion!).getTime() - new Date(r.fecha).getTime()
        return acc + diff
      }, 0) / reclamosConResolucion.length
    : 0
  const tiempoPromedioDias = Math.round(tiempoPromedioMs / (1000 * 60 * 60 * 24))

  // Data for PieChart by tipo
  const tipoCount = reclamos.reduce<Record<string, number>>((acc, r) => {
    acc[r.tipo] = (acc[r.tipo] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(tipoCount).map(([key, value]) => ({
    name: tipoLabels[key] || key,
    value,
    fill: TIPO_COLORS[key] || '#6b7280',
  }))

  // Data for BarChart by estado
  const estadoCount = reclamos.reduce<Record<string, number>>((acc, r) => {
    acc[r.estado] = (acc[r.estado] || 0) + 1
    return acc
  }, {})
  const barData = Object.entries(estadoCount).map(([key, value]) => ({
    name: estadoLabels[key] || key,
    cantidad: value,
    fill: ESTADO_COLORS[key] || '#6b7280',
  }))

  const kpis = [
    {
      label: 'Total Reclamos',
      value: totalReclamos,
      icon: MessageSquare,
      color: 'text-amber-400 bg-amber-500/10',
    },
    {
      label: 'Resueltos / Cerrados',
      value: resueltos,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      label: 'Pendientes',
      value: pendientes,
      icon: AlertTriangle,
      color: 'text-red-400 bg-red-500/10',
    },
    {
      label: 'Tiempo Prom. Resolución',
      value: reclamosConResolucion.length > 0 ? `${tiempoPromedioDias} días` : 'N/A',
      icon: Clock,
      color: 'text-blue-400 bg-blue-500/10',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-64 bg-zinc-800/50" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-80 bg-zinc-800/50" />
          <Skeleton className="h-4 w-48 bg-zinc-800/50" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 bg-zinc-800/50 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-80 bg-zinc-800/50 rounded-xl" />
          <Skeleton className="h-80 bg-zinc-800/50 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reclamos">
            <Button variant="outline" size="icon" className="border-zinc-700 text-zinc-400 hover:bg-zinc-800">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
              <MessageSquare className="h-7 w-7 text-amber-400" />
              Indicadores de Reclamos
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              KPIs y métricas de gestión de reclamos
            </p>
          </div>
        </div>
        <ExportButton
          data={barData}
          filename="indicadores-reclamos"
          columns={[
            { header: 'Estado', key: 'name' },
            { header: 'Cantidad', key: 'cantidad' },
          ]}
          title="Indicadores de Reclamos"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-zinc-800 bg-[#111827] p-6"
          >
            <div className={`inline-flex rounded-lg p-3 ${kpi.color}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm text-zinc-500">{kpi.label}</p>
            <p className="mt-1 text-3xl font-bold text-zinc-100 font-mono">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Pie Chart - By Type */}
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Reclamos por Tipo</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                />
                <Legend
                  wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-zinc-500">
              Sin datos disponibles
            </div>
          )}
        </div>

        {/* Bar Chart - By Status */}
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Reclamos por Estado</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#374151' }}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#374151' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-zinc-500">
              Sin datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Summary Table */}
      <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">Resumen por Prioridad</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-zinc-400 font-medium">Prioridad</th>
                <th className="text-right py-3 px-4 text-zinc-400 font-medium">Total</th>
                <th className="text-right py-3 px-4 text-zinc-400 font-medium">Pendientes</th>
                <th className="text-right py-3 px-4 text-zinc-400 font-medium">En Proceso</th>
                <th className="text-right py-3 px-4 text-zinc-400 font-medium">Resueltos</th>
                <th className="text-right py-3 px-4 text-zinc-400 font-medium">% Resolución</th>
              </tr>
            </thead>
            <tbody>
              {(['alta', 'media', 'baja'] as const).map((prioridad) => {
                const filtered = reclamos.filter((r) => r.prioridad === prioridad)
                const total = filtered.length
                const pend = filtered.filter((r) => r.estado === 'pendiente').length
                const proc = filtered.filter((r) => r.estado === 'en_proceso').length
                const res = filtered.filter((r) => r.estado === 'resuelto' || r.estado === 'cerrado').length
                const pctResolucion = total > 0 ? ((res / total) * 100).toFixed(1) : '0.0'

                return (
                  <tr key={prioridad} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-3 px-4 text-zinc-300 capitalize">{prioridad}</td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-200">{total}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400">{pend}</td>
                    <td className="py-3 px-4 text-right font-mono text-blue-400">{proc}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400">{res}</td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-200">{pctResolucion}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
