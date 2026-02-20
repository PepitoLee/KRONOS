'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/stores/app-store'
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  TrendingUp,
  DollarSign,
  Landmark,
  ClipboardList,
  Factory,
  AlertTriangle,
  CheckCircle2,
  Search,
  Settings,
  ChevronDown,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  children?: { label: string; href: string }[]
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    label: 'Documentos',
    href: '/documentos',
    icon: FileText,
    children: [
      { label: 'Registro', href: '/documentos' },
      { label: 'Nuevo', href: '/documentos/nuevo' },
    ],
  },
  {
    label: 'Planillas',
    href: '/planillas',
    icon: Users,
    children: [
      { label: 'Empleados', href: '/planillas/empleados' },
      { label: 'Cálculo', href: '/planillas/calcular' },
    ],
  },
  {
    label: 'Estados Financieros',
    href: '/estados-financieros',
    icon: BarChart3,
    children: [
      { label: 'Estado de Resultados', href: '/estados-financieros/resultados' },
      { label: 'Situación Financiera', href: '/estados-financieros/situacion' },
      { label: 'Flujo de Caja', href: '/estados-financieros/flujo-caja' },
    ],
  },
  {
    label: 'Indicadores',
    href: '/indicadores',
    icon: TrendingUp,
    children: [
      { label: 'Ratios Financieros', href: '/indicadores/ratios' },
      { label: 'Evolutivo Ventas', href: '/indicadores/ventas' },
      { label: 'Productividad', href: '/indicadores/productividad' },
      { label: 'RRHH', href: '/indicadores/rrhh' },
    ],
  },
  {
    label: 'Impuestos',
    href: '/impuestos',
    icon: DollarSign,
    children: [
      { label: 'IGV', href: '/impuestos/igv' },
      { label: 'Renta', href: '/impuestos/renta' },
    ],
  },
  {
    label: 'Tesorería',
    href: '/tesoreria',
    icon: Landmark,
    children: [
      { label: 'Cuadre de Caja', href: '/tesoreria/cuadre-caja' },
      { label: 'Depósitos', href: '/tesoreria/depositos' },
      { label: 'Conciliaciones', href: '/tesoreria/conciliaciones' },
    ],
  },
  { label: 'Presupuestos', href: '/presupuestos', icon: ClipboardList },
  {
    label: 'Proveedores',
    href: '/proveedores',
    icon: Factory,
    children: [
      { label: 'Directorio', href: '/proveedores' },
      { label: 'Pedidos', href: '/proveedores/pedidos' },
    ],
  },
  {
    label: 'Reclamos',
    href: '/reclamos',
    icon: AlertTriangle,
    children: [
      { label: 'Registro', href: '/reclamos' },
      { label: 'Nuevo', href: '/reclamos/nuevo' },
      { label: 'Indicadores', href: '/reclamos/indicadores' },
    ],
  },
  {
    label: 'Calidad',
    href: '/calidad',
    icon: CheckCircle2,
    children: [
      { label: 'Evaluaciones', href: '/calidad' },
      { label: 'Satisfacción Cliente', href: '/calidad/satisfaccion' },
      { label: 'Clima Laboral', href: '/calidad/clima-laboral' },
    ],
  },
  {
    label: 'Auditoría',
    href: '/auditoria',
    icon: Search,
    children: [
      { label: 'Documentos Legales', href: '/auditoria/documentos' },
      { label: 'Control', href: '/auditoria/legal' },
    ],
  },
]

function NavItemComponent({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(
    item.children?.some((child) => pathname === child.href) ?? false
  )
  const isActive = pathname === item.href || item.children?.some((c) => pathname === c.href)
  const Icon = item.icon

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            isActive
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')}
          />
        </button>
        {expanded && (
          <div className="ml-4 mt-1 space-y-1 border-l border-zinc-800 pl-3">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'block rounded-md px-3 py-1.5 text-sm transition-colors',
                  pathname === child.href
                    ? 'text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  )
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-zinc-800 bg-[#0d1117] transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-100">KRONOS</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      {sidebarOpen && (
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {navigation.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </nav>
      )}

      {/* Footer */}
      {sidebarOpen && (
        <div className="border-t border-zinc-800 p-3">
          <Link
            href="/configuracion"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Settings className="h-4 w-4" />
            <span>Configuración</span>
          </Link>
        </div>
      )}
    </aside>
  )
}
