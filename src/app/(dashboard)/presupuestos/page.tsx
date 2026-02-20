'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DataTable } from '@/components/tables/DataTable'
import { ExportButton } from '@/components/import-export/ExportButton'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Loader2, Wallet, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

// ─── Schema ──────────────────────────────────────────────────────

const presupuestoSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(120, 'El nombre no puede exceder 120 caracteres'),
  periodo: z
    .number({ error: 'Ingrese un año válido' })
    .int('El periodo debe ser un año entero')
    .min(2020, 'El periodo mínimo es 2020')
    .max(2099, 'El periodo máximo es 2099'),
  monto_total: z
    .number({ error: 'Ingrese un monto válido' })
    .positive('El monto debe ser mayor a 0'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
})

type PresupuestoForm = z.infer<typeof presupuestoSchema>

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

// ─── Table columns ───────────────────────────────────────────────

const columns: ColumnDef<Presupuesto, unknown>[] = [
  {
    accessorKey: 'nombre',
    header: 'Nombre',
    cell: ({ row }) => {
      const p = row.original
      return (
        <Link
          href={`/presupuestos/${p.id}`}
          className="text-sm font-medium text-zinc-200 hover:text-emerald-400 transition-colors"
        >
          {p.nombre}
        </Link>
      )
    },
  },
  {
    accessorKey: 'periodo',
    header: 'Periodo',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-zinc-300">
        {row.getValue('periodo') as number}
      </span>
    ),
  },
  {
    accessorKey: 'monto_total',
    header: () => <span className="text-right block">Monto Total</span>,
    cell: ({ row }) => (
      <span className="font-mono text-sm font-medium text-zinc-200 text-right block">
        {formatCurrency(row.getValue('monto_total') as number)}
      </span>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.getValue('estado') as Presupuesto['estado']
      return (
        <Badge className={`${estadoBadgeColors[estado]} border text-xs font-medium`}>
          {estadoLabels[estado]}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Fecha Creación',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-400">
        {formatDate(row.getValue('created_at') as string)}
      </span>
    ),
  },
]

// ─── Page ────────────────────────────────────────────────────────

