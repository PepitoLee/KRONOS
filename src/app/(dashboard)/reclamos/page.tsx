'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { DataTable } from '@/components/tables/DataTable'
import { ExportButton } from '@/components/import-export/ExportButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils/dates'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Loader2, MessageSquare, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'

const reclamoSchema = z.object({
  cliente_nombre: z.string().min(1, 'Cliente es requerido'),
  descripcion: z.string().min(10, 'Descripción debe tener al menos 10 caracteres'),
  prioridad: z.enum(['alta', 'media', 'baja']),
  tipo: z.enum(['producto', 'servicio', 'entrega', 'facturacion']),
})

type ReclamoForm = z.infer<typeof reclamoSchema>

interface Reclamo {
  id: string
  numero: string
  fecha: string
  cliente_nombre: string
  descripcion: string
  estado: 'pendiente' | 'en_proceso' | 'resuelto' | 'cerrado'
  prioridad: 'alta' | 'media' | 'baja'
  tipo: 'producto' | 'servicio' | 'entrega' | 'facturacion'
}

const estadoBadgeColors: Record<Reclamo['estado'], string> = {
  pendiente: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  en_proceso: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  resuelto: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  cerrado: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
}

const estadoLabels: Record<Reclamo['estado'], string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
}

const prioridadBadgeColors: Record<Reclamo['prioridad'], string> = {
  alta: 'bg-red-500/15 text-red-400 border-red-500/20',
  media: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  baja: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
}

const prioridadLabels: Record<Reclamo['prioridad'], string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

const tipoLabels: Record<Reclamo['tipo'], string> = {
  producto: 'Producto',
  servicio: 'Servicio',
  entrega: 'Entrega',
  facturacion: 'Facturación',
}

const columns: ColumnDef<Reclamo, unknown>[] = [
  {
    accessorKey: 'numero',
    header: 'Número',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-zinc-200">{row.getValue('numero')}</span>
    ),
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-400">
        {formatDate(row.getValue('fecha') as string)}
      </span>
    ),
  },
  {
    accessorKey: 'cliente_nombre',
    header: 'Cliente',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-300 max-w-[200px] truncate block">
        {row.getValue('cliente_nombre') as string}
      </span>
    ),
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-400">
        {tipoLabels[row.getValue('tipo') as Reclamo['tipo']]}
      </span>
    ),
  },
  {
    accessorKey: 'descripcion',
    header: 'Descripción',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-300 max-w-[250px] truncate block">
        {row.getValue('descripcion') as string}
      </span>
    ),
  },
  {
    accessorKey: 'prioridad',
    header: 'Prioridad',
    cell: ({ row }) => {
      const prioridad = row.getValue('prioridad') as Reclamo['prioridad']
      return (
        <Badge className={`${prioridadBadgeColors[prioridad]} border text-xs font-medium`}>
          {prioridadLabels[prioridad]}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.getValue('estado') as Reclamo['estado']
      return (
        <Badge className={`${estadoBadgeColors[estado]} border text-xs font-medium`}>
          {estadoLabels[estado]}
        </Badge>
      )
    },
  },
]

