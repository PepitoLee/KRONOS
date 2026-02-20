'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DataTable } from '@/components/tables/DataTable'
import { ExportButton } from '@/components/import-export/ExportButton'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { formatCurrency } from '@/lib/utils/currency'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Plus, Loader2, Building2, Search, Filter } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { z } from 'zod'
import Link from 'next/link'

interface Proveedor {
  id: string
  ruc: string
  razon_social: string
  nombre_comercial: string | null
  rubro: string | null
  contacto_nombre: string | null
  contacto_telefono: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  condicion_pago: string
  activo: boolean
  created_at: string
}

const condicionLabels: Record<string, string> = {
  contado: 'Contado',
  credito_15: 'Crédito 15 días',
  credito_30: 'Crédito 30 días',
  credito_60: 'Crédito 60 días',
}

const proveedorSchema = z.object({
  ruc: z
    .string()
    .length(11, 'El RUC debe tener exactamente 11 dígitos')
    .regex(/^\d{11}$/, 'El RUC solo debe contener dígitos'),
  razon_social: z.string().min(3, 'La razón social debe tener al menos 3 caracteres'),
  rubro: z.string().optional(),
  contacto_nombre: z.string().optional(),
  telefono: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{6,15}$/.test(val), {
      message: 'Teléfono inválido',
    }),
  email: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Email inválido',
    }),
  direccion: z.string().optional(),
  condicion_pago: z.enum(['contado', 'credito_15', 'credito_30', 'credito_60'], {
    error: 'Seleccione la condición de pago',
  }),
})

type ProveedorFormData = z.infer<typeof proveedorSchema>