export default function PresupuestosPage() {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PresupuestoForm>({
    resolver: zodResolver(presupuestoSchema) as any,
    defaultValues: {
      nombre: '',
      periodo: new Date().getFullYear(),
      monto_total: 0,
      descripcion: '',
    },
  })

  // ── Fetch presupuestos ──────────────────────────────────────────

  useEffect(() => {
    async function fetchPresupuestos() {
      try {
        const { data, error } = await supabase
          .from('presupuestos')
          .select('id, nombre, periodo, monto_total, estado, descripcion, created_at')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching presupuestos:', error)
          toast.error('Error al cargar los presupuestos')
          return
        }

        setPresupuestos(data ?? [])
      } finally {
        setLoading(false)
      }
    }

    fetchPresupuestos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Create presupuesto ──────────────────────────────────────────

  const onSubmit = async (formData: PresupuestoForm) => {
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('presupuestos')
        .insert({
          nombre: formData.nombre,
          periodo: formData.periodo,
          monto_total: formData.monto_total,
          descripcion: formData.descripcion || null,
          estado: 'borrador',
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating presupuesto:', error)
        toast.error('Error al crear el presupuesto')
        return
      }

      setPresupuestos((prev) => [data, ...prev])
      toast.success('Presupuesto creado exitosamente')
      setDialogOpen(false)
      reset()
    } finally {
      setSaving(false)
    }
  }

  // ── Filtered data ───────────────────────────────────────────────

  const filteredPresupuestos = useMemo(() => {
    if (filterEstado === 'todos') return presupuestos
    return presupuestos.filter((p) => p.estado === filterEstado)
  }, [presupuestos, filterEstado])

  // ── Export ──────────────────────────────────────────────────────

  const exportData = filteredPresupuestos.map((p) => ({
    nombre: p.nombre,
    periodo: p.periodo,
    monto_total: p.monto_total,
    estado: estadoLabels[p.estado],
    fecha_creacion: formatDate(p.created_at),
  }))

  const exportColumns = [
    { header: 'Nombre', key: 'nombre' },
    { header: 'Periodo', key: 'periodo' },
    { header: 'Monto Total (PEN)', key: 'monto_total' },
    { header: 'Estado', key: 'estado' },
    { header: 'Fecha Creación', key: 'fecha_creacion' },
  ]

  // ── Skeleton loading ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-64 bg-zinc-800/50" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-80 bg-zinc-800/50" />
          <Skeleton className="h-4 w-48 bg-zinc-800/50" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-40 bg-zinc-800/50" />
          <Skeleton className="h-9 w-40 bg-zinc-800/50" />
        </div>
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <div className="bg-zinc-900/50 p-3">
            <Skeleton className="h-4 w-full bg-zinc-800/50" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-t border-zinc-800 p-3">
              <Skeleton className="h-5 w-48 bg-zinc-800/50" />
              <Skeleton className="h-5 w-16 bg-zinc-800/50" />
              <Skeleton className="h-5 w-28 bg-zinc-800/50" />
              <Skeleton className="h-5 w-20 bg-zinc-800/50" />
              <Skeleton className="h-5 w-24 bg-zinc-800/50" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <Wallet className="h-7 w-7 text-emerald-400" />
            Presupuestos
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Gestiona los presupuestos anuales, controla la ejecución y el seguimiento de gastos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={exportData}
            filename="presupuestos"
            columns={exportColumns}
            title="Presupuestos"
          />

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Presupuesto
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111827] border-zinc-800 sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Crear Presupuesto</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-5">
                {/* Nombre */}
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-zinc-300">
                    Nombre del presupuesto
                  </Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Presupuesto Operativo 2026"
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                    {...register('nombre')}
                  />
                  {errors.nombre && (
                    <p className="text-xs text-red-400">{errors.nombre.message}</p>
                  )}
                </div>

                {/* Periodo + Monto */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="periodo" className="text-zinc-300">
                      Periodo (Año)
                    </Label>
                    <Input
                      id="periodo"
                      type="number"
                      placeholder="2026"
                      className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono placeholder:text-zinc-600"
                      {...register('periodo', { valueAsNumber: true })}
                    />
                    {errors.periodo && (
                      <p className="text-xs text-red-400">{errors.periodo.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monto_total" className="text-zinc-300">
                      Monto Total (PEN)
                    </Label>
                    <Input
                      id="monto_total"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono placeholder:text-zinc-600"
                      {...register('monto_total', { valueAsNumber: true })}
                    />
                    {errors.monto_total && (
                      <p className="text-xs text-red-400">{errors.monto_total.message}</p>
                    )}
                  </div>
                </div>

                {/* Descripcion */}
                <div className="space-y-2">
                  <Label htmlFor="descripcion" className="text-zinc-300">
                    Descripción <span className="text-zinc-600">(opcional)</span>
                  </Label>
                  <Textarea
                    id="descripcion"
                    rows={3}
                    placeholder="Descripción del presupuesto..."
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 resize-none"
                    {...register('descripcion')}
                  />
                  {errors.descripcion && (
                    <p className="text-xs text-red-400">{errors.descripcion.message}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-zinc-700"
                    onClick={() => {
                      setDialogOpen(false)
                      reset()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Presupuesto
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Filter className="h-4 w-4" />
          <span>Filtros:</span>
        </div>

        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700 text-zinc-300">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="aprobado">Aprobado</SelectItem>
            <SelectItem value="ejecutando">Ejecutando</SelectItem>
            <SelectItem value="cerrado">Cerrado</SelectItem>
          </SelectContent>
        </Select>

        {filterEstado !== 'todos' && (
          <Badge
            className="bg-zinc-800 text-zinc-300 border border-zinc-700 cursor-pointer hover:bg-zinc-700 text-xs"
            onClick={() => setFilterEstado('todos')}
          >
            {estadoLabels[filterEstado as Presupuesto['estado']]} &times;
          </Badge>
        )}

        <span className="ml-auto text-xs text-zinc-500">
          Mostrando {filteredPresupuestos.length} de {presupuestos.length} presupuestos
        </span>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredPresupuestos}
        searchPlaceholder="Buscar presupuesto..."
        searchColumn="nombre"
        pageSize={10}
      />
    </div>
  )
}