export default function ReclamosPage() {
  const [reclamos, setReclamos] = useState<Reclamo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [filterPrioridad, setFilterPrioridad] = useState<string>('todos')
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ReclamoForm>({
    resolver: zodResolver(reclamoSchema),
    defaultValues: {
      prioridad: 'media',
      tipo: 'producto',
    },
  })

  useEffect(() => {
    async function fetchReclamos() {
      try {
        const { data, error } = await supabase
          .from('reclamos')
          .select('id, numero, fecha, cliente_nombre, descripcion, estado, prioridad, tipo')
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

  const filteredReclamos = useMemo(() => {
    let result = reclamos

    if (filterEstado !== 'todos') {
      result = result.filter((r) => r.estado === filterEstado)
    }

    if (filterPrioridad !== 'todos') {
      result = result.filter((r) => r.prioridad === filterPrioridad)
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter(
        (r) =>
          r.cliente_nombre.toLowerCase().includes(term) ||
          r.descripcion.toLowerCase().includes(term) ||
          r.numero.toLowerCase().includes(term)
      )
    }

    return result
  }, [reclamos, filterEstado, filterPrioridad, searchTerm])

  async function onSubmit(data: ReclamoForm) {
    setSaving(true)
    try {
      const numero = `REC-${Date.now().toString().slice(-8)}`
      const { error } = await supabase.from('reclamos').insert({
        numero,
        fecha: new Date().toISOString(),
        cliente_nombre: data.cliente_nombre,
        descripcion: data.descripcion,
        prioridad: data.prioridad,
        tipo: data.tipo,
        estado: 'pendiente',
      })

      if (error) throw error

      toast.success('Reclamo registrado correctamente')
      setDialogOpen(false)
      reset()

      const { data: updated } = await supabase
        .from('reclamos')
        .select('id, numero, fecha, cliente_nombre, descripcion, estado, prioridad, tipo')
        .order('fecha', { ascending: false })
      setReclamos(updated ?? [])
    } catch (error) {
      console.error('Error saving reclamo:', error)
      toast.error('Error al registrar el reclamo')
    } finally {
      setSaving(false)
    }
  }

  const exportData = filteredReclamos.map((r) => ({
    numero: r.numero,
    fecha: formatDate(r.fecha),
    cliente_nombre: r.cliente_nombre,
    tipo: tipoLabels[r.tipo],
    descripcion: r.descripcion,
    prioridad: prioridadLabels[r.prioridad],
    estado: estadoLabels[r.estado],
  }))

  const exportColumns = [
    { header: 'Número', key: 'numero' },
    { header: 'Fecha', key: 'fecha' },
    { header: 'Cliente', key: 'cliente_nombre' },
    { header: 'Tipo', key: 'tipo' },
    { header: 'Descripción', key: 'descripcion' },
    { header: 'Prioridad', key: 'prioridad' },
    { header: 'Estado', key: 'estado' },
  ]

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
          <Skeleton className="h-9 w-64 bg-zinc-800/50" />
        </div>
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <div className="bg-zinc-900/50 p-3">
            <Skeleton className="h-4 w-full bg-zinc-800/50" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-t border-zinc-800 p-3">
              <Skeleton className="h-5 w-24 bg-zinc-800/50" />
              <Skeleton className="h-5 w-20 bg-zinc-800/50" />
              <Skeleton className="h-5 w-36 bg-zinc-800/50" />
              <Skeleton className="h-5 w-20 bg-zinc-800/50" />
              <Skeleton className="h-5 w-40 bg-zinc-800/50" />
              <Skeleton className="h-5 w-16 bg-zinc-800/50" />
              <Skeleton className="h-5 w-20 bg-zinc-800/50" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <MessageSquare className="h-7 w-7 text-amber-400" />
            Reclamos
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Gestión de reclamos y quejas de clientes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={exportData}
            filename="reclamos"
            columns={exportColumns}
            title="Reclamos"
          />
          <Link href="/reclamos/indicadores">
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Indicadores
            </Button>
          </Link>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 text-white hover:bg-amber-700">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Reclamo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111827] border-zinc-800 sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Registrar Nuevo Reclamo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Cliente</Label>
                  <Input
                    {...register('cliente_nombre')}
                    placeholder="Nombre del cliente"
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-600"
                  />
                  {errors.cliente_nombre && (
                    <p className="text-xs text-red-400">{errors.cliente_nombre.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Tipo</Label>
                    <Select
                      defaultValue="producto"
                      onValueChange={(val) => setValue('tipo', val as ReclamoForm['tipo'])}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="producto">Producto</SelectItem>
                        <SelectItem value="servicio">Servicio</SelectItem>
                        <SelectItem value="entrega">Entrega</SelectItem>
                        <SelectItem value="facturacion">Facturación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Prioridad</Label>
                    <Select
                      defaultValue="media"
                      onValueChange={(val) => setValue('prioridad', val as ReclamoForm['prioridad'])}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="baja">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Descripción</Label>
                  <Textarea
                    {...register('descripcion')}
                    placeholder="Descripción detallada del reclamo..."
                    rows={4}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-600"
                  />
                  {errors.descripcion && (
                    <p className="text-xs text-red-400">{errors.descripcion.message}</p>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="border-zinc-700 text-zinc-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-amber-600 text-white hover:bg-amber-700"
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar
                  </Button>
                </DialogFooter>
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
          <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-700 text-zinc-300">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_proceso">En Proceso</SelectItem>
            <SelectItem value="resuelto">Resuelto</SelectItem>
            <SelectItem value="cerrado">Cerrado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
          <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-700 text-zinc-300">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las prioridades</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar por cliente, descripción o número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500">
          Mostrando {filteredReclamos.length} de {reclamos.length} reclamos
        </span>
        {filterEstado !== 'todos' && (
          <Badge
            className="bg-zinc-800 text-zinc-300 border border-zinc-700 cursor-pointer hover:bg-zinc-700 text-xs"
            onClick={() => setFilterEstado('todos')}
          >
            {estadoLabels[filterEstado as Reclamo['estado']]} &times;
          </Badge>
        )}
        {filterPrioridad !== 'todos' && (
          <Badge
            className="bg-zinc-800 text-zinc-300 border border-zinc-700 cursor-pointer hover:bg-zinc-700 text-xs"
            onClick={() => setFilterPrioridad('todos')}
          >
            {prioridadLabels[filterPrioridad as Reclamo['prioridad']]} &times;
          </Badge>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredReclamos}
        searchPlaceholder="Buscar en resultados..."
        pageSize={15}
      />
    </div>
  )
}
