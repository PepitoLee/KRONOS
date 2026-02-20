'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils/currency'

interface KPICardProps {
  title: string
  value: number
  previousValue?: number
  format?: 'currency' | 'number' | 'percent'
  icon?: React.ElementType
  className?: string
}

export function KPICard({
  title,
  value,
  previousValue,
  format = 'currency',
  icon: Icon,
  className,
}: KPICardProps) {
  const variation = previousValue
    ? ((value - previousValue) / Math.abs(previousValue)) * 100
    : null

  const formattedValue =
    format === 'currency'
      ? formatCurrency(value)
      : format === 'percent'
        ? formatPercent(value)
        : formatNumber(value, 0)

  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-800 bg-[#111827] p-5 transition-colors hover:border-zinc-700',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-400">{title}</p>
        {Icon && (
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <Icon className="h-4 w-4 text-emerald-400" />
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-100 font-mono">
        {formattedValue}
      </p>
      {variation !== null && (
        <div className="mt-2 flex items-center gap-1">
          {variation > 0 ? (
            <TrendingUp className="h-3 w-3 text-emerald-400" />
          ) : variation < 0 ? (
            <TrendingDown className="h-3 w-3 text-red-400" />
          ) : (
            <Minus className="h-3 w-3 text-zinc-500" />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              variation > 0
                ? 'text-emerald-400'
                : variation < 0
                  ? 'text-red-400'
                  : 'text-zinc-500'
            )}
          >
            {variation > 0 ? '+' : ''}
            {formatPercent(variation)} vs anterior
          </span>
        </div>
      )}
    </div>
  )
}
