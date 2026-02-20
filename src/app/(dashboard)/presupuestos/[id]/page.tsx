'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { DataTable } from '@/components/tables/DataTable'
import { ExportButton } from '@/components/import-export/ExportButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, PiggyBank, Percent } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────

interface Presupuesto {
  id: string
  nombre: string
  periodo: number
  monto_total: number
  estado: 'borrador' | 'aprobado' | 'ejecutando' | 'cerrado'
  descripcion: string | null
  created_at: string
}

interface PresupuestoLinea {
  id: string
  presupuesto_id: string
  categoria: string
  concepto: string
  monto_presupuestado: number
  monto_ejecutado: number
}

// ─── Badge colours ───────────────────────────────────────────────

const estadoBadgeColors: Record<Presupuesto['estado'], string> = {
  borrador: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  aprobado: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  ejecutando: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  cerrado: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
}

const estadoLabels: Record<Presupuesto['estado'], string> = {
  borrador: 'Borrador',
  aprobado: 'Aprobado',
  ejecutando: 'Ejecutando',
  cerrado: 'Cerrado',
}

// ─── Progress bar component ──────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(Math.max(value, 0), 100)
  let barColor = 'bg-emerald-500'
  if (clamped > 90) barColor = 'bg-red-500'
  else if (clamped > 75) barColor = 'bg-amber-500'

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="h-2 flex-1 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="font-mono text-xs text-zinc-400 w-12 text-right">
        {value.toFixed(1)}%
      </span>
    </div>
  )
}

// ─── Table columns ───────────────────────────────────────────────

const lineaColumns: ColumnDef<PresupuestoLinea & { diferencia: number; porcentaje: number }, unknown>[] = [
  {
    accessorKey: 'categoria',
    header: 'Categoría',
    cell: ({ row }) => (
      <Badge className="bg-zinc-500/15 text-zinc-300 border-zinc-500/20 border text-xs font-medium">
        {row.getValue('categoria') as string}
      </Badge>
    ),
  },
  {
    accessorKey: 'concepto',
    header: 'Concepto',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-200">{row.getValue('concepto') as string}</span>
    ),
  },
  {
    accessorKey: 'monto_presupuestado',
    header: () => <span className="text-right block">Presupuestado</span>,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-zinc-300 text-right block">
        {formatCurrency(row.getValue('monto_presupuestado') as number)}
      </span>
    ),
  },
  {
    accessorKey: 'monto_ejecutado',
    header: () => <span className="text-right block">Ejecutado</span>,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-zinc-200 text-right block">
        {formatCurrency(row.getValue('monto_ejecutado') as number)}
      </span>
    ),
  },
  {
    accessorKey: 'diferencia',
    header: () => <span className="text-right block">Diferencia</span>,
    cell: ({ row }) => {
      const diferencia = row.getValue('diferencia') as number
      const isNegative = diferencia < 0
      return (
        <span
          className={`font-mono text-sm text-right block ${
            isNegative ? 'text-red-400' : 'text-emerald-400'
          }`}
        >
          {isNegative ? '-' : '+'}
          {formatCurrency(Math.abs(diferencia))}
        </span>
      )
    },
  },
  {
    accessorKey: 'porcentaje',
    header: '% Ejecución',
    cell: ({ row }) => <ProgressBar value={row.getValue('porcentaje') as number} />,
  },
]

