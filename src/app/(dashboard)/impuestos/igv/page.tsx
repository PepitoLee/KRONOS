'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { DataTable } from '@/components/tables/DataTable'
import { ExportButton } from '@/components/import-export/ExportButton'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate, getCurrentPeriod } from '@/lib/utils/dates'
import { calcularIGV } from '@/lib/calculations/taxes'
import { IGV_TASA } from '@/types/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ColumnDef } from '@tanstack/react-table'
import {
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowDownUp,
  Calculator,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Documento {
  id: string
  tipo: string
  serie: string
  numero: string
  fecha_emision: string
  tipo_operacion: 'compra' | 'venta'
  nombre_tercero: string
  subtotal: number | null
  igv: number | null
  total: number
  estado: string
}

interface IGVMensual {
  periodo: string
  label: string
  igvVentas: number
  igvCompras: number
  igvNeto: number
}

const docColumns: ColumnDef<Documento, unknown>[] = [
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const labels: Record<string, string> = {
        factura: 'Factura',
        boleta: 'Boleta',
        nota_credito: 'N. Credito',
        nota_debito: 'N. Debito',
      }
      return (
        <Badge className="bg-zinc-500/15 text-zinc-300 border-zinc-500/20 border text-xs">
          {labels[row.original.tipo] ?? row.original.tipo}
        </Badge>
      )
    },
  },
  {
    id: 'serie_numero',
    header: 'Serie - Numero',
    accessorFn: (row) => `${row.serie}-${row.numero}`,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-zinc-200">
        {row.original.serie}-{row.original.numero}
      </span>
    ),
  },
  {
    accessorKey: 'fecha_emision',
    header: 'Fecha',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-400">{formatDate(row.original.fecha_emision)}</span>
    ),
  },
  {
    accessorKey: 'tipo_operacion',
    header: 'Operacion',
    cell: ({ row }) => {
      const isVenta = row.original.tipo_operacion === 'venta'
      return (
        <Badge
          className={`border text-xs font-medium ${
            isVenta
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
              : 'bg-sky-500/15 text-sky-400 border-sky-500/20'
          }`}
        >
          {isVenta ? 'Venta' : 'Compra'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'nombre_tercero',
    header: 'Cliente / Proveedor',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-300 max-w-[180px] truncate block">
        {row.original.nombre_tercero}
      </span>
    ),
  },
  {
    accessorKey: 'subtotal',
    header: 'Base Imponible',
    cell: ({ row }) => {
      const subtotal = row.original.subtotal ?? row.original.total / (1 + IGV_TASA)
      return <span className="font-mono text-sm text-zinc-300">{formatCurrency(subtotal)}</span>
    },
  },
  {
    accessorKey: 'igv',
    header: 'IGV',
    cell: ({ row }) => {
      const igv = row.original.igv ?? (row.original.total / (1 + IGV_TASA)) * IGV_TASA
      return (
        <span className="font-mono text-sm font-semibold text-amber-400">
          {formatCurrency(igv)}
        </span>
      )
    },
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-zinc-200">{formatCurrency(row.original.total)}</span>
    ),
  },
]

