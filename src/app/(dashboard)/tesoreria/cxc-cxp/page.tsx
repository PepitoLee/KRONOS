'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { ExportButton } from '@/components/import-export/ExportButton'
import { formatCurrency } from '@/lib/utils/currency'
import { Skeleton } from '@/components/ui/skeleton'
import { Landmark, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface DocumentoAging {
  id: string
  tipo: string
  serie: string
  numero: string
  nombre_tercero: string
  ruc_dni_tercero: string
  fecha_emision: string
  fecha_vencimiento: string | null
  total: number
  moneda: string
  tipo_operacion: string
  dias_vencido: number
  rango: string
}

interface AgingSummary {
  rango_0_30: number
  rango_31_60: number
  rango_61_90: number
  rango_90_plus: number
  total: number
  cantidad: number
}

const COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444']
const RANGO_LABELS = ['0-30 días', '31-60 días', '61-90 días', '90+ días']

function calcularAging(docs: any[], tipoOp: string): DocumentoAging[] {
  const hoy = new Date()
  return docs
    .filter((d) => d.tipo_operacion === tipoOp && d.estado !== 'anulado')
    .map((d) => {
      const vencimiento = d.fecha_vencimiento
        ? new Date(d.fecha_vencimiento)
        : new Date(new Date(d.fecha_emision).getTime() + 30 * 86400000)
      const diff = Math.floor((hoy.getTime() - vencimiento.getTime()) / 86400000)
      const dias = Math.max(diff, 0)
      let rango = '0-30'
      if (dias > 90) rango = '90+'
      else if (dias > 60) rango = '61-90'
      else if (dias > 30) rango = '31-60'

      return {
        id: d.id,
        tipo: d.tipo,
        serie: d.serie,
        numero: d.numero,
        nombre_tercero: d.nombre_tercero ?? '',
        ruc_dni_tercero: d.ruc_dni_tercero ?? '',
        fecha_emision: d.fecha_emision,
        fecha_vencimiento: d.fecha_vencimiento,
        total: Number(d.total),
        moneda: d.moneda ?? 'PEN',
        tipo_operacion: d.tipo_operacion,
        dias_vencido: dias,
        rango,
      }
    })
    .sort((a, b) => b.dias_vencido - a.dias_vencido)
}

function calcularSummary(docs: DocumentoAging[]): AgingSummary {
  const s: AgingSummary = {
    rango_0_30: 0,
    rango_31_60: 0,
    rango_61_90: 0,
    rango_90_plus: 0,
    total: 0,
    cantidad: docs.length,
  }
  for (const d of docs) {
    s.total += d.total
    if (d.rango === '0-30') s.rango_0_30 += d.total
    else if (d.rango === '31-60') s.rango_31_60 += d.total
    else if (d.rango === '61-90') s.rango_61_90 += d.total
    else s.rango_90_plus += d.total
  }
  return s
}

export default function CxCCxPPage() {
  const [loading, setLoading] = useState(true)
  const [cxcDocs, setCxcDocs] = useState<DocumentoAging[]>([])
  const [cxpDocs, setCxpDocs] = useState<DocumentoAging[]>([])
  const [tab, setTab] = useState<'cxc' | 'cxp'>('cxc')
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: docs } = await supabase
        .from('documentos')
        .select('id, tipo, serie, numero, nombre_tercero, ruc_dni_tercero, fecha_emision, fecha_vencimiento, total, moneda, tipo_operacion, estado')
        .neq('estado', 'anulado')

      if (docs) {
        setCxcDocs(calcularAging(docs, 'venta'))
        setCxpDocs(calcularAging(docs, 'compra'))
      }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const cxcSummary = calcularSummary(cxcDocs)
  const cxpSummary = calcularSummary(cxpDocs)

  const barData = RANGO_LABELS.map((label, i) => ({
    rango: label,
    'Cuentas x Cobrar': [cxcSummary.rango_0_30, cxcSummary.rango_31_60, cxcSummary.rango_61_90, cxcSummary.rango_90_plus][i],
    'Cuentas x Pagar': [cxpSummary.rango_0_30, cxpSummary.rango_31_60, cxpSummary.rango_61_90, cxpSummary.rango_90_plus][i],
  }))

  const activeSummary = tab === 'cxc' ? cxcSummary : cxpSummary
  const activeDocs = tab === 'cxc' ? cxcDocs : cxpDocs
  const pieData = [
    { name: '0-30', value: activeSummary.rango_0_30 },
    { name: '31-60', value: activeSummary.rango_31_60 },
    { name: '61-90', value: activeSummary.rango_61_90 },
    { name: '90+', value: activeSummary.rango_90_plus },
  ].filter((d) => d.value > 0)

  const exportData = activeDocs.map((d) => ({
    tipo: d.tipo,
    serie_numero: `${d.serie}-${d.numero}`,
    tercero: d.nombre_tercero,
    ruc_dni: d.ruc_dni_tercero,
    fecha_emision: d.fecha_emision,
    fecha_vencimiento: d.fecha_vencimiento ?? '-',
    total: d.total,
    dias_vencido: d.dias_vencido,
    rango: d.rango,
  }))

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-64 bg-zinc-800/50" />
        <Skeleton className="h-8 w-80 bg-zinc-800/50" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-zinc-800/50 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 bg-zinc-800/50 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <Landmark className="h-7 w-7 text-emerald-400" />
            Cuentas por Cobrar / Pagar
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Analisis de antiguedad de saldos</p>
        </div>
        <ExportButton
          data={exportData}
          filename={`aging-${tab}-${new Date().toISOString().split('T')[0]}`}
          title={tab === 'cxc' ? 'Cuentas por Cobrar - Aging' : 'Cuentas por Pagar - Aging'}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Total CxC</span>
          </div>
          <p className="text-lg font-bold text-emerald-400 font-mono">{formatCurrency(cxcSummary.total)}</p>
          <p className="text-xs text-zinc-500">{cxcSummary.cantidad} documentos</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownCircle className="h-4 w-4 text-red-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Total CxP</span>
          </div>
          <p className="text-lg font-bold text-red-400 font-mono">{formatCurrency(cxpSummary.total)}</p>
          <p className="text-xs text-zinc-500">{cxpSummary.cantidad} documentos</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Posicion Neta</span>
          <p className={`text-lg font-bold font-mono mt-2 ${cxcSummary.total - cxpSummary.total >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(cxcSummary.total - cxpSummary.total)}
          </p>
          <p className="text-xs text-zinc-500">CxC - CxP</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Vencido 90+</span>
          <p className="text-lg font-bold text-amber-400 font-mono mt-2">
            {formatCurrency(cxcSummary.rango_90_plus + cxpSummary.rango_90_plus)}
          </p>
          <p className="text-xs text-zinc-500">Riesgo alto</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-100">Aging Comparativo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d44" />
            <XAxis dataKey="rango" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e2d44', borderRadius: '8px', color: '#f3f4f6' }}
              formatter={(value) => [formatCurrency(value as number)]}
            />
            <Legend />
            <Bar dataKey="Cuentas x Cobrar" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Cuentas x Pagar" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabs + Detail */}
      <div className="rounded-xl border border-zinc-800 bg-[#111827] overflow-hidden">
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setTab('cxc')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${tab === 'cxc' ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Cuentas por Cobrar ({cxcDocs.length})
          </button>
          <button
            onClick={() => setTab('cxp')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${tab === 'cxp' ? 'bg-red-500/10 text-red-400 border-b-2 border-red-400' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Cuentas por Pagar ({cxpDocs.length})
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          {/* Pie Chart */}
          <div>
            <h4 className="mb-3 text-sm font-medium text-zinc-300">Distribucion por Antiguedad</h4>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(value as number)]} contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e2d44', borderRadius: '8px', color: '#f3f4f6' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-zinc-500 py-10 text-center">Sin datos</p>
            )}
          </div>

          {/* Table */}
          <div className="lg:col-span-2 overflow-x-auto">
            <h4 className="mb-3 text-sm font-medium text-zinc-300">Detalle de Documentos</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                  <th className="py-2 text-left">Doc</th>
                  <th className="py-2 text-left">Tercero</th>
                  <th className="py-2 text-right">Total</th>
                  <th className="py-2 text-right">Dias</th>
                  <th className="py-2 text-center">Rango</th>
                </tr>
              </thead>
              <tbody>
                {activeDocs.slice(0, 20).map((d) => (
                  <tr key={d.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="py-2 text-zinc-300">{d.serie}-{d.numero}</td>
                    <td className="py-2 text-zinc-400 max-w-[200px] truncate">{d.nombre_tercero}</td>
                    <td className="py-2 text-right font-mono text-zinc-200">{formatCurrency(d.total)}</td>
                    <td className="py-2 text-right font-mono text-zinc-400">{d.dias_vencido}</td>
                    <td className="py-2 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        d.rango === '0-30' ? 'bg-emerald-500/20 text-emerald-400' :
                        d.rango === '31-60' ? 'bg-amber-500/20 text-amber-400' :
                        d.rango === '61-90' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {d.rango}
                      </span>
                    </td>
                  </tr>
                ))}
                {activeDocs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">No hay documentos pendientes</td>
                  </tr>
                )}
              </tbody>
            </table>
            {activeDocs.length > 20 && (
              <p className="mt-2 text-xs text-zinc-500 text-center">Mostrando 20 de {activeDocs.length} documentos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
