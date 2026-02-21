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
  TrendingDown,
  Users,
  BarChart3,
  Receipt,
  AlertTriangle,
  FileText,
  Wallet,
  Minus,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import Link from 'next/link'

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

interface TopClienteEntry {
  nombre: string
  total: number
}

interface GastoCategoriaEntry {
  nombre: string
  total: number
}

interface ComparativaMes {
  ventasActual: number
  ventasAnterior: number
  comprasActual: number
  comprasAnterior: number
  utilidadActual: number
  utilidadAnterior: number
}

interface DashboardData {
  ventasMes: number
  ventasMesAnterior: number
  comprasMes: number
  utilidadBruta: number
  transacciones: number
  ticketPromedio: number
  posicionCaja: number
  alertas: { id: string; tipo: string; nombre: string; dias: number }[]
  ventasEvolutivo: { mes: string; ventas: number }[]
  topClientes: TopClienteEntry[]
  gastosPorCategoria: GastoCategoriaEntry[]
  comparativa: ComparativaMes
}

function calcPctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return ((current - previous) / Math.abs(previous)) * 100
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    ventasMes: 0,
    ventasMesAnterior: 0,
    comprasMes: 0,
    utilidadBruta: 0,
    transacciones: 0,
    ticketPromedio: 0,
    posicionCaja: 0,
    alertas: [],
    ventasEvolutivo: [],
    topClientes: [],
    gastosPorCategoria: [],
    comparativa: {
      ventasActual: 0,
      ventasAnterior: 0,
      comprasActual: 0,
      comprasAnterior: 0,
      utilidadActual: 0,
      utilidadAnterior: 0,
    },
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

        // Compras mes anterior
        const { data: comprasAntData } = await supabase
          .from('documentos')
          .select('total')
          .eq('tipo_operacion', 'compra')
          .neq('estado', 'anulado')
          .gte('fecha_emision', `${mesAnterior}-01`)
          .lt('fecha_emision', `${mesActual}-01`)

        const comprasMesAnterior = comprasAntData?.reduce((sum, d) => sum + Number(d.total), 0) ?? 0

        // Transacciones
        const { count: transacciones } = await supabase
          .from('transacciones_venta')
          .select('*', { count: 'exact', head: true })
          .gte('fecha', `${mesActual}-01`)

        const txCount = transacciones ?? 0

        // Posicion de Caja - saldo_actual from cuentas_bancarias activas
        const { data: cuentasData } = await supabase
          .from('cuentas_bancarias')
          .select('saldo_actual')
          .eq('activa', true)

        const posicionCaja = cuentasData?.reduce((sum, c) => sum + Number(c.saldo_actual), 0) ?? 0

        // Top 5 Clientes por ventas
        const { data: ventasClientesData } = await supabase
          .from('documentos')
          .select('nombre_tercero, total')
          .eq('tipo_operacion', 'venta')
          .neq('estado', 'anulado')

        const clientesMap = new Map<string, number>()
        ventasClientesData?.forEach((doc) => {
          const nombre = doc.nombre_tercero || 'Sin nombre'
          clientesMap.set(nombre, (clientesMap.get(nombre) ?? 0) + Number(doc.total))
        })
        const topClientes: TopClienteEntry[] = Array.from(clientesMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([nombre, total]) => ({ nombre, total }))

        // Gastos por Categoria (top 5 proveedores por compras)
        const { data: comprasProveedoresData } = await supabase
          .from('documentos')
          .select('nombre_tercero, total')
          .eq('tipo_operacion', 'compra')
          .neq('estado', 'anulado')

        const proveedoresMap = new Map<string, number>()
        comprasProveedoresData?.forEach((doc) => {
          const nombre = doc.nombre_tercero || 'Sin nombre'
          proveedoresMap.set(nombre, (proveedoresMap.get(nombre) ?? 0) + Number(doc.total))
        })
        const gastosPorCategoria: GastoCategoriaEntry[] = Array.from(proveedoresMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([nombre, total]) => ({ nombre, total }))

        // Alertas documentos por vencer
        const { data: alertasData } = await supabase
          .from('auditoria_documentos')
          .select('id, tipo_documento, nombre_documento, dias_para_vencimiento')
          .lte('dias_para_vencimiento', 90)
          .gt('dias_para_vencimiento', 0)
          .order('dias_para_vencimiento')
          .limit(5)

        // Evolutivo ultimos 12 meses
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

        const utilidadActual = ventasMes - comprasMes
        const utilidadAnterior = ventasMesAnterior - comprasMesAnterior

        setData({
          ventasMes,
          ventasMesAnterior,
          comprasMes,
          utilidadBruta: utilidadActual,
          transacciones: txCount,
          ticketPromedio: txCount > 0 ? ventasMes / txCount : 0,
          posicionCaja,
          alertas: (alertasData ?? []).map((a) => ({
            id: a.id,
            tipo: a.tipo_documento,
            nombre: a.nombre_documento,
            dias: a.dias_para_vencimiento ?? 0,
          })),
          ventasEvolutivo: meses,
          topClientes,
          gastosPorCategoria,
          comparativa: {
            ventasActual: ventasMes,
            ventasAnterior: ventasMesAnterior,
            comprasActual: comprasMes,
            comprasAnterior: comprasMesAnterior,
            utilidadActual,
            utilidadAnterior,
          },
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-zinc-800/50" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-xl bg-zinc-800/50" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-zinc-800/50" />
          ))}
        </div>
      </div>
    )
  }

  const ventasChange = calcPctChange(data.comparativa.ventasActual, data.comparativa.ventasAnterior)
  const comprasChange = calcPctChange(data.comparativa.comprasActual, data.comparativa.comprasAnterior)
  const utilidadChange = calcPctChange(data.comparativa.utilidadActual, data.comparativa.utilidadAnterior)

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Dashboard</h2>
        <p className="text-sm text-zinc-500">Resumen financiero del periodo actual</p>
      </div>

      {/* KPIs principales */}
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

      {/* Ticket Promedio + Posicion de Caja */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <KPICard
          title="Ticket Promedio"
          value={data.ticketPromedio}
          icon={BarChart3}
        />
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-5 transition-colors hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-400">Posici&oacute;n de Caja</p>
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Wallet className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-100 font-mono">
            {formatCurrency(data.posicionCaja)}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Saldo total cuentas activas
          </p>
        </div>
      </div>

      {/* Comparativa Mes Anterior */}
      <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-100">
          Comparativa vs Mes Anterior
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ComparativaItem
            label="Ventas"
            actual={data.comparativa.ventasActual}
            anterior={data.comparativa.ventasAnterior}
            pctChange={ventasChange}
          />
          <ComparativaItem
            label="Compras"
            actual={data.comparativa.comprasActual}
            anterior={data.comparativa.comprasAnterior}
            pctChange={comprasChange}
            invertColor
          />
          <ComparativaItem
            label="Utilidad"
            actual={data.comparativa.utilidadActual}
            anterior={data.comparativa.utilidadAnterior}
            pctChange={utilidadChange}
          />
        </div>
      </div>

      {/* Sales Evolution Chart */}
      <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-100">
          Evoluci&oacute;n de Ventas (12 meses)
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

      {/* Top 5 Clientes + Gastos por Categoria */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top 5 Clientes - PieChart */}
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">
            Top 5 Clientes por Ventas
          </h3>
          {data.topClientes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.topClientes}
                  dataKey="total"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${(name ?? '').length > 15 ? (name ?? '').slice(0, 15) + '...' : (name ?? '')} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={{ stroke: '#4b5563' }}
                >
                  {data.topClientes.map((_, index) => (
                    <Cell key={`cell-cliente-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #1e2d44',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                  formatter={(value) => [formatCurrency(value as number), 'Ventas']}
                />
                <Legend
                  formatter={(value: string) =>
                    value.length > 20 ? value.slice(0, 20) + '...' : value
                  }
                  wrapperStyle={{ color: '#d1d5db', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-zinc-500">No hay datos de ventas por cliente</p>
          )}
        </div>

        {/* Gastos por Categoria - DonutChart */}
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">
            Gastos por Categor&iacute;a (Proveedores)
          </h3>
          {data.gastosPorCategoria.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.gastosPorCategoria}
                  dataKey="total"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${(name ?? '').length > 15 ? (name ?? '').slice(0, 15) + '...' : (name ?? '')} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={{ stroke: '#4b5563' }}
                >
                  {data.gastosPorCategoria.map((_, index) => (
                    <Cell key={`cell-gasto-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #1e2d44',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                  formatter={(value) => [formatCurrency(value as number), 'Compras']}
                />
                <Legend
                  formatter={(value: string) =>
                    value.length > 20 ? value.slice(0, 20) + '...' : value
                  }
                  wrapperStyle={{ color: '#d1d5db', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-zinc-500">No hay datos de gastos por proveedor</p>
          )}
        </div>
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
                    {alerta.dias} d&iacute;as
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
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">Accesos R&aacute;pidos</h3>
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

function ComparativaItem({
  label,
  actual,
  anterior,
  pctChange,
  invertColor = false,
}: {
  label: string
  actual: number
  anterior: number
  pctChange: number | null
  invertColor?: boolean
}) {
  const isPositive = pctChange !== null && pctChange > 0
  const isNegative = pctChange !== null && pctChange < 0

  // For compras, an increase is bad (red) and decrease is good (green)
  const showGreen = invertColor ? isNegative : isPositive
  const showRed = invertColor ? isPositive : isNegative

  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <div className="mt-1 flex items-baseline gap-3">
        <span className="text-xl font-bold text-zinc-100 font-mono">
          {formatCurrency(actual)}
        </span>
        {pctChange !== null && (
          <span
            className={`flex items-center gap-0.5 text-sm font-medium ${
              showGreen
                ? 'text-emerald-400'
                : showRed
                  ? 'text-red-400'
                  : 'text-zinc-500'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : isNegative ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
            {pctChange > 0 ? '+' : ''}
            {pctChange.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Anterior: {formatCurrency(anterior)}
      </p>
    </div>
  )
}
