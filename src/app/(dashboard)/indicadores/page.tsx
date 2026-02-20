'use client'

import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import Link from 'next/link'
import { BarChart3, TrendingUp, Activity, Users } from 'lucide-react'

const modules = [
  {
    title: 'Ratios Financieros',
    description: 'Liquidez, endeudamiento, rentabilidad y gestión',
    href: '/indicadores/ratios',
    icon: BarChart3,
    color: 'text-blue-400 bg-blue-500/10',
  },
  {
    title: 'Evolutivo de Ventas',
    description: 'KPIs de ventas semanal, mensual y anual',
    href: '/indicadores/ventas',
    icon: TrendingUp,
    color: 'text-emerald-400 bg-emerald-500/10',
  },
  {
    title: 'Productividad',
    description: 'Índices de productividad y eficiencia laboral',
    href: '/indicadores/productividad',
    icon: Activity,
    color: 'text-amber-400 bg-amber-500/10',
  },
  {
    title: 'RRHH',
    description: 'Rotación de personal, antigüedad y costo laboral',
    href: '/indicadores/rrhh',
    icon: Users,
    color: 'text-purple-400 bg-purple-500/10',
  },
]

export default function IndicadoresPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbNav />
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Indicadores</h2>
        <p className="text-sm text-zinc-500">Dashboard de KPIs y métricas de gestión</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group rounded-xl border border-zinc-800 bg-[#111827] p-6 transition-all hover:border-zinc-700 hover:bg-[#111827]/80"
          >
            <div className={`inline-flex rounded-lg p-3 ${mod.color}`}>
              <mod.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
              {mod.title}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">{mod.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
