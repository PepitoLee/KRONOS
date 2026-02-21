'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DataTable } from '@/components/tables/DataTable'
import { ExportButton } from '@/components/import-export/ExportButton'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
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
  tipo: string
  anio: number
  periodo_inicio: string
  periodo_fin: string
  estado: 'borrador' | 'aprobado' | 'ejecutando' | 'cerrado'
  notas: string | null
  created_at: string
}

// ─── Schema ──────────────────────────────────────────────────────

const presupuestoSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(120, 'El nombre no puede exceder 120 caracteres'),
  tipo: z.string().min(1, 'Seleccione un tipo de presupuesto'),
  anio: z
    .number({ message: 'Ingrese un año válido' })
    .int('El año debe ser un entero')
    .min(2020, 'El año mínimo es 2020')
    .max(2099, 'El año máximo es 2099'),
  periodo_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  periodo_fin: z.string().min(1, 'La fecha de fin es requerida'),
  notas: z.string().max(500, 'Máximo 500 caracteres').optional(),
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

const tipoLabels: Record<string, string> = {
  operativo: 'Operativo',
  ventas: 'Ventas',
  proyeccion: 'Proyección',
  inversion: 'Inversión',
  general: 'General',
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
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-300">
        {tipoLabels[row.original.tipo] ?? row.original.tipo}
      </span>
    ),
  },
  {
    accessorKey: 'anio',
    header: 'Año',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-zinc-300">
        {row.getValue('anio') as number}
      </span>
    ),
  },
  {
    accessorKey: 'periodo_inicio',
    header: 'Periodo',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-400">
        {formatDate(row.original.periodo_inicio)} — {formatDate(row.original.periodo_fin)}
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
      tipo: '',
      anio: new Date().getFullYear(),
      periodo_inicio: '',
      periodo_fin: '',
      notas: '',
    },
  })

  // ── Fetch presupuestos ──────────────────────────────────────────

  useEffect(() => {
    async function fetchPresupuestos() {
      try {
        const { data, error } = await supabase
          .from('presupuestos')
          .select('id, nombre, tipo, anio, periodo_inicio, periodo_fin, estado, notas, created_at')
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
      const userRes = await supabase.auth.getUser()
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', userRes.data.user?.id)
        .single()

      const { data, error } = await supabase
        .from('presupuestos')
        .insert({
          nombre: formData.nombre,
          tipo: formData.tipo,
          anio: formData.anio,
          periodo_inicio: formData.periodo_inicio,
          periodo_fin: formData.periodo_fin,
          notas: formData.notas || null,
          estado: 'borrador',
          empresa_id: usuario?.empresa_id,
        })
        .select('id, nombre, tipo, anio, periodo_inicio, periodo_fin, estado, notas, created_at')
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
    tipo: tipoLabels[p.tipo] ?? p.tipo,
    anio: p.anio,
    periodo: `${p.periodo_inicio} - ${p.periodo_fin}`,
    estado: estadoLabels[p.estado],
    fecha_creacion: formatDate(p.created_at),
  }))

  const exportColumns = [
    { header: 'Nombre', key: 'nombre' },
    { header: 'Tipo', key: 'tipo' },
    { header: 'Año', key: 'anio' },
    { header: 'Periodo', key: 'periodo' },
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
            <DialogContent className="bg-[#111827] border-zinc-800 sm:max-w-[560px]">
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

                {/* Tipo + Año */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Tipo</Label>
                    <Select onValueChange={(v) => setValue('tipo', v)}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operativo">Operativo</SelectItem>
                        <SelectItem value="ventas">Ventas</SelectItem>
                        <SelectItem value="proyeccion">Proyección</SelectItem>
                        <SelectItem value="inversion">Inversión</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.tipo && (
                      <p className="text-xs text-red-400">{errors.tipo.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anio" className="text-zinc-300">
                      Año
                    </Label>
                    <Input
                      id="anio"
                      type="number"
                      placeholder="2026"
                      className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono placeholder:text-zinc-600"
                      {...register('anio', { valueAsNumber: true })}
                    />
                    {errors.anio && (
                      <p className="text-xs text-red-400">{errors.anio.message}</p>
                    )}
                  </div>
                </div>

                {/* Periodo inicio + fin */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="periodo_inicio" className="text-zinc-300">
                      Periodo Inicio
                    </Label>
                    <Input
                      id="periodo_inicio"
                      type="date"
                      className="bg-zinc-900 border-zinc-700 text-zinc-100"
                      {...register('periodo_inicio')}
                    />
                    {errors.periodo_inicio && (
                      <p className="text-xs text-red-400">{errors.periodo_inicio.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodo_fin" className="text-zinc-300">
                      Periodo Fin
                    </Label>
                    <Input
                      id="periodo_fin"
                      type="date"
                      className="bg-zinc-900 border-zinc-700 text-zinc-100"
                      {...register('periodo_fin')}
                    />
                    {errors.periodo_fin && (
                      <p className="text-xs text-red-400">{errors.periodo_fin.message}</p>
                    )}
                  </div>
                </div>

                {/* Notas */}
                <div className="space-y-2">
                  <Label htmlFor="notas" className="text-zinc-300">
                    Notas <span className="text-zinc-600">(opcional)</span>
                  </Label>
                  <Textarea
                    id="notas"
                    rows={3}
                    placeholder="Observaciones del presupuesto..."
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 resize-none"
                    {...register('notas')}
                  />
                  {errors.notas && (
                    <p className="text-xs text-red-400">{errors.notas.message}</p>
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
