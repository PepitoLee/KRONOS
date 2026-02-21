'use client'

import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { FileText, FileOutput, Calculator, BookOpen, BarChart3, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'

const reportes = [
  {
    titulo: 'Reporte Mensual',
    descripcion: 'Resumen ejecutivo del mes con KPIs, ventas, gastos y utilidad',
    icono: FileOutput,
    tipo: 'generar' as const,
    color: 'emerald',
  },
  {
    titulo: 'Reporte Trimestral',
    descripcion: 'Analisis comparativo trimestral con tendencias y proyecciones',
    icono: BarChart3,
    tipo: 'generar' as const,
    color: 'blue',
  },
  {
    titulo: 'PDT 621 - IGV Renta',
    descripcion: 'Pre-llenado de casillas para declaracion mensual',
    icono: Calculator,
    tipo: 'enlace' as const,
    enlace: '/impuestos/pdt-621',
    color: 'purple',
  },
  {
    titulo: 'Libros Electronicos PLE',
    descripcion: 'Genera archivos TXT para el programa PLE de SUNAT',
    icono: BookOpen,
    tipo: 'enlace' as const,
    enlace: '/impuestos/ple',
    color: 'amber',
  },
  {
    titulo: 'Estado de Resultados',
    descripcion: 'Reporte de ingresos, costos y utilidad del periodo',
    icono: FileText,
    tipo: 'enlace' as const,
    enlace: '/estados-financieros/resultados',
    color: 'emerald',
  },
  {
    titulo: 'Situacion Financiera',
    descripcion: 'Balance general con activos, pasivos y patrimonio',
    icono: FileText,
    tipo: 'enlace' as const,
    enlace: '/estados-financieros/situacion',
    color: 'cyan',
  },
]

const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-500/20 text-emerald-400',
  blue: 'bg-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/20 text-purple-400',
  amber: 'bg-amber-500/20 text-amber-400',
  cyan: 'bg-cyan-500/20 text-cyan-400',
}

export default function ReportesPage() {
  const handleGenerar = (titulo: string) => {
    toast.success('Generando reporte...', {
      description: `${titulo} se esta generando. Estara listo en unos momentos.`,
    })
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <FileOutput className="h-7 w-7 text-emerald-400" />
          Centro de Reportes
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Genera y descarga reportes financieros para directorio y cumplimiento
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportes.map((reporte) => {
          const Icon = reporte.icono
          return (
            <div
              key={reporte.titulo}
              className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-[#111827] p-6"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[reporte.color]}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">{reporte.titulo}</h3>
                <p className="text-xs text-zinc-500 mb-4">{reporte.descripcion}</p>
              </div>
              {reporte.tipo === 'generar' ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 border-emerald-800 text-emerald-400 hover:bg-emerald-950"
                  onClick={() => handleGenerar(reporte.titulo)}
                >
                  <Download className="h-3 w-3" />
                  Generar PDF
                </Button>
              ) : (
                <Link href={reporte.enlace!}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    Ver Reporte
                  </Button>
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
