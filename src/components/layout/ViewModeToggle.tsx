'use client'

import { useAppStore } from '@/lib/stores/app-store'
import { cn } from '@/lib/utils'
import { Calculator, BarChart3 } from 'lucide-react'

const modes = [
  { value: 'contador', label: 'Contador', icon: Calculator },
  { value: 'gerente', label: 'Gerente', icon: BarChart3 },
] as const

export function ViewModeToggle() {
  const { userRol, setUserRol } = useAppStore()
  const activeMode = userRol === 'gerente' ? 'gerente' : 'contador'

  return (
    <div className="flex items-center rounded-full border border-zinc-700 bg-zinc-900 p-0.5">
      {modes.map((mode) => {
        const isActive = activeMode === mode.value
        const Icon = mode.icon
        return (
          <button
            key={mode.value}
            onClick={() => setUserRol(mode.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all',
              isActive
                ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Icon className="h-3 w-3" />
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}
