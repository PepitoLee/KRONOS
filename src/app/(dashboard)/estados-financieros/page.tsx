'use client'

import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import Link from 'next/link'
import { TrendingUp, Scale, Wallet } from 'lucide-react'

const modules = [
  {
    title: 'Estado de Resultados',
    description:
      'Analiza los ingresos, costos y gastos del periodo para determinar la utilidad neta de la empresa.',
    href: '/estados-financieros/resultados',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  {
    title: 'Balance General',
    description:
      'Muestra la situacion financiera: activos, pasivos y patrimonio a una fecha determinada.',
    href: '/estados-financieros/situacion',
    icon: Scale,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    title: 'Flujo de Caja',
    description:
      'Detalla los movimientos de efectivo por actividades operativas, de inversion y financiamiento.',
    href: '/estados-financieros/flujo-caja',
    icon: Wallet,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
]

export default function EstadosFinancierosPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Estados Financieros</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Reportes financieros basados en el Plan Contable General Empresarial (PCGE)
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => {
          const Icon = mod.icon
          return (
            <Link key={mod.href} href={mod.href}>
              <div
                className={`group relative rounded-xl border ${mod.borderColor} ${mod.bgColor} p-6 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20`}
              >
                <div
                  className={`mb-4 inline-flex rounded-lg ${mod.bgColor} p-3`}
                >
                  <Icon className={`h-7 w-7 ${mod.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-white">
                  {mod.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {mod.description}
                </p>
                <div
                  className={`mt-4 inline-flex items-center text-sm font-medium ${mod.color}`}
                >
                  Ver reporte
                  <svg
                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
