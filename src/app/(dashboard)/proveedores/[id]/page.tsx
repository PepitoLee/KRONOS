'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { DataTable } from '@/components/tables/DataTable'
import { ExportButton } from '@/components/import-export/ExportButton'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Package,
  TrendingUp,
  ArrowLeft,
  ShoppingCart,
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'

interface Proveedor {
  id: string
  ruc: string
  razon_social: string
  tipo: 'bienes' | 'servicios' | 'ambos'
  contacto: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  condicion_pago: 'contado' | 'credito_15' | 'credito_30' | 'credito_60'
  estado: 'activo' | 'inactivo' | 'suspendido'
  created_at: string
}

interface DocumentoCompra {
  id: string
  tipo: string
  serie: string
  numero: string
  fecha_emision: string
  total: number
  estado: string
}

interface Pedido {
  id: string
  numero: string
  fecha: string
  estado: 'pendiente' | 'aprobado' | 'recibido' | 'cancelado'
  total: number
}

const estadoProvBadgeColors: Record<string, string> = {
  activo: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  inactivo: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  suspendido: 'bg-red-500/15 text-red-400 border-red-500/20',
}

const estadoProvLabels: Record<string, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  suspendido: 'Suspendido',
}

const tipoLabels: Record<string, string> = {
  bienes: 'Bienes',
  servicios: 'Servicios',
  ambos: 'Ambos',
}

const condicionLabels: Record<string, string> = {
  contado: 'Contado',
  credito_15: 'Crédito 15 días',
  credito_30: 'Crédito 30 días',
  credito_60: 'Crédito 60 días',
}

const estadoDocBadgeColors: Record<string, string> = {
  registrado: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  contabilizado: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  anulado: 'bg-red-500/15 text-red-400 border-red-500/20',
}

const estadoPedidoBadgeColors: Record<string, string> = {
  pendiente: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  aprobado: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  recibido: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  cancelado: 'bg-red-500/15 text-red-400 border-red-500/20',
}

const estadoPedidoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  recibido: 'Recibido',
  cancelado: 'Cancelado',
}

const comprasColumns: ColumnDef<DocumentoCompra, unknown>[] = [
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => (
      <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/20 border text-xs font-medium">
        {(row.getValue('tipo') as string) === 'factura'
          ? 'Factura'
          : (row.getValue('tipo') as string) === 'boleta'
            ? 'Boleta'
            : row.getValue('tipo') as string}
      </Badge>
    ),
  },
  {
    id: 'serie_numero',
    header: 'Serie - Número',
    accessorFn: (row) => `${row.serie}-${row.numero}`,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-zinc-200">
        {row.original.serie}-{row.original.numero}
      </span>
    ),
  },
  {
    accessorKey: 'fecha_emision',
    header: 'Fecha',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-400">
        {formatDate(row.getValue('fecha_emision') as string)}
      </span>
    ),
  },
  {
    accessorKey: 'total',
    header: () => <span className="text-right block">Total</span>,
    cell: ({ row }) => (
      <span className="text-sm font-medium text-zinc-200 text-right block font-mono">
        {formatCurrency(row.getValue('total') as number)}
      </span>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.getValue('estado') as string
      return (
        <Badge
          className={`${estadoDocBadgeColors[estado] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20'} border text-xs font-medium`}
        >
          {estado.charAt(0).toUpperCase() + estado.slice(1)}
        </Badge>
      )
    },
  },
]

const pedidosColumns: ColumnDef<Pedido, unknown>[] = [
  {
    accessorKey: 'numero',
    header: 'Número',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-zinc-200">
        {row.getValue('numero') as string}
      </span>
    ),
  },
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => (
      <span className="text-sm text-zinc-400">
        {formatDate(row.getValue('fecha') as string)}
      </span>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.getValue('estado') as string
      return (
        <Badge
          className={`${estadoPedidoBadgeColors[estado] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20'} border text-xs font-medium`}
        >
          {estadoPedidoLabels[estado] || estado}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'total',
    header: () => <span className="text-right block">Total</span>,
    cell: ({ row }) => (
      <span className="text-sm font-medium text-zinc-200 text-right block font-mono">
        {formatCurrency(row.getValue('total') as number)}
      </span>
    ),
  },
]

