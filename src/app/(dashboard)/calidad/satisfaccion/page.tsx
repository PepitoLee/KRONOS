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
import { Plus, Loader2, SmilePlus, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const encuestaSchema = z.object({
  cliente_nombre: z.string().min(1, 'Requerido'),
  fecha: z.string().min(1, 'Requerido'),
  calidad_producto: z.coerce.number().min(1).max(5),
  calidad_servicio: z.coerce.number().min(1).max(5),
  tiempo_atencion: z.coerce.number().min(1).max(5),
  relacion_precio_valor: z.coerce.number().min(1).max(5),
  recomendaria: z.coerce.number().min(1).max(5),
  comentarios: z.string().optional(),
  canal: z.string().min(1, 'Requerido'),
})

type EncuestaForm = z.infer<typeof encuestaSchema>

interface Encuesta {
  id: string
  fecha: string
  cliente_nombre: string
  calidad_producto: number
  calidad_servicio: number
  tiempo_atencion: number
  relacion_precio_valor: number
  recomendaria: number
  comentarios: string | null
  canal: string
}

function calcPromedio(e: Encuesta): number {
  return (e.calidad_producto + e.calidad_servicio + e.tiempo_atencion + e.relacion_precio_valor + e.recomendaria) / 5
}

export default function SatisfaccionPage() {
  const [encuestas, setEncuestas] = useState<Encuesta[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const form = useForm<EncuestaForm>({ resolver: zodResolver(encuestaSchema) as any })

  async function loadData() {
    const { data } = await supabase
      .from('encuestas_satisfaccion')
      .select('id, fecha, cliente_nombre, calidad_producto, calidad_servicio, tiempo_atencion, relacion_precio_valor, recomendaria, comentarios, canal')
      .order('fecha', { ascending: false })
    setEncuestas((data as Encuesta[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function onSubmit(values: EncuestaForm) {
    setSaving(true)
    try {
      const userRes = await supabase.auth.getUser()
      const { data: usuario } = await supabase.from('usuarios').select('empresa_id').eq('id', userRes.data.user?.id).single()
      const { error } = await supabase.from('encuestas_satisfaccion').insert({ ...values, empresa_id: usuario?.empresa_id })
      if (error) throw error
      toast.success('Encuesta registrada')
      setDialogOpen(false)
      form.reset()
      loadData()
    } catch (error) {
      toast.error('Error', { description: error instanceof Error ? error.message : 'Error desconocido' })
    } finally { setSaving(false) }
  }

  const promedioGeneral = encuestas.length > 0
    ? encuestas.reduce((s, e) => s + calcPromedio(e), 0) / encuestas.length
    : 0
  const promotores = encuestas.filter((e) => calcPromedio(e) >= 4).length
  const detractores = encuestas.filter((e) => calcPromedio(e) <= 2).length
  const nps = encuestas.length > 0 ? Math.round(((promotores - detractores) / encuestas.length) * 100) : 0

  function RatingStars({ value }: { value: number }) {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-3.5 w-3.5 ${i < value ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`} />
        ))}
      </div>
    )
  }

  const columns: ColumnDef<Encuesta>[] = [
    { accessorKey: 'fecha', header: 'Fecha', cell: ({ row }) => formatDate(row.original.fecha) },
    { accessorKey: 'cliente_nombre', header: 'Cliente' },
    {
      id: 'promedio', header: 'Promedio',
      cell: ({ row }) => {
        const avg = calcPromedio(row.original)
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-amber-400">{avg.toFixed(1)}</span>
            <RatingStars value={Math.round(avg)} />
          </div>
        )
      },
    },
    {
      id: 'calidad_producto', header: 'Producto',
      cell: ({ row }) => <RatingStars value={row.original.calidad_producto} />,
    },
    {
      id: 'calidad_servicio', header: 'Servicio',
      cell: ({ row }) => <RatingStars value={row.original.calidad_servicio} />,
    },
    {
      id: 'tiempo_atencion', header: 'Atencion',
      cell: ({ row }) => <RatingStars value={row.original.tiempo_atencion} />,
    },
    {
      id: 'relacion_precio_valor', header: 'Precio/Valor',
      cell: ({ row }) => <RatingStars value={row.original.relacion_precio_valor} />,
    },
    {
      id: 'recomendaria', header: 'Recomendaria',
      cell: ({ row }) => <RatingStars value={row.original.recomendaria} />,
    },
    { accessorKey: 'comentarios', header: 'Comentarios', cell: ({ row }) => <span className="text-sm text-zinc-400 max-w-[200px] truncate block">{row.original.comentarios ?? '-'}</span> },
    {
      accessorKey: 'canal', header: 'Canal',
      cell: ({ row }) => {
        const colors: Record<string, string> = { presencial: 'bg-blue-500/20 text-blue-400', web: 'bg-purple-500/20 text-purple-400', delivery: 'bg-amber-500/20 text-amber-400' }
        return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[row.original.canal] ?? 'bg-zinc-500/20 text-zinc-400'}`}>{row.original.canal}</span>
      },
    },
  ]

  const exportData = encuestas.map((e) => ({
    ...e,
    promedio: calcPromedio(e).toFixed(1),
  }))

  return (
    <div className="space-y-6">
      <BreadcrumbNav />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100"><SmilePlus className="h-6 w-6 text-emerald-400" /> Satisfaccion del Cliente</h2>
          <p className="text-sm text-zinc-500">Encuestas y feedback de clientes</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={exportData as unknown as Record<string, unknown>[]}
            filename="satisfaccion"
            title="Encuestas de Satisfaccion"
            columns={[
              { header: 'Fecha', key: 'fecha' },
              { header: 'Cliente', key: 'cliente_nombre' },
              { header: 'Calidad Producto', key: 'calidad_producto' },
              { header: 'Calidad Servicio', key: 'calidad_servicio' },
              { header: 'Tiempo Atencion', key: 'tiempo_atencion' },
              { header: 'Precio/Valor', key: 'relacion_precio_valor' },
              { header: 'Recomendaria', key: 'recomendaria' },
              { header: 'Promedio', key: 'promedio' },
              { header: 'Comentarios', key: 'comentarios' },
              { header: 'Canal', key: 'canal' },
            ]}
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="mr-2 h-4 w-4" />Nueva Encuesta</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Registrar Encuesta</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Cliente</Label><Input {...form.register('cliente_nombre')} className="bg-zinc-900 border-zinc-800" /></div>
                  <div className="space-y-2"><Label>Fecha</Label><Input type="date" {...form.register('fecha')} className="bg-zinc-900 border-zinc-800" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Canal</Label>
                    <Select onValueChange={(v) => form.setValue('canal', v)}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent><SelectItem value="presencial">Presencial</SelectItem><SelectItem value="web">Web</SelectItem><SelectItem value="delivery">Delivery</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-zinc-300">Puntuaciones (1-5)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-zinc-400">Calidad del Producto</Label><Input type="number" min={1} max={5} {...form.register('calidad_producto')} className="bg-zinc-900 border-zinc-800" /></div>
                    <div className="space-y-2"><Label className="text-zinc-400">Calidad del Servicio</Label><Input type="number" min={1} max={5} {...form.register('calidad_servicio')} className="bg-zinc-900 border-zinc-800" /></div>
                    <div className="space-y-2"><Label className="text-zinc-400">Tiempo de Atencion</Label><Input type="number" min={1} max={5} {...form.register('tiempo_atencion')} className="bg-zinc-900 border-zinc-800" /></div>
                    <div className="space-y-2"><Label className="text-zinc-400">Relacion Precio/Valor</Label><Input type="number" min={1} max={5} {...form.register('relacion_precio_valor')} className="bg-zinc-900 border-zinc-800" /></div>
                    <div className="space-y-2"><Label className="text-zinc-400">Recomendaria</Label><Input type="number" min={1} max={5} {...form.register('recomendaria')} className="bg-zinc-900 border-zinc-800" /></div>
                  </div>
                </div>
                <div className="space-y-2"><Label>Comentarios</Label><Textarea {...form.register('comentarios')} className="bg-zinc-900 border-zinc-800" /></div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-700">Cancelar</Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Registrar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
          <p className="text-xs text-zinc-500">Promedio Satisfaccion</p>
          <p className="mt-1 text-2xl font-bold font-mono text-amber-400">{promedioGeneral.toFixed(1)} / 5.0</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
          <p className="text-xs text-zinc-500">NPS Score</p>
          <p className={`mt-1 text-2xl font-bold font-mono ${nps >= 50 ? 'text-emerald-400' : nps >= 0 ? 'text-amber-400' : 'text-red-400'}`}>{nps}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
          <p className="text-xs text-zinc-500">Total Encuestas</p>
          <p className="mt-1 text-2xl font-bold font-mono text-zinc-100">{encuestas.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800/50" />))}</div>
      ) : (
        <DataTable columns={columns} data={encuestas} searchPlaceholder="Buscar encuesta..." />
      )}
    </div>
  )
}