export default function IGVPage() {
  const [periodo, setPeriodo] = useState(getCurrentPeriod())
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [chartData, setChartData] = useState<IGVMensual[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingChart, setLoadingChart] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchDocumentos() {
      setLoading(true)
      try {
        const [anio, mes] = periodo.split('-').map(Number)
        const inicioMes = `${periodo}-01`
        const finMes = new Date(anio, mes, 0).toISOString().split('T')[0]

        const { data, error } = await supabase
          .from('documentos')
          .select('id, tipo, serie, numero, fecha_emision, tipo_operacion, nombre_tercero, subtotal, igv, total, estado')
          .gte('fecha_emision', inicioMes)
          .lte('fecha_emision', finMes)
          .neq('estado', 'anulado')
          .order('fecha_emision', { ascending: false })

        if (error) {
          console.error('Error fetching documentos:', error)
          return
        }

        setDocumentos(data ?? [])
      } finally {
        setLoading(false)
      }
    }

    fetchDocumentos()
  }, [supabase, periodo])

  useEffect(() => {
    async function fetchChartData() {
      setLoadingChart(true)
      try {
        const [anio, mes] = periodo.split('-').map(Number)
        const meses: IGVMensual[] = []

        for (let i = 5; i >= 0; i--) {
          let m = mes - i
          let a = anio
          if (m <= 0) {
            m += 12
            a -= 1
          }
          const per = `${a}-${String(m).padStart(2, '0')}`
          const inicio = `${per}-01`
          const fin = new Date(a, m, 0).toISOString().split('T')[0]

          const { data } = await supabase
            .from('documentos')
            .select('tipo_operacion, subtotal, igv, total')
            .gte('fecha_emision', inicio)
            .lte('fecha_emision', fin)
            .neq('estado', 'anulado')

          const docs = data ?? []

          const igvVentas = docs
            .filter((d) => d.tipo_operacion === 'venta')
            .reduce((sum, d) => sum + (d.igv ?? (d.total / (1 + IGV_TASA)) * IGV_TASA), 0)

          const igvCompras = docs
            .filter((d) => d.tipo_operacion === 'compra')
            .reduce((sum, d) => sum + (d.igv ?? (d.total / (1 + IGV_TASA)) * IGV_TASA), 0)

          const mesLabel = new Date(a, m - 1).toLocaleDateString('es-PE', { month: 'short' })

          meses.push({
            periodo: per,
            label: `${mesLabel} ${a}`,
            igvVentas: Math.round(igvVentas * 100) / 100,
            igvCompras: Math.round(igvCompras * 100) / 100,
            igvNeto: Math.round((igvVentas - igvCompras) * 100) / 100,
          })
        }

        setChartData(meses)
      } finally {
        setLoadingChart(false)
      }
    }

    fetchChartData()
  }, [supabase, periodo])

  const igvCalc = useMemo(() => {
    const totalVentasSinIGV = documentos
      .filter((d) => d.tipo_operacion === 'venta')
      .reduce((sum, d) => sum + (d.subtotal ?? d.total / (1 + IGV_TASA)), 0)

    const totalComprasSinIGV = documentos
      .filter((d) => d.tipo_operacion === 'compra')
      .reduce((sum, d) => sum + (d.subtotal ?? d.total / (1 + IGV_TASA)), 0)

    return calcularIGV(totalVentasSinIGV, totalComprasSinIGV, periodo)
  }, [documentos, periodo])

  const exportData = documentos.map((d) => ({
    tipo: d.tipo,
    serie_numero: `${d.serie}-${d.numero}`,
    fecha: formatDate(d.fecha_emision),
    operacion: d.tipo_operacion === 'venta' ? 'Venta' : 'Compra',
    tercero: d.nombre_tercero,
    base_imponible: d.subtotal ?? d.total / (1 + IGV_TASA),
    igv: d.igv ?? (d.total / (1 + IGV_TASA)) * IGV_TASA,
    total: d.total,
  }))

  const exportColumns = [
    { header: 'Tipo', key: 'tipo' },
    { header: 'Serie - Numero', key: 'serie_numero' },
    { header: 'Fecha', key: 'fecha' },
    { header: 'Operacion', key: 'operacion' },
    { header: 'Cliente/Proveedor', key: 'tercero' },
    { header: 'Base Imponible', key: 'base_imponible' },
    { header: 'IGV', key: 'igv' },
    { header: 'Total', key: 'total' },
  ]

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <Calculator className="h-7 w-7 text-emerald-400" />
            Calculadora de IGV
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Calculo mensual del Impuesto General a las Ventas (18%)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={exportData}
            filename={`igv-${periodo}`}
            columns={exportColumns}
            title={`Detalle IGV - Periodo ${periodo}`}
          />
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <Label htmlFor="periodo" className="text-sm text-zinc-400">
          Periodo tributario:
        </Label>
        <Input
          id="periodo"
          type="month"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="w-48 bg-zinc-900 border-zinc-700 text-zinc-300 font-mono"
        />
      </div>

      {/* IGV Summary Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-zinc-800/50" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {/* IGV Ventas - Debito Fiscal */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-400">IGV Ventas (Debito Fiscal)</p>
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-400 font-mono">
              {formatCurrency(igvCalc.igvVentas)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {documentos.filter((d) => d.tipo_operacion === 'venta').length} documentos de venta
            </p>
          </div>

          {/* IGV Compras - Credito Fiscal */}
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-400">IGV Compras (Credito Fiscal)</p>
              <div className="rounded-lg bg-sky-500/10 p-2">
                <TrendingDown className="h-4 w-4 text-sky-400" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-sky-400 font-mono">
              {formatCurrency(igvCalc.igvCompras)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {documentos.filter((d) => d.tipo_operacion === 'compra').length} documentos de compra
            </p>
          </div>

          {/* IGV Neto */}
          <div
            className={`rounded-xl border p-5 ${
              igvCalc.igvAPagar > 0
                ? 'border-amber-500/20 bg-amber-500/5'
                : 'border-emerald-500/20 bg-emerald-500/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-400">
                {igvCalc.igvAPagar > 0 ? 'IGV a Pagar' : 'Credito Fiscal a Favor'}
              </p>
              <div
                className={`rounded-lg p-2 ${
                  igvCalc.igvAPagar > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                }`}
              >
                {igvCalc.igvAPagar > 0 ? (
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                )}
              </div>
            </div>
            <p
              className={`mt-2 text-3xl font-bold tracking-tight font-mono ${
                igvCalc.igvAPagar > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {formatCurrency(igvCalc.igvAPagar > 0 ? igvCalc.igvAPagar : igvCalc.creditoFiscalFavor)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {igvCalc.igvAPagar > 0
                ? 'Monto a declarar y pagar en PDT 621'
                : 'Saldo a favor para el siguiente periodo'}
            </p>
          </div>
        </div>
      )}

      {/* Chart - IGV Evolution */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ArrowDownUp className="h-5 w-5 text-zinc-400" />
          <h3 className="text-lg font-semibold text-zinc-100">Evolucion IGV - Ultimos 6 meses</h3>
        </div>
        {loadingChart ? (
          <Skeleton className="h-72 w-full rounded-lg bg-zinc-800/50" />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  axisLine={{ stroke: '#3f3f46' }}
                />
                <YAxis
                  tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickFormatter={(v) => `S/ ${(v / 1000).toFixed(0)}k`}
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
                    name === 'igvVentas' ? 'IGV Ventas' : 'IGV Compras',
                  ]) as any}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Bar
                  dataKey="igvVentas"
                  name="igvVentas"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="igvCompras"
                  name="igvCompras"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span>IGV Ventas (Debito Fiscal)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-sky-500" />
            <span>IGV Compras (Credito Fiscal)</span>
          </div>
        </div>
      </div>

      {/* Documents Detail Table */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-zinc-400" />
          <h3 className="text-lg font-semibold text-zinc-100">
            Detalle de Documentos - {periodo}
          </h3>
          <span className="text-sm text-zinc-500">({documentos.length} registros)</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800/50" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={docColumns}
            data={documentos}
            searchPlaceholder="Buscar por nombre, serie..."
            pageSize={15}
          />
        )}
      </div>
    </div>
  )
}
