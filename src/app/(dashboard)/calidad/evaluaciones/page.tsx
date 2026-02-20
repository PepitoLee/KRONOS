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
import { Plus, Loader2, ClipboardCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const evaluacionSchema = z.object({
  area: z.string().min(1, 'Requerido'),
  tipo: z.string().min(1, 'Requerido'),
  fecha: z.string().min(1, 'Requerido'),
  puntaje_obtenido: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  puntaje_maximo: z.coerce.number().min(1, 'Debe ser mayor a 0'),
  resultado: z.string().min(1, 'Requerido'),
  hallazgos: z.string().optional(),
  acciones_correctivas: z.string().optional(),
  fecha_seguimiento: z.string().optional(),
})

type EvaluacionForm = z.infer<typeof evaluacionSchema>

interface Evaluacion {
  id: string
  empresa_id: string
  fecha: string
  tipo: string
  area: string
  evaluador_id: string | null
  puntaje_obtenido: number
  puntaje_maximo: number
  porcentaje: number
  resultado: string
  hallazgos: string | null
  acciones_correctivas: string | null
  fecha_seguimiento: string | null
  estado: string
  created_at: string
}

const resultadoConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  excelente: { label: 'Excelente', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  satisfactorio: { label: 'Satisfactorio', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  necesita_mejora: { label: 'Necesita Mejora', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
}

export default function EvaluacionesPage() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<EvaluacionForm>({ resolver: zodResolver(evaluacionSchema) as any })

  async function loadData() {
    const { data } = await supabase
      .from('evaluaciones_calidad')
      .select('id, empresa_id, fecha, tipo, area, evaluador_id, puntaje_obtenido, puntaje_maximo, porcentaje, resultado, hallazgos, acciones_correctivas, fecha_seguimiento, estado, created_at')
      .order('fecha', { ascending: false })
    setEvaluaciones((data as Evaluacion[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function onSubmit(values: EvaluacionForm) {
    setSaving(true)
    try {
      const userRes = await supabase.auth.getUser()
      const { data: usuario } = await supabase.from('usuarios').select('empresa_id').eq('id', userRes.data.user?.id).single()
      const porcentaje = values.puntaje_maximo > 0 ? (values.puntaje_obtenido / values.puntaje_maximo) * 100 : 0
      const insertData = {
        empresa_id: usuario?.empresa_id,
        area: values.area,
        tipo: values.tipo,
        fecha: values.fecha,
        puntaje_obtenido: values.puntaje_obtenido,
        puntaje_maximo: values.puntaje_maximo,
        porcentaje: Math.round(porcentaje * 100) / 100,
        resultado: values.resultado,
        hallazgos: values.hallazgos || null,
        acciones_correctivas: values.acciones_correctivas || null,
        fecha_seguimiento: values.fecha_seguimiento || null,
        estado: 'completada',
      }
      const { error } = await supabase.from('evaluaciones_calidad').insert(insertData)
      if (error) throw error
      toast.success('Evaluacion registrada')
      setDialogOpen(false)
      form.reset()
      loadData()
    } catch (error) {
      toast.error('Error', { description: error instanceof Error ? error.message : 'Error desconocido' })
    } finally { setSaving(false) }
  }

  const promedio = evaluaciones.length > 0 ? evaluaciones.reduce((s, e) => s + (e.porcentaje ?? 0), 0) / evaluaciones.length : 0
  const excelentes = evaluaciones.filter((e) => e.resultado === 'excelente').length
  const necesitaMejora = evaluaciones.filter((e) => e.resultado === 'necesita_mejora').length

  const columns: ColumnDef<Evaluacion>[] = [
    { accessorKey: 'fecha', header: 'Fecha', cell: ({ row }) => formatDate(row.original.fecha) },
    { accessorKey: 'area', header: 'Area' },
    {
      accessorKey: 'tipo', header: 'Tipo',
      cell: ({ row }) => {
        const labels: Record<string, string> = { proceso: 'Proceso', producto: 'Producto', servicio: 'Servicio' }
        return <span className="text-sm">{labels[row.original.tipo] ?? row.original.tipo}</span>
      },
    },
    {
      accessorKey: 'porcentaje', header: 'Porcentaje',
      cell: ({ row }) => {
        const p = row.original.porcentaje ?? 0
        const color = p >= 90 ? 'text-emerald-400' : p >= 70 ? 'text-blue-400' : p >= 60 ? 'text-amber-400' : 'text-red-400'
        return <span className={`font-mono font-semibold ${color}`}>{p.toFixed(1)}%</span>
      },
    },
    {
      accessorKey: 'resultado', header: 'Resultado',
      cell: ({ row }) => {
        const cfg = resultadoConfig[row.original.resultado]
        if (!cfg) return <span className="text-sm text-zinc-400">{row.original.resultado}</span>
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            {cfg.label}
          </span>
        )
      },
    },
    {
      accessorKey: 'estado', header: 'Estado',
      cell: ({ row }) => {
        const estado = row.original.estado
        const isCompletada = estado === 'completada'
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${isCompletada ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-400 bg-amber-500/10 border-amber-500/30'}`}>
            {isCompletada ? 'Completada' : 'En Seguimiento'}
          </span>
        )
      },
    },
    { accessorKey: 'hallazgos', header: 'Hallazgos', cell: ({ row }) => <span className="text-sm text-zinc-400 max-w-[250px] truncate block">{row.original.hallazgos ?? '-'}</span> },
  ]

  return (
    <div className="space-y-6">
      <BreadcrumbNav />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100"><ClipboardCheck className="h-6 w-6 text-blue-400" /> Evaluaciones de Calidad</h2>
          <p className="text-sm text-zinc-500">Evaluaciones de procesos, productos y servicios</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={evaluaciones as unknown as Record<string, unknown>[]} filename="evaluaciones" title="Evaluaciones de Calidad"
            columns={[
              { header: 'Fecha', key: 'fecha' },
              { header: 'Area', key: 'area' },
              { header: 'Tipo', key: 'tipo' },
              { header: 'Puntaje Obtenido', key: 'puntaje_obtenido' },
              { header: 'Puntaje Maximo', key: 'puntaje_maximo' },
              { header: 'Porcentaje', key: 'porcentaje' },
              { header: 'Resultado', key: 'resultado' },
              { header: 'Hallazgos', key: 'hallazgos' },
              { header: 'Acciones Correctivas', key: 'acciones_correctivas' },
              { header: 'Estado', key: 'estado' },
            ]} />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" />Nueva Evaluacion</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Evaluacion</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Area</Label><Input {...form.register('area')} placeholder="Ej: Cocina, Almacen" className="bg-zinc-900 border-zinc-800" /></div>
                  <div className="space-y-2"><Label>Tipo</Label>
                    <Select onValueChange={(v) => form.setValue('tipo', v)}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proceso">Proceso</SelectItem>
                        <SelectItem value="producto">Producto</SelectItem>
                        <SelectItem value="servicio">Servicio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Fecha</Label><Input type="date" {...form.register('fecha')} className="bg-zinc-900 border-zinc-800" /></div>
                  <div className="space-y-2"><Label>Resultado</Label>
                    <Select onValueChange={(v) => form.setValue('resultado', v)}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excelente">Excelente</SelectItem>
                        <SelectItem value="satisfactorio">Satisfactorio</SelectItem>
                        <SelectItem value="necesita_mejora">Necesita Mejora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Puntaje Obtenido</Label><Input type="number" min={0} step="0.01" {...form.register('puntaje_obtenido')} className="bg-zinc-900 border-zinc-800 font-mono" /></div>
                  <div className="space-y-2"><Label>Puntaje Maximo</Label><Input type="number" min={1} step="0.01" {...form.register('puntaje_maximo')} className="bg-zinc-900 border-zinc-800 font-mono" /></div>
                </div>
                <div className="space-y-2"><Label>Hallazgos</Label><Textarea {...form.register('hallazgos')} placeholder="Describir hallazgos encontrados..." className="bg-zinc-900 border-zinc-800" /></div>
                <div className="space-y-2"><Label>Acciones Correctivas</Label><Textarea {...form.register('acciones_correctivas')} placeholder="Acciones a tomar..." className="bg-zinc-900 border-zinc-800" /></div>
                <div className="space-y-2"><Label>Fecha de Seguimiento</Label><Input type="date" {...form.register('fecha_seguimiento')} className="bg-zinc-900 border-zinc-800" /></div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-700">Cancelar</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Registrar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
          <p className="text-xs text-zinc-500">Promedio General</p>
          <p className={`mt-1 text-2xl font-bold font-mono ${promedio >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{promedio.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs text-zinc-500">Excelentes</p>
          <p className="mt-1 text-2xl font-bold font-mono text-emerald-400">{excelentes}</p>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-xs text-zinc-500">Necesitan Mejora</p>
          <p className="mt-1 text-2xl font-bold font-mono text-red-400">{necesitaMejora}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800/50" />))}</div>
      ) : (
        <DataTable columns={columns} data={evaluaciones} searchPlaceholder="Buscar evaluacion..." />
      )}
    </div>
  )
}
