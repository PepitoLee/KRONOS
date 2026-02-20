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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Loader2, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const pedidoSchema = z.object({
  proveedor_id: z.string().min(1, 'Seleccione proveedor'),
  fecha: z.string().min(1, 'Requerido'),
  descripcion: z.string().min(1, 'Requerido'),
  total: z.coerce.number().positive('Debe ser mayor a 0'),
})

type PedidoForm = z.infer<typeof pedidoSchema>

interface Pedido {
  id: string
  numero: string
  fecha: string
  total: number
  estado: string
  descripcion: string | null
  proveedor: { razon_social: string } | null
}

interface Proveedor {
  id: string
  razon_social: string
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const form = useForm<PedidoForm>({ resolver: zodResolver(pedidoSchema) as any })

  async function loadData() {
    const [{ data: ped }, { data: prov }] = await Promise.all([
      supabase.from('pedidos').select('id, numero, fecha, total, estado, descripcion, proveedor:proveedores(razon_social)').order('fecha', { ascending: false }),
      supabase.from('proveedores').select('id, razon_social').eq('estado', 'activo'),
    ])
    setPedidos((ped as unknown as Pedido[]) ?? [])
    setProveedores((prov as Proveedor[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function onSubmit(values: PedidoForm) {
    setSaving(true)
    try {
      const userRes = await supabase.auth.getUser()
      const { data: usuario } = await supabase.from('usuarios').select('empresa_id').eq('id', userRes.data.user?.id).single()
      const count = pedidos.length + 1
      const { error } = await supabase.from('pedidos').insert({
        ...values,
        empresa_id: usuario?.empresa_id,
        numero: `PO-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`,
        estado: 'pendiente',
      })
      if (error) throw error
      toast.success('Pedido registrado')
      setDialogOpen(false)
      form.reset()
      loadData()
    } catch (error) {
      toast.error('Error', { description: error instanceof Error ? error.message : 'Error desconocido' })
    } finally { setSaving(false) }
  }

  const columns: ColumnDef<Pedido>[] = [
    { accessorKey: 'numero', header: 'Numero', cell: ({ row }) => <span className="font-mono text-sm">{row.original.numero}</span> },
    { id: 'proveedor', header: 'Proveedor', cell: ({ row }) => <span className="text-sm">{row.original.proveedor?.razon_social ?? '-'}</span> },
    { accessorKey: 'fecha', header: 'Fecha', cell: ({ row }) => formatDate(row.original.fecha) },
    { accessorKey: 'descripcion', header: 'Descripcion', cell: ({ row }) => <span className="text-sm text-zinc-400 max-w-[200px] truncate block">{row.original.descripcion ?? '-'}</span> },
    { accessorKey: 'total', header: 'Total', cell: ({ row }) => <span className="font-mono font-semibold text-emerald-400">{formatCurrency(row.original.total)}</span> },
    {
      accessorKey: 'estado', header: 'Estado',
      cell: ({ row }) => {
        const colors: Record<string, string> = { pendiente: 'bg-amber-500/20 text-amber-400', aprobado: 'bg-blue-500/20 text-blue-400', recibido: 'bg-emerald-500/20 text-emerald-400', cancelado: 'bg-red-500/20 text-red-400' }
        return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[row.original.estado] ?? ''}`}>{row.original.estado}</span>
      },
    },
  ]

  return (
    <div className="space-y-6">
      <BreadcrumbNav />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100"><ShoppingCart className="h-6 w-6 text-blue-400" /> Ordenes de Compra</h2>
          <p className="text-sm text-zinc-500">Gestion de pedidos a proveedores</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={pedidos as unknown as Record<string, unknown>[]} filename="pedidos" title="Ordenes de Compra"
            columns={[{ header: 'Numero', key: 'numero' }, { header: 'Fecha', key: 'fecha' }, { header: 'Total', key: 'total' }, { header: 'Estado', key: 'estado' }]} />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" />Nuevo Pedido</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Orden de Compra</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2"><Label>Proveedor</Label>
                  <Select onValueChange={(v) => form.setValue('proveedor_id', v)}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                    <SelectContent>{proveedores.map((p) => (<SelectItem key={p.id} value={p.id}>{p.razon_social}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Fecha</Label><Input type="date" {...form.register('fecha')} className="bg-zinc-900 border-zinc-800" /></div>
                  <div className="space-y-2"><Label>Total (S/)</Label><Input type="number" step="0.01" {...form.register('total')} className="bg-zinc-900 border-zinc-800 font-mono" /></div>
                </div>
                <div className="space-y-2"><Label>Descripcion</Label><Input {...form.register('descripcion')} placeholder="Descripcion del pedido" className="bg-zinc-900 border-zinc-800" /></div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-700">Cancelar</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Registrar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800/50" />))}</div>
      ) : (
        <DataTable columns={columns} data={pedidos} searchPlaceholder="Buscar pedido..." />
      )}
    </div>
  )
}
