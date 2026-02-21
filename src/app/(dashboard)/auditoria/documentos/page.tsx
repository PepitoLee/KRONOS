'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { DataTable } from '@/components/tables/DataTable'
import { ExportButton } from '@/components/import-export/ExportButton'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/utils/dates'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Loader2, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const docSchema = z.object({
  tipo_documento: z.string().min(1, 'Requerido'),
  nombre_documento: z.string().min(1, 'Requerido'),
  numero_documento: z.string().min(1, 'Requerido'),
  fecha_emision: z.string().min(1, 'Requerido'),
  fecha_vencimiento: z.string().min(1, 'Requerido'),
  entidad_emisora: z.string().optional(),
  estado: z.string().min(1, 'Requerido'),
  notas: z.string().optional(),
})

type DocForm = z.infer<typeof docSchema>

interface DocAuditoria {
  id: string
  empresa_id: string
  tipo_documento: string
  nombre_documento: string
  numero_documento: string
  fecha_emision: string
  fecha_vencimiento: string
  entidad_emisora: string | null
  archivo_url: string | null
  estado: string
  dias_para_vencimiento: number | null
  responsable_id: string | null
  notas: string | null
  alerta_30_dias: boolean
  alerta_60_dias: boolean
  alerta_90_dias: boolean
  created_at: string
  updated_at: string
}

const TIPOS_LEGALES = ['licencia', 'permiso', 'contrato', 'poliza']

