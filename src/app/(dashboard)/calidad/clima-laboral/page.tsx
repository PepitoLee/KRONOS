'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { DataTable } from '@/components/tables/DataTable'
import { ExportButton } from '@/components/import-export/ExportButton'
import { formatDate } from '@/lib/utils/dates'
import { ColumnDef } from '@tanstack/react-table'
import { Users, Star } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface Encuesta {
  id: string
  titulo: string
  periodo: string
  fecha_inicio: string
  fecha_fin: string
  estado: string
}

interface Respuesta {
  id: string
  encuesta_id: string
  empleado_id: string
  anonimo: boolean
  satisfaccion_general: number | null
  ambiente_trabajo: number | null
  liderazgo: number | null
  comunicacion: number | null
  desarrollo_profesional: number | null
  compensacion: number | null
  balance_vida_trabajo: number | null
  comentarios: string | null
}

const dimensiones = [
  { key: 'satisfaccion_general', label: 'Satisfacción General' },
  { key: 'ambiente_trabajo', label: 'Ambiente de Trabajo' },
  { key: 'liderazgo', label: 'Liderazgo' },
  { key: 'comunicacion', label: 'Comunicación' },
  { key: 'desarrollo_profesional', label: 'Desarrollo Profesional' },
  { key: 'compensacion', label: 'Compensación' },
  { key: 'balance_vida_trabajo', label: 'Balance Vida-Trabajo' },
] as const

export default function ClimaLaboralPage() {
  const [encuestas, setEncuestas] = useState<Encuesta[]>([])
  const [respuestas, setRespuestas] = useState<Respuesta[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: enc }, { data: resp }] = await Promise.all([
        supabase.from('encuestas_clima').select('*').order('fecha_inicio', { ascending: false }),
        supabase.from('respuestas_clima').select('*'),
      ])
      setEncuestas((enc as Encuesta[]) ?? [])
      setRespuestas((resp as Respuesta[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // Calculate average across all dimensions per response
  function promedioRespuesta(r: Respuesta): number {
    const vals = dimensiones.map((d) => r[d.key as keyof Respuesta] as number | null).filter((v): v is number => v !== null)
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
  }

  const promedioGeneral = respuestas.length > 0
    ? respuestas.reduce((s, r) => s + promedioRespuesta(r), 0) / respuestas.length
    : 0

  const participantes = new Set(respuestas.map((r) => r.empleado_id)).size

  // Chart data: average per dimension
  const chartData = dimensiones.map((dim) => {
    const vals = respuestas.map((r) => r[dim.key as keyof Respuesta] as number | null).filter((v): v is number => v !== null)
    const promedio = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
    return { dimension: dim.label, promedio: Math.round(promedio * 10) / 10 }
  })

  const encuestaColumns: ColumnDef<Encuesta>[] = [
    { accessorKey: 'titulo', header: 'Titulo' },
    { accessorKey: 'periodo', header: 'Periodo', cell: ({ row }) => <span className="font-mono text-sm">{row.original.periodo}</span> },
    { accessorKey: 'fecha_inicio', header: 'Inicio', cell: ({ row }) => formatDate(row.original.fecha_inicio) },
    { accessorKey: 'fecha_fin', header: 'Fin', cell: ({ row }) => formatDate(row.original.fecha_fin) },
    {
      accessorKey: 'estado', header: 'Estado',
      cell: ({ row }) => {
        const colors: Record<string, string> = { activa: 'bg-emerald-500/20 text-emerald-400', cerrada: 'bg-zinc-500/20 text-zinc-400', borrador: 'bg-amber-500/20 text-amber-400' }
        return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[row.original.estado] ?? ''}`}>{row.original.estado}</span>
      },
    },
  ]

  const exportData = chartData.map((d) => ({ dimension: d.dimension, promedio: d.promedio }))

  return (
    <div className="space-y-6">
      <BreadcrumbNav />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100"><Users className="h-6 w-6 text-purple-400" /> Clima Laboral</h2>
          <p className="text-sm text-zinc-500">Encuestas de clima organizacional y bienestar</p>
        </div>
        <ExportButton
          data={exportData}
          filename="clima-laboral"
          title="Resultados Clima Laboral"
          columns={[{ header: 'Dimensión', key: 'dimension' }, { header: 'Promedio', key: 'promedio' }]}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
          <p className="text-xs text-zinc-500">Promedio General</p>
          <div className="mt-1 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
            <span className="text-2xl font-bold font-mono text-amber-400">{promedioGeneral.toFixed(1)}</span>
            <span className="text-sm text-zinc-500">/ 5.0</span>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
          <p className="text-xs text-zinc-500">Participantes</p>
          <p className="mt-1 text-2xl font-bold font-mono text-purple-400">{participantes}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
          <p className="text-xs text-zinc-500">Total Respuestas</p>
          <p className="mt-1 text-2xl font-bold font-mono text-zinc-100">{respuestas.length}</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">Promedio por Dimensión</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d44" />
              <XAxis type="number" domain={[0, 5]} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis dataKey="dimension" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={180} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Bar dataKey="promedio" fill="#a855f7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-lg font-semibold text-zinc-100">Encuestas</h3>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800/50" />))}</div>
        ) : (
          <DataTable columns={encuestaColumns} data={encuestas} searchPlaceholder="Buscar encuesta..." />
        )}
      </div>
    </div>
  )
}
