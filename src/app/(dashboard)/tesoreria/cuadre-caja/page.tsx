'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { DataTable } from '@/components/tables/DataTable'
import { ExportButton } from '@/components/import-export/ExportButton'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate, formatDateTime } from '@/lib/utils/dates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ColumnDef } from '@tanstack/react-table'
import {
  ClipboardCheck,
  Plus,
  Calculator,
  AlertCircle,
  CheckCircle,
  MinusCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface CuadreCaja {
  id: string
  fecha: string
  turno: string
  saldo_inicial: number
  total_ingresos: number
  total_egresos: number
  saldo_sistema: number
  saldo_fisico: number
  diferencia: number
  observaciones: string | null
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  created_at: string
}

const columns: ColumnDef<CuadreCaja, unknown>[] = [
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-zinc-200">{formatDate(row.original.fecha)}</span>
    ),
  },
  {
    accessorKey: 'turno',
    header: 'Turno',
    cell: ({ row }) => {
      const labels: Record<string, string> = {
        manana: 'Manana',
        tarde: 'Tarde',
        noche: 'Noche',
        unico: 'Unico',
      }
      return (
        <Badge className="bg-zinc-500/15 text-zinc-300 border-zinc-500/20 border text-xs">
          {labels[row.original.turno] ?? row.original.turno}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'saldo_inicial',
    header: 'Saldo Inicial',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-zinc-300">
        {formatCurrency(row.original.saldo_inicial)}
      </span>
    ),
  },
  {
    accessorKey: 'total_ingresos',
    header: 'Ingresos',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-emerald-400">
        +{formatCurrency(row.original.total_ingresos)}
      </span>
    ),
  },
  {
    accessorKey: 'total_egresos',
    header: 'Egresos',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-red-400">
        -{formatCurrency(row.original.total_egresos)}
      </span>
    ),
  },
  {
    accessorKey: 'saldo_sistema',
    header: 'Saldo Sistema',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-blue-400">
        {formatCurrency(row.original.saldo_sistema)}
      </span>
    ),
  },
  {
    accessorKey: 'saldo_fisico',
    header: 'Saldo Fisico',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-zinc-200">
        {formatCurrency(row.original.saldo_fisico)}
      </span>
    ),
  },
  {
    accessorKey: 'diferencia',
    header: 'Diferencia',
    cell: ({ row }) => {
      const dif = row.original.diferencia
      return (
        <span
          className={`font-mono text-sm font-semibold ${
            dif === 0 ? 'text-emerald-400' : dif > 0 ? 'text-amber-400' : 'text-red-400'
          }`}
        >
          {dif > 0 ? '+' : ''}
          {formatCurrency(dif)}
        </span>
      )
    },
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const colors: Record<string, string> = {
        pendiente: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
        aprobado: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
        rechazado: 'bg-red-500/15 text-red-400 border-red-500/20',
      }
      const labels: Record<string, string> = {
        pendiente: 'Pendiente',
        aprobado: 'Aprobado',
        rechazado: 'Rechazado',
      }
      return (
        <Badge className={`${colors[row.original.estado] ?? ''} border text-xs`}>
          {labels[row.original.estado] ?? row.original.estado}
        </Badge>
      )
    },
  },
]

