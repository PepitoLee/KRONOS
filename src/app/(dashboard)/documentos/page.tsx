'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DataTable } from '@/components/tables/DataTable'
import { ExportButton } from '@/components/import-export/ExportButton'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Receipt,
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'

interface Documento {
  id: string
  tipo: 'factura' | 'boleta' | 'nota_credito' | 'nota_debito'
  serie: string
  numero: string
  fecha_emision: string
  tipo_operacion: 'compra' | 'venta'
  nombre_tercero: string
  total: number
  estado: 'registrado' | 'contabilizado' | 'anulado'
}

const tipoBadgeColors: Record<Documento['tipo'], string> = {
  factura: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  boleta: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  nota_credito: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  nota_debito: 'bg-red-500/15 text-red-400 border-red-500/20',
}

const tipoLabels: Record<Documento['tipo'], string> = {
  factura: 'Factura',
  boleta: 'Boleta',
  nota_credito: 'Nota de Crédito',
  nota_debito: 'Nota de Débito',
}

const estadoBadgeColors: Record<Documento['estado'], string> = {
  registrado: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  contabilizado: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  anulado: 'bg-red-500/15 text-red-400 border-red-500/20',
}

const estadoLabels: Record<Documento['estado'], string> = {
  registrado: 'Registrado',
  contabilizado: 'Contabilizado',
  anulado: 'Anulado',
}

