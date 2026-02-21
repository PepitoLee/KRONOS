'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/stores/app-store'
import { Progress } from '@/components/ui/progress'
import {
  Building2,
  BookOpen,
  ShoppingCart,
  Receipt,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChecklistItem {
  id: string
  label: string
  icon: React.ElementType
  completed: boolean
}

export function ProgressChecklist() {
  const [collapsed, setCollapsed] = useState(false)
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: 'empresa', label: 'Datos empresa', icon: Building2, completed: false },
    { id: 'pcge', label: 'Plan contable', icon: BookOpen, completed: false },
    { id: 'venta', label: 'Primer venta', icon: Receipt, completed: false },
    { id: 'compra', label: 'Primer compra', icon: ShoppingCart, completed: false },
    { id: 'reporte', label: 'Primer reporte', icon: FileText, completed: false },
  ])
  const { empresaId } = useAppStore()
  const supabase = createClient()

  useEffect(() => {
    async function checkProgress() {
      if (!empresaId) return

      const [empresaRes, pcgeRes, ventaRes, compraRes] = await Promise.all([
        supabase
          .from('empresas')
          .select('ruc')
          .eq('id', empresaId)
          .single(),
        supabase
          .from('plan_contable')
          .select('id', { count: 'exact', head: true })
          .eq('empresa_id', empresaId),
        supabase
          .from('documentos')
          .select('id', { count: 'exact', head: true })
          .eq('empresa_id', empresaId)
          .eq('tipo_operacion', 'venta'),
        supabase
          .from('documentos')
          .select('id', { count: 'exact', head: true })
          .eq('empresa_id', empresaId)
          .eq('tipo_operacion', 'compra'),
      ])

      const hasEmpresa = !!(empresaRes.data?.ruc && empresaRes.data.ruc.length === 11)
      const hasPcge = (pcgeRes.count ?? 0) > 0
      const hasVenta = (ventaRes.count ?? 0) > 0
      const hasCompra = (compraRes.count ?? 0) > 0
      const hasReporte = hasVenta || hasCompra

      setItems((prev) =>
        prev.map((item) => {
          switch (item.id) {
            case 'empresa':
              return { ...item, completed: hasEmpresa }
            case 'pcge':
              return { ...item, completed: hasPcge }
            case 'venta':
              return { ...item, completed: hasVenta }
            case 'compra':
              return { ...item, completed: hasCompra }
            case 'reporte':
              return { ...item, completed: hasReporte }
            default:
              return item
          }
        })
      )
    }

    checkProgress()
  }, [empresaId, supabase])

  const completedCount = items.filter((i) => i.completed).length
  const totalCount = items.length
  const progressValue = (completedCount / totalCount) * 100

  if (completedCount === totalCount) return null

  return (
    <div className="fixed bottom-6 right-6 z-30 w-72">
      <div className="rounded-xl border border-zinc-800 bg-[#0d1117] shadow-xl">
        {/* Header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-zinc-200">
              Inicio rapido
            </span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
              {completedCount}/{totalCount}
            </span>
          </div>
          {collapsed ? (
            <ChevronUp className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          )}
        </button>

        {!collapsed && (
          <>
            <div className="px-4 pb-2">
              <Progress value={progressValue} className="h-1.5" />
            </div>
            <div className="space-y-1 px-3 pb-4">
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm',
                      item.completed ? 'text-zinc-500' : 'text-zinc-300'
                    )}
                  >
                    {item.completed ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                        <Check className="h-3 w-3 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700">
                        <Icon className="h-3 w-3 text-zinc-500" />
                      </div>
                    )}
                    <span className={cn(item.completed && 'line-through')}>
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
