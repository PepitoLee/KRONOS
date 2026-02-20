'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { DataTable } from '@/components/tables/DataTable'
import { ExportButton } from '@/components/import-export/ExportButton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate, getCurrentPeriod } from '@/lib/utils/dates'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Loader2, GitCompare, CheckCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const conciliacionSchema = z.object({
  cuenta_bancaria_id: z.string().min(1, 'Seleccione cuenta'),
  periodo: z.string().min(1, 'Requerido'),
  saldo_banco: z.coerce.number(),
  saldo_libro: z.coerce.number(),
  notas: z.string().optional(),
})

type ConciliacionForm = z.infer<typeof conciliacionSchema>

interface Conciliacion {
  id: string
  periodo: string
  saldo_banco: number
  saldo_libro: number
  diferencia: number
  estado: string
  notas: string | null
  cuenta_bancaria: { banco: string; numero_cuenta: string } | null
}

interface CuentaBancaria {
  id: string
  banco: string
  numero_cuenta: string
  moneda: string
}

export default function ConciliacionesPage() {
  const [conciliaciones, setConciliaciones] = useState<Conciliacion[]>([])
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const form = useForm<ConciliacionForm>({
    resolver: zodResolver(conciliacionSchema) as any,
    defaultValues: { periodo: getCurrentPeriod() },
  })

  async function loadData() {
    const [{ data: conc }, { data: ctas }] = await Promise.all([
      supabase
        .from('conciliaciones_bancarias')
        .select('id, periodo, saldo_banco, saldo_libro, diferencia, estado, notas, cuenta_bancaria:cuentas_bancarias(banco, numero_cuenta)')
        .order('periodo', { ascending: false }),
      supabase.from('cuentas_bancarias').select('id, banco, numero_cuenta, moneda'),
    ])
    setConciliaciones((conc as unknown as Conciliacion[]) ?? [])
    setCuentas((ctas as CuentaBancaria[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function onSubmit(values: ConciliacionForm) {
    setSaving(true)
    try {
      const userRes = await supabase.auth.getUser()
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', userRes.data.user?.id)
        .single()

      const diferencia = values.saldo_banco - values.saldo_libro

      const { error } = await supabase.from('conciliaciones_bancarias').insert({
        ...values,
        empresa_id: usuario?.empresa_id,
        diferencia,
        estado: Math.abs(diferencia) < 0.01 ? 'conciliado' : 'pendiente',
      })

      if (error) throw error

      toast.success('Conciliación registrada')
      setDialogOpen(false)
      form.reset({ periodo: getCurrentPeriod() })
      loadData()
    } catch (error) {
      toast.error('Error al registrar', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnDef<Conciliacion>[] = [
    {
      accessorKey: 'periodo',
      header: 'Período',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.periodo}</span>,
    },
    {
      id: 'cuenta',
      header: 'Cuenta Bancaria',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.cuenta_bancaria
            ? `${row.original.cuenta_bancaria.banco} - ${row.original.cuenta_bancaria.numero_cuenta}`
            : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'saldo_banco',
      header: 'Saldo Banco',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-blue-400">{formatCurrency(row.original.saldo_banco)}</span>
      ),
    },
    {
      accessorKey: 'saldo_libro',
      header: 'Saldo Libros',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-zinc-300">{formatCurrency(row.original.saldo_libro)}</span>
      ),
    },
    {
      accessorKey: 'diferencia',
      header: 'Diferencia',
      cell: ({ row }) => {
        const dif = row.original.diferencia
        const isZero = Math.abs(dif) < 0.01
        return (
          <span className={`font-mono text-sm font-semibold ${isZero ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(dif)}
          </span>
        )
      },
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => {
        const isConciliado = row.original.estado === 'conciliado'
        return (
          <div className="flex items-center gap-1">
            {isConciliado ? (
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isConciliado
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {row.original.estado}
            </span>
          </div>
        )
      },
    },
  ]

  // Summary cards
  const totalConciliadas = conciliaciones.filter((c) => c.estado === 'conciliado').length
  const totalPendientes = conciliaciones.filter((c) => c.estado === 'pendiente').length
  const diferenciaTotal = conciliaciones.reduce((s, c) => s + Math.abs(c.diferencia), 0)

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <GitCompare className="h-6 w-6 text-blue-400" />
            Conciliaciones Bancarias
          </h2>
          <p className="text-sm text-zinc-500">Comparación saldos banco vs libros contables</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={conciliaciones as unknown as Record<string, unknown>[]}
            filename="conciliaciones"
            title="Conciliaciones Bancarias"
            columns={[
              { header: 'Período', key: 'periodo' },
              { header: 'Saldo Banco', key: 'saldo_banco' },
              { header: 'Saldo Libros', key: 'saldo_libro' },
              { header: 'Diferencia', key: 'diferencia' },
              { header: 'Estado', key: 'estado' },
            ]}
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Conciliación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Conciliación</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Cuenta Bancaria</Label>
                  <Select onValueChange={(v) => form.setValue('cuenta_bancaria_id', v)}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder="Seleccionar cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuentas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.banco} - {c.numero_cuenta} ({c.moneda})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Input type="month" {...form.register('periodo')} className="bg-zinc-900 border-zinc-800 font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Saldo según Banco (S/)</Label>
                    <Input type="number" step="0.01" {...form.register('saldo_banco')} className="bg-zinc-900 border-zinc-800 font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label>Saldo según Libros (S/)</Label>
                    <Input type="number" step="0.01" {...form.register('saldo_libro')} className="bg-zinc-900 border-zinc-800 font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <Textarea {...form.register('notas')} className="bg-zinc-900 border-zinc-800" placeholder="Notas adicionales..." />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-700">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
          <p className="text-xs text-zinc-500">Conciliadas</p>
          <p className="mt-1 text-2xl font-bold font-mono text-emerald-400">{totalConciliadas}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
          <p className="text-xs text-zinc-500">Pendientes</p>
          <p className="mt-1 text-2xl font-bold font-mono text-amber-400">{totalPendientes}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
          <p className="text-xs text-zinc-500">Diferencia Total Acumulada</p>
          <p className="mt-1 text-2xl font-bold font-mono text-red-400">{formatCurrency(diferenciaTotal)}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800/50" />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={conciliaciones} searchPlaceholder="Buscar conciliación..." />
      )}
    </div>
  )
}
