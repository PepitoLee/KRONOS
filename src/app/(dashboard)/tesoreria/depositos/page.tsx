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
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Loader2, Banknote } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const depositoSchema = z.object({
  cuenta_bancaria_id: z.string().min(1, 'Seleccione cuenta'),
  fecha: z.string().min(1, 'Requerido'),
  monto: z.coerce.number().positive('Debe ser mayor a 0'),
  numero_operacion: z.string().min(1, 'Requerido'),
})

type DepositoForm = z.infer<typeof depositoSchema>

interface Deposito {
  id: string
  fecha: string
  monto: number
  numero_operacion: string
  estado: string
  cuenta_bancaria: { banco: string; numero_cuenta: string } | null
}

interface CuentaBancaria {
  id: string
  banco: string
  numero_cuenta: string
  moneda: string
}

export default function DepositosPage() {
  const [depositos, setDepositos] = useState<Deposito[]>([])
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const form = useForm<DepositoForm>({
    resolver: zodResolver(depositoSchema) as any,
  })

  async function loadData() {
    const [{ data: deps }, { data: ctas }] = await Promise.all([
      supabase
        .from('depositos')
        .select('id, fecha, monto, numero_operacion, estado, cuenta_bancaria:cuentas_bancarias(banco, numero_cuenta)')
        .order('fecha', { ascending: false }),
      supabase.from('cuentas_bancarias').select('id, banco, numero_cuenta, moneda'),
    ])
    setDepositos((deps as unknown as Deposito[]) ?? [])
    setCuentas((ctas as CuentaBancaria[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function onSubmit(values: DepositoForm) {
    setSaving(true)
    try {
      const userRes = await supabase.auth.getUser()
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', userRes.data.user?.id)
        .single()

      const { error } = await supabase.from('depositos').insert({
        ...values,
        empresa_id: usuario?.empresa_id,
        registrado_por: userRes.data.user?.id,
        estado: 'pendiente',
      })

      if (error) throw error

      toast.success('Depósito registrado')
      setDialogOpen(false)
      form.reset()
      loadData()
    } catch (error) {
      toast.error('Error al registrar', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnDef<Deposito>[] = [
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      cell: ({ row }) => formatDate(row.original.fecha),
    },
    {
      accessorKey: 'numero_operacion',
      header: 'Nro. Operación',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.numero_operacion}</span>,
    },
    {
      id: 'cuenta',
      header: 'Cuenta',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.cuenta_bancaria
            ? `${row.original.cuenta_bancaria.banco} - ${row.original.cuenta_bancaria.numero_cuenta}`
            : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'monto',
      header: 'Monto',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-emerald-400">
          {formatCurrency(row.original.monto)}
        </span>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => {
        const colors: Record<string, string> = {
          pendiente: 'bg-amber-500/20 text-amber-400',
          confirmado: 'bg-emerald-500/20 text-emerald-400',
        }
        return (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[row.original.estado] ?? ''}`}>
            {row.original.estado}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <Banknote className="h-6 w-6 text-emerald-400" />
            Depósitos
          </h2>
          <p className="text-sm text-zinc-500">Registro y control de depósitos bancarios</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={depositos as unknown as Record<string, unknown>[]}
            filename="depositos"
            title="Registro de Depósitos"
            columns={[
              { header: 'Fecha', key: 'fecha' },
              { header: 'Nro. Operación', key: 'numero_operacion' },
              { header: 'Monto', key: 'monto' },
              { header: 'Estado', key: 'estado' },
            ]}
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Depósito
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Depósito</DialogTitle>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input type="date" {...form.register('fecha')} className="bg-zinc-900 border-zinc-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Monto (S/)</Label>
                    <Input type="number" step="0.01" {...form.register('monto')} className="bg-zinc-900 border-zinc-800 font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nro. Operación</Label>
                  <Input {...form.register('numero_operacion')} placeholder="OP-00123" className="bg-zinc-900 border-zinc-800" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
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
        <DataTable columns={columns} data={depositos} searchPlaceholder="Buscar depósito..." />
      )}
    </div>
  )
}
