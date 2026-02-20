'use client'

import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import Link from 'next/link'
import { ClipboardCheck, SmilePlus, Users } from 'lucide-react'

const modules = [
  {
    title: 'Evaluaciones de Calidad',
    description: 'Evaluaciones de procesos, productos y servicios por area',
    href: '/calidad/evaluaciones',
    icon: ClipboardCheck,
    color: 'text-blue-400 bg-blue-500/10',
  },
  {
    title: 'Satisfaccion del Cliente',
    description: 'Encuestas, NPS y feedback de clientes',
    href: '/calidad/satisfaccion',
    icon: SmilePlus,
    color: 'text-emerald-400 bg-emerald-500/10',
  },
  {
    title: 'Clima Laboral',
    description: 'Encuestas de clima organizacional y bienestar',
    href: '/calidad/clima-laboral',
    icon: Users,
    color: 'text-purple-400 bg-purple-500/10',
  },
]

export default function CalidadPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbNav />
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Calidad</h2>
        <p className="text-sm text-zinc-500">Gestion de calidad, satisfaccion y clima laboral</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
