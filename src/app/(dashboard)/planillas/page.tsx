'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { DataTable } from '@/components/tables/DataTable'
import { ExportButton } from '@/components/import-export/ExportButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/currency'
import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Users, Calculator, Plus } from 'lucide-react'

interface Planilla {
  id: string
  periodo: string
  tipo: string
  estado: string
  total_bruto: number
  total_descuentos: number
  total_aportes: number
  total_neto: number
  created_at: string
}

const columns: ColumnDef<Planilla>[] = [
  {
    accessorKey: 'periodo',
    header: 'Periodo',
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.periodo}</span>
    ),
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipos: Record<string, string> = {
        mensual: 'Mensual',
        gratificacion: 'Gratificación',
        cts: 'CTS',
        liquidacion: 'Liquidación',
      }
      return <Badge variant="outline">{tipos[row.original.tipo] ?? row.original.tipo}</Badge>
    },
  },
  {
    accessorKey: 'total_bruto',
    header: 'Total Bruto',
    cell: ({ row }) => (
      <span className="font-mono">{formatCurrency(row.original.total_bruto)}</span>
    ),
  },
  {
    accessorKey: 'total_descuentos',
    header: 'Descuentos',
    cell: ({ row }) => (
      <span className="font-mono text-red-400">
        -{formatCurrency(row.original.total_descuentos)}
      </span>
    ),
  },
  {
    accessorKey: 'total_neto',
    header: 'Neto a Pagar',
    cell: ({ row }) => (
      <span className="font-mono font-semibold text-emerald-400">
        {formatCurrency(row.original.total_neto)}
      </span>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const colors: Record<string, string> = {
        borrador: 'bg-zinc-500/20 text-zinc-400',
        calculado: 'bg-blue-500/20 text-blue-400',
        aprobado: 'bg-emerald-500/20 text-emerald-400',
        pagado: 'bg-purple-500/20 text-purple-400',
      }
      return (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[row.original.estado] ?? ''}`}>
          {row.original.estado}
        </span>
      )
    },
  },
]

export default function PlanillasPage() {
  const [planillas, setPlanillas] = useState<Planilla[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('planillas')
        .select('*')
        .order('periodo', { ascending: false })

      setPlanillas((data as Planilla[]) ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Planillas</h2>
          <p className="text-sm text-zinc-500">Gestión de planillas mensuales</p>
        </div>
        <div className="flex gap-2">
          <Link href="/planillas/empleados">
            <Button variant="outline" className="border-zinc-700">
              <Users className="mr-2 h-4 w-4" />
              Empleados
            </Button>
          </Link>
          <Link href="/planillas/calcular">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Calculator className="mr-2 h-4 w-4" />
              Calcular Planilla
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800/50" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <ExportButton
              data={planillas as unknown as Record<string, unknown>[]}
              filename="planillas"
              title="Reporte de Planillas"
              columns={[
                { header: 'Periodo', key: 'periodo' },
                { header: 'Tipo', key: 'tipo' },
                { header: 'Total Bruto', key: 'total_bruto' },
                { header: 'Descuentos', key: 'total_descuentos' },
                { header: 'Neto', key: 'total_neto' },
                { header: 'Estado', key: 'estado' },
              ]}
            />
          </div>
          <DataTable columns={columns} data={planillas} searchPlaceholder="Buscar por periodo..." />
        </>
      )}
    </div>
  )
}