// ─── Summary card component ──────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconColor,
  isCurrency = true,
  suffix,
}: {
  label: string
  value: number
  icon: React.ElementType
  iconColor: string
  isCurrency?: boolean
  suffix?: string
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`rounded-md p-1.5 ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <p className="font-mono text-xl font-bold text-zinc-100">
        {isCurrency ? formatCurrency(value) : `${value.toFixed(1)}${suffix ?? ''}`}
      </p>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────

export default function PresupuestoDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null)
  const [lineas, setLineas] = useState<PresupuestoLinea[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // ── Fetch data ──────────────────────────────────────────────────

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch presupuesto
        const { data: pData, error: pError } = await supabase
          .from('presupuestos')
          .select('id, nombre, periodo, monto_total, estado, descripcion, created_at')
          .eq('id', id)
          .single()

        if (pError) {
          console.error('Error fetching presupuesto:', pError)
          toast.error('Error al cargar el presupuesto')
          return
        }

        setPresupuesto(pData)

        // Fetch lineas
        const { data: lData, error: lError } = await supabase
          .from('presupuesto_lineas')
          .select('id, presupuesto_id, categoria, concepto, monto_presupuestado, monto_ejecutado')
          .eq('presupuesto_id', id)
          .order('categoria', { ascending: true })

        if (lError) {
          console.error('Error fetching lineas:', lError)
          toast.error('Error al cargar las líneas del presupuesto')
          return
        }

        setLineas(lData ?? [])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ── Computed data ───────────────────────────────────────────────

  const totalPresupuestado = lineas.reduce((sum, l) => sum + l.monto_presupuestado, 0)
  const totalEjecutado = lineas.reduce((sum, l) => sum + l.monto_ejecutado, 0)
  const totalDisponible = totalPresupuestado - totalEjecutado
  const porcentajeEjecucion = totalPresupuestado > 0 ? (totalEjecutado / totalPresupuestado) * 100 : 0

  const lineasConCalculo = lineas.map((l) => ({
    ...l,
    diferencia: l.monto_presupuestado - l.monto_ejecutado,
    porcentaje: l.monto_presupuestado > 0 ? (l.monto_ejecutado / l.monto_presupuestado) * 100 : 0,
  }))

  // ── Export ──────────────────────────────────────────────────────

  const exportData = lineasConCalculo.map((l) => ({
    categoria: l.categoria,
    concepto: l.concepto,
    monto_presupuestado: l.monto_presupuestado,
    monto_ejecutado: l.monto_ejecutado,
    diferencia: l.diferencia,
    porcentaje_ejecucion: `${l.porcentaje.toFixed(1)}%`,
  }))

  const exportColumns = [
    { header: 'Categoría', key: 'categoria' },
    { header: 'Concepto', key: 'concepto' },
    { header: 'Presupuestado (PEN)', key: 'monto_presupuestado' },
    { header: 'Ejecutado (PEN)', key: 'monto_ejecutado' },
    { header: 'Diferencia (PEN)', key: 'diferencia' },
    { header: '% Ejecución', key: 'porcentaje_ejecucion' },
  ]

  // ── Skeleton loading ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-80 bg-zinc-800/50" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-96 bg-zinc-800/50" />
          <Skeleton className="h-4 w-64 bg-zinc-800/50" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-zinc-800 p-5 space-y-3">
              <Skeleton className="h-4 w-24 bg-zinc-800/50" />
              <Skeleton className="h-7 w-32 bg-zinc-800/50" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <div className="bg-zinc-900/50 p-3">
            <Skeleton className="h-4 w-full bg-zinc-800/50" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-t border-zinc-800 p-3">
              <Skeleton className="h-5 w-24 bg-zinc-800/50" />
              <Skeleton className="h-5 w-40 bg-zinc-800/50" />
              <Skeleton className="h-5 w-24 bg-zinc-800/50" />
              <Skeleton className="h-5 w-24 bg-zinc-800/50" />
              <Skeleton className="h-5 w-24 bg-zinc-800/50" />
              <Skeleton className="h-5 w-32 bg-zinc-800/50" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!presupuesto) {
    return (
      <div className="space-y-6">
        <BreadcrumbNav />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Wallet className="h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-medium text-zinc-300">Presupuesto no encontrado</h3>
          <p className="text-sm text-zinc-500 mt-1">
            El presupuesto solicitado no existe o fue eliminado.
          </p>
          <Link href="/presupuestos">
            <Button variant="outline" className="mt-4 border-zinc-700">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Presupuestos
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/presupuestos">
              <Button variant="outline" size="icon" className="border-zinc-700 h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
              <Wallet className="h-7 w-7 text-emerald-400" />
              {presupuesto.nombre}
            </h2>
            <Badge
              className={`${estadoBadgeColors[presupuesto.estado]} border text-xs font-medium`}
            >
              {estadoLabels[presupuesto.estado]}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-zinc-500 ml-11">
            Periodo: <span className="font-mono text-zinc-400">{presupuesto.periodo}</span>
            {presupuesto.descripcion && (
              <> &mdash; {presupuesto.descripcion}</>
            )}
            {' '}&middot;{' '}
            Creado el {formatDate(presupuesto.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={exportData}
            filename={`presupuesto-${presupuesto.nombre.toLowerCase().replace(/\s+/g, '-')}`}
            columns={exportColumns}
            title={`Presupuesto: ${presupuesto.nombre}`}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Presupuestado"
          value={totalPresupuestado}
          icon={PiggyBank}
          iconColor="bg-blue-500/15 text-blue-400"
        />
        <SummaryCard
          label="Total Ejecutado"
          value={totalEjecutado}
          icon={TrendingUp}
          iconColor="bg-emerald-500/15 text-emerald-400"
        />
        <SummaryCard
          label="Disponible"
          value={totalDisponible}
          icon={TrendingDown}
          iconColor={totalDisponible >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}
        />
        <SummaryCard
          label="% Ejecución"
          value={porcentajeEjecucion}
          icon={Percent}
          iconColor={
            porcentajeEjecucion > 90
              ? 'bg-red-500/15 text-red-400'
              : porcentajeEjecucion > 75
                ? 'bg-amber-500/15 text-amber-400'
                : 'bg-emerald-500/15 text-emerald-400'
          }
          isCurrency={false}
          suffix="%"
        />
      </div>

      {/* Global progress bar */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Ejecución global del presupuesto</span>
          <span className="font-mono text-sm text-zinc-300">{porcentajeEjecucion.toFixed(1)}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              porcentajeEjecucion > 90
                ? 'bg-red-500'
                : porcentajeEjecucion > 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(porcentajeEjecucion, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
          <span>Ejecutado: {formatCurrency(totalEjecutado)}</span>
          <span>Presupuestado: {formatCurrency(totalPresupuestado)}</span>
        </div>
      </div>

      {/* Line items section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-100">Líneas del Presupuesto</h3>
        <span className="text-xs text-zinc-500">{lineas.length} línea(s)</span>
      </div>

      {/* Line items table */}
      {lineas.length > 0 ? (
        <DataTable
          columns={lineaColumns}
          data={lineasConCalculo}
          searchPlaceholder="Buscar por categoría o concepto..."
          pageSize={15}
        />
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 py-16 text-center">
          <Wallet className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-sm text-zinc-400">
            Este presupuesto no tiene líneas registradas aún.
          </p>
        </div>
      )}
    </div>
  )
}
