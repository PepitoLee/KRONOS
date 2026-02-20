'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KPICard } from '@/components/charts/KPICard'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  BarChart3,
  Receipt,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Link from 'next/link'

interface DashboardData {
  ventasMes: number
  ventasMesAnterior: number
  comprasMes: number
  utilidadBruta: number
  transacciones: number
  ticketPromedio: number
  alertas: { id: string; tipo: string; nombre: string; dias: number }[]
  ventasEvolutivo: { mes: string; ventas: number }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    ventasMes: 0,
    ventasMesAnterior: 0,
    comprasMes: 0,
    utilidadBruta: 0,
    transacciones: 0,
    ticketPromedio: 0,
    alertas: [],
    ventasEvolutivo: [],
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboard() {
      try {
        const now = new Date()
        const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const mesAnterior = now.getMonth() === 0
          ? `${now.getFullYear() - 1}-12`
          : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`

        // Ventas mes actual
        const { data: ventasActual } = await supabase
          .from('documentos')
          .select('total')
          .eq('tipo_operacion', 'venta')
          .neq('estado', 'anulado')
          .gte('fecha_emision', `${mesActual}-01`)

        const ventasMes = ventasActual?.reduce((sum, d) => sum + Number(d.total), 0) ?? 0

        // Ventas mes anterior
        const { data: ventasAnt } = await supabase
          .from('documentos')
          .select('total')
          .eq('tipo_operacion', 'venta')
          .neq('estado', 'anulado')
          .gte('fecha_emision', `${mesAnterior}-01`)
          .lt('fecha_emision', `${mesActual}-01`)

        const ventasMesAnterior = ventasAnt?.reduce((sum, d) => sum + Number(d.total), 0) ?? 0

        // Compras mes actual
        const { data: comprasActual } = await supabase
          .from('documentos')
          .select('total')
          .eq('tipo_operacion', 'compra')
          .neq('estado', 'anulado')
          .gte('fecha_emision', `${mesActual}-01`)

        const comprasMes = comprasActual?.reduce((sum, d) => sum + Number(d.total), 0) ?? 0

        // Transacciones
        const { count: transacciones } = await supabase
          .from('transacciones_venta')
          .select('*', { count: 'exact', head: true })
          .gte('fecha', `${mesActual}-01`)

        const txCount = transacciones ?? 0

        // Alertas documentos por vencer
        const { data: alertasData } = await supabase
          .from('auditoria_documentos')
          .select('id, tipo_documento, nombre_documento, dias_para_vencimiento')
          .lte('dias_para_vencimiento', 90)
          .gt('dias_para_vencimiento', 0)
          .order('dias_para_vencimiento')
          .limit(5)

        // Evolutivo últimos 12 meses
        const meses: { mes: string; ventas: number }[] = []
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const periodo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          const siguienteMes = new Date(d.getFullYear(), d.getMonth() + 1, 1)
          const periodoSig = `${siguienteMes.getFullYear()}-${String(siguienteMes.getMonth() + 1).padStart(2, '0')}`

          const { data: ventasMesI } = await supabase
            .from('documentos')
            .select('total')
            .eq('tipo_operacion', 'venta')
            .neq('estado', 'anulado')
            .gte('fecha_emision', `${periodo}-01`)
            .lt('fecha_emision', `${periodoSig}-01`)

          meses.push({
            mes: d.toLocaleDateString('es-PE', { month: 'short' }),
            ventas: ventasMesI?.reduce((s, v) => s + Number(v.total), 0) ?? 0,
          })
        }

        setData({
          ventasMes,
          ventasMesAnterior,
          comprasMes,
          utilidadBruta: ventasMes - comprasMes,
          transacciones: txCount,
          ticketPromedio: txCount > 0 ? ventasMes / txCount : 0,
          alertas: (alertasData ?? []).map((a) => ({
            id: a.id,
            tipo: a.tipo_documento,
            nombre: a.nombre_documento,
            dias: a.dias_para_vencimiento ?? 0,
          })),
          ventasEvolutivo: meses,
        })
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [supabase])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-zinc-800/50" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-xl bg-zinc-800/50" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Dashboard</h2>
        <p className="text-sm text-zinc-500">Resumen financiero del periodo actual</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Ventas del Mes"
          value={data.ventasMes}
          previousValue={data.ventasMesAnterior}
          icon={DollarSign}
        />
        <KPICard
          title="Compras del Mes"
          value={data.comprasMes}
          icon={ShoppingCart}
        />
        <KPICard
          title="Utilidad Bruta"
          value={data.utilidadBruta}
          icon={TrendingUp}
        />
        <KPICard
          title="Transacciones"
          value={data.transacciones}
          format="number"
          icon={Receipt}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KPICard
          title="Ticket Promedio"
          value={data.ticketPromedio}
          icon={BarChart3}
        />
      </div>

      {/* Sales Evolution Chart */}
      <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-100">
          Evolución de Ventas (12 meses)
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data.ventasEvolutivo}>
            <defs>
              <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d44" />
            <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #1e2d44',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
              formatter={(value) => [formatCurrency(value as number), 'Ventas']}
            />
            <Area
              type="monotone"
              dataKey="ventas"
              stroke="#10b981"
              fill="url(#colorVentas)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts & Quick Links */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Alerts */}
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-100">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Alertas Activas
          </h3>
          {data.alertas.length > 0 ? (
            <div className="space-y-3">
              {data.alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-300">{alerta.nombre}</p>
                    <p className="text-xs text-zinc-500">{alerta.tipo}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      alerta.dias <= 30
                        ? 'bg-red-500/20 text-red-400'
                        : alerta.dias <= 60
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {alerta.dias} días
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No hay alertas activas</p>
          )}
        </div>

        {/* Quick Links */}
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">Accesos Rápidos</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Nuevo Documento', href: '/documentos/nuevo', icon: FileText },
              { label: 'Ver Planillas', href: '/planillas', icon: Users },
              { label: 'Estado de Resultados', href: '/estados-financieros/resultados', icon: BarChart3 },
              { label: 'Calcular IGV', href: '/impuestos/igv', icon: DollarSign },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 p-3 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/5"
              >
                <link.icon className="h-5 w-5 text-emerald-400" />
                <span className="text-sm text-zinc-300">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