const columns: ColumnDef<Documento, unknown>[] = [
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.getValue('tipo') as Documento['tipo']
      return (
        <Badge className={`${tipoBadgeColors[tipo]} border text-xs font-medium`}>
          {tipoLabels[tipo]}
        </Badge>
      )
    },
  },
  {
    id: 'serie_numero',
    header: 'Serie - Numero',
    accessorFn: (row) => `${row.serie}-${row.numero}`,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-zinc-200">
        {row.original.serie}-{row.original.numero}
      </span>
    ),
  },
  {
    accessorKey: 'fecha_emision',
    header: 'Fecha Emision',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-400">
        {formatDate(row.getValue('fecha_emision') as string)}
      </span>
    ),
  },
  {
    accessorKey: 'tipo_operacion',
    header: 'Operacion',
    cell: ({ row }) => {
      const tipo = row.getValue('tipo_operacion') as Documento['tipo_operacion']
      return (
        <Badge
          className={`border text-xs font-medium ${
            tipo === 'venta'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
              : 'bg-sky-500/15 text-sky-400 border-sky-500/20'
          }`}
        >
          {tipo === 'venta' ? 'Venta' : 'Compra'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'nombre_tercero',
    header: 'Cliente / Proveedor',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-300 max-w-[200px] truncate block">
        {row.getValue('nombre_tercero') as string}
      </span>
    ),
  },
  {
    accessorKey: 'total',
    header: () => <span className="text-right block">Total</span>,
    cell: ({ row }) => (
      <span className="text-sm font-medium text-zinc-200 text-right block">
        {formatCurrency(row.getValue('total') as number)}
      </span>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.getValue('estado') as Documento['estado']
      return (
        <Badge className={`${estadoBadgeColors[estado]} border text-xs font-medium`}>
          {estadoLabels[estado]}
        </Badge>
      )
    },
  },
]

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipoOperacion, setFilterTipoOperacion] = useState<string>('todos')
  const [filterTipoDocumento, setFilterTipoDocumento] = useState<string>('todos')
  const supabase = createClient()

  useEffect(() => {
    async function fetchDocumentos() {
      try {
        const { data, error } = await supabase
          .from('documentos')
          .select('id, tipo, serie, numero, fecha_emision, tipo_operacion, nombre_tercero, total, estado')
          .order('fecha_emision', { ascending: false })

        if (error) {
          console.error('Error fetching documentos:', error)
          return
        }

        setDocumentos(data ?? [])
      } finally {
        setLoading(false)
      }
    }

    fetchDocumentos()
  }, [supabase])

  const filteredDocumentos = useMemo(() => {
    let result = documentos

    if (filterTipoOperacion !== 'todos') {
      result = result.filter((d) => d.tipo_operacion === filterTipoOperacion)
    }

    if (filterTipoDocumento !== 'todos') {
      result = result.filter((d) => d.tipo === filterTipoDocumento)
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter(
        (d) =>
          d.nombre_tercero.toLowerCase().includes(term) ||
          `${d.serie}-${d.numero}`.toLowerCase().includes(term)
      )
    }

    return result
  }, [documentos, filterTipoOperacion, filterTipoDocumento, searchTerm])

  const exportData = filteredDocumentos.map((d) => ({
    tipo: tipoLabels[d.tipo],
    serie_numero: `${d.serie}-${d.numero}`,
    fecha_emision: formatDate(d.fecha_emision),
    tipo_operacion: d.tipo_operacion === 'venta' ? 'Venta' : 'Compra',
    nombre_tercero: d.nombre_tercero,
    total: d.total,
    estado: estadoLabels[d.estado],
  }))

  const exportColumns = [
    { header: 'Tipo Documento', key: 'tipo' },
    { header: 'Serie - Numero', key: 'serie_numero' },
    { header: 'Fecha Emision', key: 'fecha_emision' },
    { header: 'Operacion', key: 'tipo_operacion' },
    { header: 'Cliente / Proveedor', key: 'nombre_tercero' },
    { header: 'Total (PEN)', key: 'total' },
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
              <Skeleton className="h-5 w-20 bg-zinc-800/50" />
              <Skeleton className="h-5 w-28 bg-zinc-800/50" />
              <Skeleton className="h-5 w-24 bg-zinc-800/50" />
              <Skeleton className="h-5 w-16 bg-zinc-800/50" />
              <Skeleton className="h-5 w-40 bg-zinc-800/50" />
              <Skeleton className="h-5 w-24 bg-zinc-800/50" />
              <Skeleton className="h-5 w-24 bg-zinc-800/50" />
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
            <Receipt className="h-7 w-7 text-emerald-400" />
            Documentos Comerciales
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Gestiona facturas, boletas, notas de credito y debito de compras y ventas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={exportData}
            filename="documentos-comerciales"
            columns={exportColumns}
            title="Documentos Comerciales"
          />
          <Link href="/documentos/nuevo">
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Documento
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Filter className="h-4 w-4" />
          <span>Filtros:</span>
        </div>

        <Select value={filterTipoOperacion} onValueChange={setFilterTipoOperacion}>
          <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-700 text-zinc-300">
            <SelectValue placeholder="Operacion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las operaciones</SelectItem>
            <SelectItem value="venta">Ventas</SelectItem>
            <SelectItem value="compra">Compras</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterTipoDocumento} onValueChange={setFilterTipoDocumento}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700 text-zinc-300">
            <SelectValue placeholder="Tipo documento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="factura">Factura</SelectItem>
            <SelectItem value="boleta">Boleta</SelectItem>
            <SelectItem value="nota_credito">Nota de Credito</SelectItem>
            <SelectItem value="nota_debito">Nota de Debito</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar por nombre o serie-numero..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500">
          Mostrando {filteredDocumentos.length} de {documentos.length} documentos
        </span>
        {filterTipoOperacion !== 'todos' && (
          <Badge
            className="bg-zinc-800 text-zinc-300 border border-zinc-700 cursor-pointer hover:bg-zinc-700 text-xs"
            onClick={() => setFilterTipoOperacion('todos')}
          >
            {filterTipoOperacion === 'venta' ? 'Ventas' : 'Compras'} &times;
          </Badge>
        )}
        {filterTipoDocumento !== 'todos' && (
          <Badge
            className="bg-zinc-800 text-zinc-300 border border-zinc-700 cursor-pointer hover:bg-zinc-700 text-xs"
            onClick={() => setFilterTipoDocumento('todos')}
          >
            {tipoLabels[filterTipoDocumento as Documento['tipo']]} &times;
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
        data={filteredDocumentos}
        searchPlaceholder="Buscar en resultados..."
        pageSize={15}
      />
    </div>
  )
}