export default function ProveedorDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [proveedor, setProveedor] = useState<Proveedor | null>(null)
  const [compras, setCompras] = useState<DocumentoCompra[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch proveedor
        const { data: provData, error: provError } = await supabase
          .from('proveedores')
          .select('*')
          .eq('id', id)
          .single()

        if (provError) {
          console.error('Error fetching proveedor:', provError)
          return
        }

        setProveedor(provData)

        // Fetch compras (documentos where tipo_operacion = 'compra' and nombre_tercero matches)
        const { data: comprasData } = await supabase
          .from('documentos')
          .select('id, tipo, serie, numero, fecha_emision, total, estado')
          .eq('tipo_operacion', 'compra')
          .eq('nombre_tercero', provData.razon_social)
          .order('fecha_emision', { ascending: false })

        setCompras(comprasData ?? [])

        // Fetch pedidos for this proveedor
        const { data: pedidosData } = await supabase
          .from('pedidos')
          .select('id, numero, fecha, estado, total')
          .eq('proveedor_id', id)
          .order('fecha', { ascending: false })

        setPedidos(pedidosData ?? [])
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id, supabase])

  const resumen = useMemo(() => {
    const totalComprado = compras
      .filter((c) => c.estado !== 'anulado')
      .reduce((sum, c) => sum + c.total, 0)
    const cantidadOrdenes = compras.filter((c) => c.estado !== 'anulado').length
    const promedioCompra = cantidadOrdenes > 0 ? totalComprado / cantidadOrdenes : 0
    const pedidosPendientes = pedidos.filter(
      (p) => p.estado === 'pendiente' || p.estado === 'aprobado'
    ).length

    return { totalComprado, cantidadOrdenes, promedioCompra, pedidosPendientes }
  }, [compras, pedidos])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-64 bg-zinc-800/50" />
        <Skeleton className="h-8 w-96 bg-zinc-800/50" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-zinc-800/50 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-80 bg-zinc-800/50" />
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-t border-zinc-800 p-3">
              <Skeleton className="h-5 w-20 bg-zinc-800/50" />
              <Skeleton className="h-5 w-28 bg-zinc-800/50" />
              <Skeleton className="h-5 w-24 bg-zinc-800/50" />
              <Skeleton className="h-5 w-24 bg-zinc-800/50" />
              <Skeleton className="h-5 w-20 bg-zinc-800/50" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!proveedor) {
    return (
      <div className="space-y-6">
        <BreadcrumbNav />
        <div className="flex flex-col items-center justify-center py-20">
          <Building2 className="h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-medium text-zinc-300">Proveedor no encontrado</h3>
          <p className="text-sm text-zinc-500 mt-1">
            El proveedor solicitado no existe o fue eliminado.
          </p>
          <Link href="/proveedores">
            <Button variant="outline" className="mt-4 border-zinc-700 text-zinc-300">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al directorio
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      {/* Back button */}
      <Link href="/proveedores">
        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-200 -ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver al directorio
        </Button>
      </Link>

      {/* Supplier Info Card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Building2 className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-100">{proveedor.razon_social}</h2>
              <p className="mt-1 font-mono text-sm text-zinc-400">RUC: {proveedor.ruc}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  className={`${estadoProvBadgeColors[proveedor.estado]} border text-xs font-medium`}
                >
                  {estadoProvLabels[proveedor.estado]}
                </Badge>
                <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs">
                  {tipoLabels[proveedor.tipo]}
                </Badge>
                <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs">
                  {condicionLabels[proveedor.condicion_pago]}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Contact details */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {proveedor.contacto && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Building2 className="h-4 w-4 text-zinc-500" />
              <span>{proveedor.contacto}</span>
            </div>
          )}
          {proveedor.telefono && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Phone className="h-4 w-4 text-zinc-500" />
              <span className="font-mono">{proveedor.telefono}</span>
            </div>
          )}
          {proveedor.email && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Mail className="h-4 w-4 text-zinc-500" />
              <span>{proveedor.email}</span>
            </div>
          )}
          {proveedor.direccion && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <MapPin className="h-4 w-4 text-zinc-500" />
              <span>{proveedor.direccion}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <CreditCard className="h-4 w-4 text-emerald-400" />
            <span>Total Comprado</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-100 font-mono">
            {formatCurrency(resumen.totalComprado)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <FileText className="h-4 w-4 text-blue-400" />
            <span>Cantidad de Ordenes</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-100 font-mono">
            {resumen.cantidadOrdenes}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <TrendingUp className="h-4 w-4 text-violet-400" />
            <span>Promedio de Compra</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-100 font-mono">
            {formatCurrency(resumen.promedioCompra)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Package className="h-4 w-4 text-amber-400" />
            <span>Pedidos Pendientes</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-100 font-mono">
            {resumen.pedidosPendientes}
          </p>
        </div>
      </div>

      {/* Tabs: Historial de Compras / Pedidos */}
      <Tabs defaultValue="compras" className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger
            value="compras"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Historial de Compras ({compras.length})
          </TabsTrigger>
          <TabsTrigger
            value="pedidos"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400"
          >
            <Package className="mr-2 h-4 w-4" />
            Pedidos ({pedidos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compras">
          {compras.length > 0 ? (
            <>
              <div className="flex justify-end mb-4">
                <ExportButton
                  data={compras.map((c) => ({
                    tipo: c.tipo,
                    serie_numero: `${c.serie}-${c.numero}`,
                    fecha: formatDate(c.fecha_emision),
                    total: c.total,
                    estado: c.estado,
                  }))}
                  filename={`compras-${proveedor.razon_social.replace(/\s+/g, '_')}`}
                  columns={[
                    { header: 'Tipo', key: 'tipo' },
                    { header: 'Serie - Número', key: 'serie_numero' },
                    { header: 'Fecha', key: 'fecha' },
                    { header: 'Total (PEN)', key: 'total' },
                    { header: 'Estado', key: 'estado' },
                  ]}
                  title={`Historial de Compras - ${proveedor.razon_social}`}
                />
              </div>
              <DataTable
                columns={comprasColumns}
                data={compras}
                searchPlaceholder="Buscar compras..."
                pageSize={10}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-zinc-800 bg-zinc-900/30">
              <FileText className="h-10 w-10 text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-500">No hay compras registradas con este proveedor</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pedidos">
          {pedidos.length > 0 ? (
            <>
              <div className="flex justify-end mb-4">
                <ExportButton
                  data={pedidos.map((p) => ({
                    numero: p.numero,
                    fecha: formatDate(p.fecha),
                    estado: estadoPedidoLabels[p.estado] || p.estado,
                    total: p.total,
                  }))}
                  filename={`pedidos-${proveedor.razon_social.replace(/\s+/g, '_')}`}
                  columns={[
                    { header: 'Número', key: 'numero' },
                    { header: 'Fecha', key: 'fecha' },
                    { header: 'Estado', key: 'estado' },
                    { header: 'Total (PEN)', key: 'total' },
                  ]}
                  title={`Pedidos - ${proveedor.razon_social}`}
                />
              </div>
              <DataTable
                columns={pedidosColumns}
                data={pedidos}
                searchPlaceholder="Buscar pedidos..."
                pageSize={10}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-zinc-800 bg-zinc-900/30">
              <Package className="h-10 w-10 text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-500">No hay pedidos registrados con este proveedor</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
