'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { DataTable } from '@/components/tables/DataTable'
import { ExportButton } from '@/components/import-export/ExportButton'
import { formatDate } from '@/lib/utils/dates'
import { ColumnDef } from '@tanstack/react-table'
import { ShieldAlert, Bell, AlertTriangle, Clock, CalendarClock } from 'lucide-react'

interface DocAuditoria {
  id: string
  empresa_id: string
  tipo_documento: string
  nombre_documento: string
  numero_documento: string
  fecha_emision: string
  fecha_vencimiento: string
  entidad_emisora: string | null
  estado: string
  dias_para_vencimiento: number | null
  notas: string | null
  alerta_30_dias: boolean
  alerta_60_dias: boolean
  alerta_90_dias: boolean
  created_at: string
  updated_at: string
}

export default function ControlLegalPage() {
  const [documentos, setDocumentos] = useState<DocAuditoria[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('auditoria_documentos')
        .select('*')
        .order('fecha_vencimiento', { ascending: true })
      setDocumentos((data as DocAuditoria[]) ?? [])
      setLoading(false)
    }
    loadData()
  }, [])

  const alerta30 = documentos.filter((d) => d.alerta_30_dias).length
  const alerta60 = documentos.filter((d) => d.alerta_60_dias && !d.alerta_30_dias).length
  const alerta90 = documentos.filter((d) => d.alerta_90_dias && !d.alerta_60_dias && !d.alerta_30_dias).length
  const vencidos = documentos.filter((d) => d.estado === 'vencido').length

  const proximosVencimientos = documentos
    .filter((d) => d.dias_para_vencimiento !== null && d.dias_para_vencimiento >= 0)
    .sort((a, b) => (a.dias_para_vencimiento ?? 0) - (b.dias_para_vencimiento ?? 0))
    .slice(0, 10)

  const tipoLabels: Record<string, string> = {
    licencia: 'Licencia',
    certificado: 'Certificado',
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
      accessorKey: 'fecha_vencimiento', header: 'Vencimiento',
      cell: ({ row }) => {
        const dias = row.original.dias_para_vencimiento
        const color = dias !== null && dias < 0 ? 'text-red-400' : dias !== null && dias <= 30 ? 'text-amber-400' : 'text-zinc-300'
        return <span className={`text-sm font-mono ${color}`}>{formatDate(row.original.fecha_vencimiento)}</span>
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
      id: 'alertas', header: 'Alertas',
      cell: ({ row }) => {
        const d = row.original
        const alertas: string[] = []
        if (d.alerta_30_dias) alertas.push('30d')
        if (d.alerta_60_dias) alertas.push('60d')
        if (d.alerta_90_dias) alertas.push('90d')
        if (alertas.length === 0) return <span className="text-zinc-600 text-xs">Sin alertas</span>
        return (
          <div className="flex gap-1">
            {alertas.map((a) => (
              <span key={a} className={`rounded px-1.5 py-0.5 text-xs font-medium ${a === '30d' ? 'bg-red-500/20 text-red-400' : a === '60d' ? 'bg-amber-500/20 text-amber-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {a}
              </span>
            ))}
          </div>
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
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <ShieldAlert className="h-6 w-6 text-orange-400" /> Control y Seguimiento Legal
        </h2>
        <p className="text-sm text-zinc-500">Alertas de vencimientos y seguimiento de documentos regulatorios</p>
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-red-400" />
          <div><p className="text-xs text-zinc-500">Vencidos</p><p className="text-2xl font-bold font-mono text-red-400">{vencidos}</p></div>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
          <Bell className="h-8 w-8 text-red-400" />
          <div><p className="text-xs text-zinc-500">Alerta 30 días</p><p className="text-2xl font-bold font-mono text-red-400">{alerta30}</p></div>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-amber-400" />
          <div><p className="text-xs text-zinc-500">Alerta 60 días</p><p className="text-2xl font-bold font-mono text-amber-400">{alerta60}</p></div>
        </div>
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 flex items-center gap-3">
          <CalendarClock className="h-8 w-8 text-yellow-400" />
          <div><p className="text-xs text-zinc-500">Alerta 90 días</p><p className="text-2xl font-bold font-mono text-yellow-400">{alerta90}</p></div>
        </div>
      </div>

      {/* Próximos vencimientos */}
      {proximosVencimientos.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-amber-400" />
            Próximos Vencimientos
          </h3>
          <div className="space-y-2">
            {proximosVencimientos.map((doc) => {
              const dias = doc.dias_para_vencimiento ?? 0
              const color = dias <= 30 ? 'border-l-red-500' : dias <= 60 ? 'border-l-amber-500' : 'border-l-emerald-500'
              return (
                <div key={doc.id} className={`flex items-center justify-between rounded bg-zinc-800/50 px-3 py-2 border-l-2 ${color}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 w-16">{tipoLabels[doc.tipo_documento] ?? doc.tipo_documento}</span>
                    <span className="text-sm text-zinc-300">{doc.nombre_documento}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-zinc-500">{formatDate(doc.fecha_vencimiento)}</span>
                    <span className={`text-xs font-mono font-medium ${dias <= 30 ? 'text-red-400' : dias <= 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {dias}d
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Export + Table */}
      <div className="flex justify-end">
        <ExportButton
          data={documentos as unknown as Record<string, unknown>[]}
          filename="control-legal"
          title="Control Legal"
          columns={[
            { header: 'Tipo', key: 'tipo_documento' },
            { header: 'Documento', key: 'nombre_documento' },
            { header: 'Número', key: 'numero_documento' },
            { header: 'Vencimiento', key: 'fecha_vencimiento' },
            { header: 'Días Restantes', key: 'dias_para_vencimiento' },
            { header: 'Estado', key: 'estado' },
          ]}
        />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800/50" />))}</div>
      ) : (
        <DataTable columns={columns} data={documentos} searchPlaceholder="Buscar documento..." />
      )}
    </div>
  )
}
