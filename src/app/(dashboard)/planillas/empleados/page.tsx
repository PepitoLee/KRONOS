'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { DataTable } from '@/components/tables/DataTable'
import { ExportButton } from '@/components/import-export/ExportButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const empleadoSchema = z.object({
  dni: z.string().length(8, 'DNI debe tener 8 dígitos'),
  nombres: z.string().min(1, 'Requerido'),
  apellidos: z.string().min(1, 'Requerido'),
  fecha_ingreso: z.string().min(1, 'Requerido'),
  cargo: z.string().min(1, 'Requerido'),
  area: z.string().min(1, 'Requerido'),
  tipo_contrato: z.string().min(1, 'Requerido'),
  regimen_laboral: z.string().min(1, 'Requerido'),
  sueldo_basico: z.coerce.number().positive('Debe ser mayor a 0'),
  asignacion_familiar: z.boolean().default(false),
  banco: z.string().optional(),
  numero_cuenta: z.string().optional(),
})

type EmpleadoForm = z.infer<typeof empleadoSchema>

interface Empleado {
  id: string
  dni: string
  nombres: string
  apellidos: string
  cargo: string
  area: string
  sueldo_basico: number
  estado: string
  fecha_ingreso: string
  tipo_contrato: string
  asignacion_familiar: boolean
}

const columns: ColumnDef<Empleado>[] = [
  {
    accessorKey: 'dni',
    header: 'DNI',
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.dni}</span>,
  },
  {
    id: 'nombre_completo',
    header: 'Nombre',
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.apellidos}, {row.original.nombres}
      </span>
    ),
  },
  { accessorKey: 'cargo', header: 'Cargo' },
  { accessorKey: 'area', header: 'Área' },
  {
    accessorKey: 'sueldo_basico',
    header: 'Sueldo Básico',
    cell: ({ row }) => (
      <span className="font-mono">{formatCurrency(row.original.sueldo_basico)}</span>
    ),
  },
  {
    accessorKey: 'fecha_ingreso',
    header: 'Ingreso',
    cell: ({ row }) => formatDate(row.original.fecha_ingreso),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const colors: Record<string, string> = {
        activo: 'bg-emerald-500/20 text-emerald-400',
        cesado: 'bg-red-500/20 text-red-400',
        vacaciones: 'bg-blue-500/20 text-blue-400',
        licencia: 'bg-amber-500/20 text-amber-400',
      }
      return (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[row.original.estado] ?? ''}`}>
          {row.original.estado}
        </span>
      )
    },
  },
]

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const form = useForm<EmpleadoForm>({
    resolver: zodResolver(empleadoSchema) as any,
    defaultValues: {
      asignacion_familiar: false,
    },
  })

  async function loadEmpleados() {
    const { data } = await supabase
      .from('empleados')
      .select('*')
      .order('apellidos')

    setEmpleados((data as Empleado[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadEmpleados()
  }, [])

  async function onSubmit(values: EmpleadoForm) {
    setSaving(true)
    try {
      const { error } = await supabase.from('empleados').insert({
        ...values,
        empresa_id: (await supabase.from('usuarios').select('empresa_id').eq('id', (await supabase.auth.getUser()).data.user?.id).single()).data?.empresa_id,
      })

      if (error) throw error

      toast.success('Empleado registrado exitosamente')
      setDialogOpen(false)
      form.reset()
      loadEmpleados()
    } catch (error) {
      toast.error('Error al registrar empleado', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Empleados</h2>
          <p className="text-sm text-zinc-500">Registro y gestión de personal</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={empleados as unknown as Record<string, unknown>[]}
            filename="empleados"
            title="Listado de Empleados"
            columns={[
              { header: 'DNI', key: 'dni' },
              { header: 'Nombres', key: 'nombres' },
              { header: 'Apellidos', key: 'apellidos' },
              { header: 'Cargo', key: 'cargo' },
              { header: 'Área', key: 'area' },
              { header: 'Sueldo', key: 'sueldo_basico' },
              { header: 'Estado', key: 'estado' },
            ]}
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo Empleado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Empleado</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>DNI</Label>
                    <Input
                      {...form.register('dni')}
                      maxLength={8}
                      placeholder="12345678"
                      className="bg-zinc-900 border-zinc-800"
                    />
                    {form.formState.errors.dni && (
                      <p className="text-xs text-red-400">{form.formState.errors.dni.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Nombres</Label>
                    <Input {...form.register('nombres')} placeholder="Juan Carlos" className="bg-zinc-900 border-zinc-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellidos</Label>
                    <Input {...form.register('apellidos')} placeholder="Pérez García" className="bg-zinc-900 border-zinc-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Ingreso</Label>
                    <Input type="date" {...form.register('fecha_ingreso')} className="bg-zinc-900 border-zinc-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input {...form.register('cargo')} placeholder="Contador" className="bg-zinc-900 border-zinc-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Área</Label>
                    <Input {...form.register('area')} placeholder="Administración" className="bg-zinc-900 border-zinc-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Contrato</Label>
                    <Select onValueChange={(v) => form.setValue('tipo_contrato', v)}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indefinido">Indefinido</SelectItem>
                        <SelectItem value="plazo_fijo">Plazo Fijo</SelectItem>
                        <SelectItem value="parcial">Parcial</SelectItem>
                        <SelectItem value="formativo">Formativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Régimen Laboral</Label>
                    <Select onValueChange={(v) => form.setValue('regimen_laboral', v)}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="mype">MYPE</SelectItem>
                        <SelectItem value="micro">Micro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sueldo Básico (S/)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register('sueldo_basico')}
                      placeholder="1500.00"
                      className="bg-zinc-900 border-zinc-800 font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      checked={form.watch('asignacion_familiar')}
                      onCheckedChange={(v) => form.setValue('asignacion_familiar', v)}
                    />
                    <Label>Asignación Familiar</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Banco (opcional)</Label>
                    <Input {...form.register('banco')} placeholder="BCP" className="bg-zinc-900 border-zinc-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>N° Cuenta (opcional)</Label>
                    <Input {...form.register('numero_cuenta')} placeholder="191-0000000-0-00" className="bg-zinc-900 border-zinc-800" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-700">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800/50" />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={empleados} searchPlaceholder="Buscar empleado..." />
      )}
    </div>
  )
}