export default function DocumentosLegalesPage() {
  const [documentos, setDocumentos] = useState<DocAuditoria[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const form = useForm<DocForm>({ resolver: zodResolver(docSchema) })

  async function loadData() {
    const { data } = await supabase
      .from('auditoria_documentos')
      .select('*')
      .in('tipo_documento', TIPOS_LEGALES)
      .order('fecha_vencimiento', { ascending: true })
    setDocumentos((data as DocAuditoria[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function onSubmit(values: DocForm) {
    setSaving(true)
    try {
      const userRes = await supabase.auth.getUser()
      const { data: usuario } = await supabase.from('usuarios').select('empresa_id').eq('id', userRes.data.user?.id).single()
      const { error } = await supabase.from('auditoria_documentos').insert({ ...values, empresa_id: usuario?.empresa_id })
      if (error) throw error
      toast.success('Documento legal registrado')
      setDialogOpen(false)
      form.reset()
      loadData()
    } catch (error) {
      toast.error('Error', { description: error instanceof Error ? error.message : 'Error desconocido' })
    } finally { setSaving(false) }
  }

  const vigentes = documentos.filter((d) => d.estado === 'vigente').length
  const porVencer = documentos.filter((d) => d.estado === 'por_vencer').length
  const vencidos = documentos.filter((d) => d.estado === 'vencido').length

  const tipoLabels: Record<string, string> = {
    licencia: 'Licencia',
    permiso: 'Permiso',
    contrato: 'Contrato',
    poliza: 'Póliza',
  }

  const estadoColors: Record<string, string> = {
    vigente: 'bg-emerald-500/20 text-emerald-400',
    por_vencer: 'bg-amber-500/20 text-amber-400',
    vencido: 'bg-red-500/20 text-red-400',
  }

  const estadoLabels: Record<string, string> = {
    vigente: 'Vigente',
    por_vencer: 'Por Vencer',
    vencido: 'Vencido',
  }

  const columns: ColumnDef<DocAuditoria>[] = [
    {
      accessorKey: 'tipo_documento', header: 'Tipo',
      cell: ({ row }) => (
        <span className="text-sm">{tipoLabels[row.original.tipo_documento] ?? row.original.tipo_documento}</span>
      ),
    },
    {
      accessorKey: 'nombre_documento', header: 'Documento',
      cell: ({ row }) => <span className="text-sm text-zinc-300 max-w-[250px] truncate block">{row.original.nombre_documento}</span>,
    },
    {
      accessorKey: 'numero_documento', header: 'Número',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.numero_documento}</span>,
    },
    {
      accessorKey: 'entidad_emisora', header: 'Entidad Emisora',
      cell: ({ row }) => <span className="text-sm text-zinc-400">{row.original.entidad_emisora ?? '-'}</span>,
    },
    {
      accessorKey: 'fecha_emision', header: 'Emisión',
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.fecha_emision)}</span>,
    },
    {
      accessorKey: 'fecha_vencimiento', header: 'Vencimiento',
      cell: ({ row }) => {
        const dias = row.original.dias_para_vencimiento
        const color = dias !== null && dias < 0 ? 'text-red-400' : dias !== null && dias <= 30 ? 'text-amber-400' : 'text-zinc-300'
        return (
          <span className={`text-sm font-mono ${color}`}>
            {formatDate(row.original.fecha_vencimiento)}
          </span>
        )
      },
    },
    {
      accessorKey: 'dias_para_vencimiento', header: 'Días Restantes',
      cell: ({ row }) => {
        const dias = row.original.dias_para_vencimiento
        if (dias === null) return <span className="text-zinc-600">-</span>
        const color = dias < 0 ? 'text-red-400' : dias <= 30 ? 'text-amber-400' : dias <= 60 ? 'text-yellow-400' : 'text-emerald-400'
        return (
          <span className={`text-sm font-mono font-medium ${color}`}>
            {dias < 0 ? `${Math.abs(dias)}d vencido` : `${dias}d`}
          </span>
        )
      },
    },
    {
      accessorKey: 'estado', header: 'Estado',
      cell: ({ row }) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estadoColors[row.original.estado] ?? ''}`}>
          {estadoLabels[row.original.estado] ?? row.original.estado}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <BreadcrumbNav />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <FileText className="h-6 w-6 text-indigo-400" /> Documentos Legales
          </h2>
          <p className="text-sm text-zinc-500">Licencias, permisos, contratos y pólizas de la empresa</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={documentos as unknown as Record<string, unknown>[]}
            filename="documentos-legales"
            title="Documentos Legales"
            columns={[
              { header: 'Tipo', key: 'tipo_documento' },
              { header: 'Documento', key: 'nombre_documento' },
              { header: 'Número', key: 'numero_documento' },
              { header: 'Entidad Emisora', key: 'entidad_emisora' },
              { header: 'Emisión', key: 'fecha_emision' },
              { header: 'Vencimiento', key: 'fecha_vencimiento' },
              { header: 'Días Restantes', key: 'dias_para_vencimiento' },
              { header: 'Estado', key: 'estado' },
            ]}
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />Nuevo Documento Legal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Registrar Documento Legal</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo Documento</Label>
                    <Select onValueChange={(v) => form.setValue('tipo_documento', v)}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="licencia">Licencia</SelectItem>
                        <SelectItem value="permiso">Permiso</SelectItem>
                        <SelectItem value="contrato">Contrato</SelectItem>
                        <SelectItem value="poliza">Póliza</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Número Documento</Label><Input {...form.register('numero_documento')} className="bg-zinc-900 border-zinc-800" /></div>
                  <div className="space-y-2"><Label>Fecha Emisión</Label><Input type="date" {...form.register('fecha_emision')} className="bg-zinc-900 border-zinc-800" /></div>
                  <div className="space-y-2"><Label>Fecha Vencimiento</Label><Input type="date" {...form.register('fecha_vencimiento')} className="bg-zinc-900 border-zinc-800" /></div>
                  <div className="space-y-2 col-span-2"><Label>Entidad Emisora</Label><Input {...form.register('entidad_emisora')} className="bg-zinc-900 border-zinc-800" placeholder="Ej: SUNAT, Municipalidad, etc." /></div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select onValueChange={(v) => form.setValue('estado', v)}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vigente">Vigente</SelectItem>
                        <SelectItem value="por_vencer">Por Vencer</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Nombre Documento</Label><Input {...form.register('nombre_documento')} className="bg-zinc-900 border-zinc-800" placeholder="Nombre o descripción del documento" /></div>
                <div className="space-y-2"><Label>Notas</Label><Textarea {...form.register('notas')} className="bg-zinc-900 border-zinc-800" placeholder="Observaciones adicionales" /></div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-700">Cancelar</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Registrar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
          <div><p className="text-xs text-zinc-500">Vigentes</p><p className="text-2xl font-bold font-mono text-emerald-400">{vigentes}</p></div>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-amber-400" />
          <div><p className="text-xs text-zinc-500">Por Vencer</p><p className="text-2xl font-bold font-mono text-amber-400">{porVencer}</p></div>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-red-400" />
          <div><p className="text-xs text-zinc-500">Vencidos</p><p className="text-2xl font-bold font-mono text-red-400">{vencidos}</p></div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800/50" />))}</div>
      ) : (
        <DataTable columns={columns} data={documentos} searchPlaceholder="Buscar documento legal..." />
      )}
    </div>
  )
}