export default function CuadreCajaPage() {
  const [cuadres, setCuadres] = useState<CuadreCaja[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const supabase = createClient()

  // Form state
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [turno, setTurno] = useState('unico')
  const [saldoInicial, setSaldoInicial] = useState('')
  const [saldoFisico, setSaldoFisico] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Auto-calculated values
  const [totalIngresos, setTotalIngresos] = useState(0)
  const [totalEgresos, setTotalEgresos] = useState(0)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    async function fetchCuadres() {
      try {
        const { data, error } = await supabase
          .from('cuadres_caja')
          .select('*')
          .order('fecha', { ascending: false })

        if (error) {
          console.error('Error fetching cuadres:', error)
          return
        }

        setCuadres((data as CuadreCaja[]) ?? [])
      } finally {
        setLoading(false)
      }
    }

    fetchCuadres()
  }, [supabase])

  async function calcularMovimientos() {
    setCalculating(true)
    try {
      const { data: movimientos, error } = await supabase
        .from('movimientos_tesoreria')
        .select('tipo, monto')
        .eq('fecha', fecha)

      if (error) {
        console.error('Error fetching movimientos:', error)
        return
      }

      const movs = movimientos ?? []
      const ingresos = movs
        .filter((m) => m.tipo === 'ingreso')
        .reduce((sum, m) => sum + m.monto, 0)
      const egresos = movs
        .filter((m) => m.tipo === 'egreso')
        .reduce((sum, m) => sum + m.monto, 0)

      setTotalIngresos(Math.round(ingresos * 100) / 100)
      setTotalEgresos(Math.round(egresos * 100) / 100)
    } finally {
      setCalculating(false)
    }
  }

  useEffect(() => {
    if (fecha) {
      calcularMovimientos()
    }
  }, [fecha])

  const saldoInicialNum = parseFloat(saldoInicial) || 0
  const saldoFisicoNum = parseFloat(saldoFisico) || 0
  const saldoSistema = saldoInicialNum + totalIngresos - totalEgresos
  const diferencia = saldoFisicoNum - saldoSistema

  async function handleSubmit() {
    if (!saldoInicial || !saldoFisico) {
      toast.error('Complete todos los campos requeridos')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('cuadres_caja').insert({
        fecha,
        turno,
        saldo_inicial: saldoInicialNum,
        total_ingresos: totalIngresos,
        total_egresos: totalEgresos,
        saldo_sistema: Math.round(saldoSistema * 100) / 100,
        saldo_fisico: saldoFisicoNum,
        diferencia: Math.round(diferencia * 100) / 100,
        observaciones: observaciones || null,
        estado: 'pendiente',
      })

      if (error) {
        toast.error('Error al guardar el cuadre de caja')
        console.error(error)
        return
      }

      toast.success('Cuadre de caja registrado correctamente')
      setDialogOpen(false)
      resetForm()

      const { data: updated } = await supabase
        .from('cuadres_caja')
        .select('*')
        .order('fecha', { ascending: false })

      setCuadres((updated as CuadreCaja[]) ?? [])
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setFecha(new Date().toISOString().split('T')[0])
    setTurno('unico')
    setSaldoInicial('')
    setSaldoFisico('')
    setObservaciones('')
    setTotalIngresos(0)
    setTotalEgresos(0)
  }

  const exportData = cuadres.map((c) => ({
    fecha: formatDate(c.fecha),
    turno: c.turno,
    saldo_inicial: c.saldo_inicial,
    total_ingresos: c.total_ingresos,
    total_egresos: c.total_egresos,
    saldo_sistema: c.saldo_sistema,
    saldo_fisico: c.saldo_fisico,
    diferencia: c.diferencia,
    estado: c.estado,
    observaciones: c.observaciones ?? '',
  }))

  const exportColumns = [
    { header: 'Fecha', key: 'fecha' },
    { header: 'Turno', key: 'turno' },
    { header: 'Saldo Inicial', key: 'saldo_inicial' },
    { header: 'Ingresos', key: 'total_ingresos' },
    { header: 'Egresos', key: 'total_egresos' },
    { header: 'Saldo Sistema', key: 'saldo_sistema' },
    { header: 'Saldo Fisico', key: 'saldo_fisico' },
    { header: 'Diferencia', key: 'diferencia' },
    { header: 'Estado', key: 'estado' },
    { header: 'Observaciones', key: 'observaciones' },
  ]

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <ClipboardCheck className="h-7 w-7 text-emerald-400" />
            Cuadre de Caja
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Conciliacion diaria de caja: saldo fisico vs movimientos del sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={exportData}
            filename="cuadres-caja"
            columns={exportColumns}
            title="Cuadres de Caja"
          />

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Cuadre
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Nuevo Cuadre de Caja</DialogTitle>
                <DialogDescription className="text-zinc-500">
                  Registre los datos del cuadre de caja. Los ingresos y egresos se calculan
                  automaticamente desde los movimientos del dia.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha" className="text-zinc-300">
                      Fecha
                    </Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-zinc-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="turno" className="text-zinc-300">
                      Turno
                    </Label>
                    <Select value={turno} onValueChange={setTurno}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manana">Manana</SelectItem>
                        <SelectItem value="tarde">Tarde</SelectItem>
                        <SelectItem value="noche">Noche</SelectItem>
                        <SelectItem value="unico">Unico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saldo_inicial" className="text-zinc-300">
                    Saldo Inicial (S/)
                  </Label>
                  <Input
                    id="saldo_inicial"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={saldoInicial}
                    onChange={(e) => setSaldoInicial(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-300 font-mono"
                  />
                </div>

                {/* Auto-calculated */}
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Calculator className="h-4 w-4" />
                    <span>Valores calculados automaticamente</span>
                    {calculating && <Loader2 className="h-3 w-3 animate-spin" />}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500">Total Ingresos</p>
                      <p className="font-mono text-lg font-semibold text-emerald-400">
                        +{formatCurrency(totalIngresos)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Total Egresos</p>
                      <p className="font-mono text-lg font-semibold text-red-400">
                        -{formatCurrency(totalEgresos)}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-zinc-700 pt-2">
                    <p className="text-xs text-zinc-500">Saldo Sistema</p>
                    <p className="font-mono text-lg font-semibold text-blue-400">
                      {formatCurrency(saldoSistema)}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">
                      = Saldo Inicial + Ingresos - Egresos
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saldo_fisico" className="text-zinc-300">
                    Saldo Fisico Contado (S/)
                  </Label>
                  <Input
                    id="saldo_fisico"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={saldoFisico}
                    onChange={(e) => setSaldoFisico(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-300 font-mono"
                  />
                </div>

                {/* Difference display */}
                {saldoFisico && (
                  <div
                    className={`rounded-lg border p-4 ${
                      diferencia === 0
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : Math.abs(diferencia) < 10
                          ? 'border-amber-500/20 bg-amber-500/5'
                          : 'border-red-500/20 bg-red-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {diferencia === 0 ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : Math.abs(diferencia) < 10 ? (
                        <AlertCircle className="h-5 w-5 text-amber-400" />
                      ) : (
                        <MinusCircle className="h-5 w-5 text-red-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-zinc-300">
                          Diferencia: {diferencia > 0 ? '+' : ''}
                          {formatCurrency(diferencia)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {diferencia === 0
                            ? 'Cuadre exacto'
                            : diferencia > 0
                              ? 'Sobrante de caja'
                              : 'Faltante de caja'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="observaciones" className="text-zinc-300">
                    Observaciones (opcional)
                  </Label>
                  <Input
                    id="observaciones"
                    placeholder="Notas adicionales..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-300"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="border-zinc-700"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving || !saldoInicial || !saldoFisico}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Registrar Cuadre'
                  )}
                </Button>
              </DialogFooter>
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
        <DataTable
          columns={columns}
          data={cuadres}
          searchPlaceholder="Buscar por fecha..."
          pageSize={15}
        />
      )}
    </div>
  )
}