const columns: ColumnDef<Proveedor, unknown>[] = [
  {
    accessorKey: 'ruc',
    header: 'RUC',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-zinc-200">
        {row.getValue('ruc') as string}
      </span>
    ),
  },
  {
    accessorKey: 'razon_social',
    header: 'Razón Social',
    cell: ({ row }) => (
      <Link
        href={`/proveedores/${row.original.id}`}
        className="text-sm text-zinc-200 hover:text-emerald-400 transition-colors max-w-[250px] truncate block"
      >
        {row.getValue('razon_social') as string}
      </Link>
    ),
  },
  {
    accessorKey: 'rubro',
    header: 'Rubro',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-400">
        {row.original.rubro || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'contacto_nombre',
    header: 'Contacto',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-400">
        {row.original.contacto_nombre || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'telefono',
    header: 'Teléfono',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-400 font-mono">
        {(row.getValue('telefono') as string) || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-400 max-w-[180px] truncate block">
        {(row.getValue('email') as string) || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'activo',
    header: 'Estado',
    cell: ({ row }) => {
      const activo = row.original.activo
      return (
        <Badge className={`${activo ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20'} border text-xs font-medium`}>
          {activo ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
  },
]

const initialFormState: ProveedorFormData = {
  ruc: '',
  razon_social: '',
  rubro: '',
  contacto_nombre: '',
  telefono: '',
  email: '',
  direccion: '',
  condicion_pago: 'contado',
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<ProveedorFormData>(initialFormState)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const supabase = createClient()

  useEffect(() => {
    fetchProveedores()
  }, [])

  async function fetchProveedores() {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .order('razon_social', { ascending: true })

      if (error) {
        console.error('Error fetching proveedores:', error)
        toast.error('Error al cargar proveedores')
        return
      }

      setProveedores(data ?? [])
    } finally {
      setLoading(false)
    }
  }

  function updateField(field: keyof ProveedorFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormErrors({})

    const result = proveedorSchema.safeParse(formData)
    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message
        }
      })
      setFormErrors(errors)
      return
    }

    setSaving(true)
    try {
      const insertData = {
        ruc: result.data.ruc,
        razon_social: result.data.razon_social,
        rubro: result.data.rubro || null,
        contacto_nombre: result.data.contacto_nombre || null,
        telefono: result.data.telefono || null,
        email: result.data.email || null,
        direccion: result.data.direccion || null,
        condicion_pago: result.data.condicion_pago,
        activo: true,
      }

      const { error } = await supabase.from('proveedores').insert(insertData)

      if (error) {
        if (error.code === '23505') {
          toast.error('Ya existe un proveedor con ese RUC')
        } else {
          toast.error('Error al crear proveedor')
        }
        console.error('Insert error:', error)
        return
      }

      toast.success('Proveedor creado exitosamente')
      setDialogOpen(false)
      setFormData(initialFormState)
      setFormErrors({})
      setLoading(true)
      fetchProveedores()
    } finally {
      setSaving(false)
    }
  }

  const filteredProveedores = useMemo(() => {
    let result = proveedores

    if (filterTipo !== 'todos') {
      result = result.filter((p) => p.rubro === filterTipo)
    }

    if (filterEstado !== 'todos') {
      result = result.filter((p) => filterEstado === 'activo' ? p.activo : !p.activo)
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.razon_social.toLowerCase().includes(term) ||
          p.ruc.includes(term) ||
          (p.contacto_nombre && p.contacto_nombre.toLowerCase().includes(term))
      )
    }

    return result
  }, [proveedores, filterTipo, filterEstado, searchTerm])

  const rubros = [...new Set(proveedores.map((p) => p.rubro).filter(Boolean))]

  const exportData = filteredProveedores.map((p) => ({
    ruc: p.ruc,
    razon_social: p.razon_social,
    rubro: p.rubro || '',
    contacto: p.contacto_nombre || '',
    telefono: p.telefono || '',
    email: p.email || '',
    condicion_pago: condicionLabels[p.condicion_pago] || p.condicion_pago,
    estado: p.activo ? 'Activo' : 'Inactivo',
  }))

  const exportColumns = [
    { header: 'RUC', key: 'ruc' },
    { header: 'Razón Social', key: 'razon_social' },
    { header: 'Rubro', key: 'rubro' },
    { header: 'Contacto', key: 'contacto' },
    { header: 'Teléfono', key: 'telefono' },
    { header: 'Email', key: 'email' },
    { header: 'Condición de Pago', key: 'condicion_pago' },
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
              <Skeleton className="h-5 w-28 bg-zinc-800/50" />
              <Skeleton className="h-5 w-48 bg-zinc-800/50" />
              <Skeleton className="h-5 w-20 bg-zinc-800/50" />
              <Skeleton className="h-5 w-32 bg-zinc-800/50" />
              <Skeleton className="h-5 w-24 bg-zinc-800/50" />
              <Skeleton className="h-5 w-36 bg-zinc-800/50" />
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
            <Building2 className="h-7 w-7 text-emerald-400" />
            Directorio de Proveedores
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Gestiona tus proveedores de bienes y servicios
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={exportData}
            filename="proveedores"
            columns={exportColumns}
            title="Directorio de Proveedores"
          />
          <Link href="/proveedores/pedidos">
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Pedidos
            </Button>
          </Link>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proveedor
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111827] border-zinc-800 text-zinc-100 sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Registrar Nuevo Proveedor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                {/* RUC */}
                <div className="space-y-1.5">
                  <Label htmlFor="ruc" className="text-zinc-300">
                    RUC <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="ruc"
                    value={formData.ruc}
                    onChange={(e) => updateField('ruc', e.target.value)}
                    placeholder="20123456789"
                    maxLength={11}
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono placeholder:text-zinc-600"
                  />
                  {formErrors.ruc && (
                    <p className="text-xs text-red-400">{formErrors.ruc}</p>
                  )}
                </div>

                {/* Razón Social */}
                <div className="space-y-1.5">
                  <Label htmlFor="razon_social" className="text-zinc-300">
                    Razón Social <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="razon_social"
                    value={formData.razon_social}
                    onChange={(e) => updateField('razon_social', e.target.value)}
                    placeholder="Empresa S.A.C."
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                  />
                  {formErrors.razon_social && (
                    <p className="text-xs text-red-400">{formErrors.razon_social}</p>
                  )}
                </div>

                {/* Rubro y Condición de Pago */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-zinc-300">Rubro</Label>
                    <Input
                      value={formData.rubro}
                      onChange={(e) => updateField('rubro', e.target.value)}
                      placeholder="Ej: Suministros, Tecnología"
                      className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-zinc-300">
                      Condición de Pago <span className="text-red-400">*</span>
                    </Label>
                    <Select
                      value={formData.condicion_pago}
                      onValueChange={(v) => updateField('condicion_pago', v)}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contado">Contado</SelectItem>
                        <SelectItem value="credito_15">Crédito 15 días</SelectItem>
                        <SelectItem value="credito_30">Crédito 30 días</SelectItem>
                        <SelectItem value="credito_60">Crédito 60 días</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.condicion_pago && (
                      <p className="text-xs text-red-400">{formErrors.condicion_pago}</p>
                    )}
                  </div>
                </div>

                {/* Contacto */}
                <div className="space-y-1.5">
                  <Label htmlFor="contacto_nombre" className="text-zinc-300">
                    Persona de Contacto
                  </Label>
                  <Input
                    id="contacto_nombre"
                    value={formData.contacto_nombre}
                    onChange={(e) => updateField('contacto_nombre', e.target.value)}
                    placeholder="Juan Pérez"
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>

                {/* Teléfono y Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="telefono" className="text-zinc-300">
                      Teléfono
                    </Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => updateField('telefono', e.target.value)}
                      placeholder="01234567"
                      className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono placeholder:text-zinc-600"
                    />
                    {formErrors.telefono && (
                      <p className="text-xs text-red-400">{formErrors.telefono}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-zinc-300">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="proveedor@email.com"
                      className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-400">{formErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Dirección */}
                <div className="space-y-1.5">
                  <Label htmlFor="direccion" className="text-zinc-300">
                    Dirección
                  </Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => updateField('direccion', e.target.value)}
                    placeholder="Av. Principal 123, Lima"
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false)
                      setFormData(initialFormState)
                      setFormErrors({})
                    }}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar Proveedor'
                    )}
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

        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-700 text-zinc-300">
            <SelectValue placeholder="Rubro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los rubros</SelectItem>
            {rubros.map((r) => (
              <SelectItem key={r!} value={r!}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-700 text-zinc-300">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="inactivo">Inactivo</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar por RUC, razón social o contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500">
          Mostrando {filteredProveedores.length} de {proveedores.length} proveedores
        </span>
        {filterTipo !== 'todos' && (
          <Badge
            className="bg-zinc-800 text-zinc-300 border border-zinc-700 cursor-pointer hover:bg-zinc-700 text-xs"
            onClick={() => setFilterTipo('todos')}
          >
            {filterTipo} &times;
          </Badge>
        )}
        {filterEstado !== 'todos' && (
          <Badge
            className="bg-zinc-800 text-zinc-300 border border-zinc-700 cursor-pointer hover:bg-zinc-700 text-xs"
            onClick={() => setFilterEstado('todos')}
          >
            {filterEstado === 'activo' ? 'Activo' : 'Inactivo'} &times;
          </Badge>
        )}
        {searchTerm.trim() && (
          <Badge
            className="bg-zinc-800 text-zinc-300 border border-zinc-700 cursor-pointer hover:bg-zinc-700 text-xs"
            onClick={() => setSearchTerm('')}
          >
            &quot;{searchTerm}&quot; &times;
          </Badge>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredProveedores}
        searchPlaceholder="Buscar en resultados..."
        pageSize={15}
      />
    </div>
  )
}
