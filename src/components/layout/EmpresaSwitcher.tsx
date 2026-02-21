'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/stores/app-store'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Building2, Check, ChevronsUpDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Empresa {
  id: string
  ruc: string
  razon_social: string
}

const STORAGE_KEY = 'kronos_empresa_seleccionada'

export function EmpresaSwitcher() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const { empresaId, setEmpresaId, userId } = useAppStore()
  const supabase = createClient()

  useEffect(() => {
    async function fetchEmpresas() {
      if (!userId) return

      try {
        const { data, error } = await supabase
          .from('usuario_empresas')
          .select('empresa_id, empresas(id, ruc, razon_social)')
          .eq('user_id', userId)

        if (error) {
          console.error('Error fetching empresas:', error)
          return
        }

        const mapped: Empresa[] = (data ?? [])
          .filter((row: Record<string, unknown>) => row.empresas)
          .map((row: Record<string, unknown>) => {
            const emp = row.empresas as Empresa
            return {
              id: emp.id,
              ruc: emp.ruc,
              razon_social: emp.razon_social,
            }
          })

        setEmpresas(mapped)

        if (!empresaId && mapped.length > 0) {
          const stored = localStorage.getItem(STORAGE_KEY)
          const defaultId = stored && mapped.find((e) => e.id === stored)
            ? stored
            : mapped[0].id
          setEmpresaId(defaultId)
          localStorage.setItem(STORAGE_KEY, defaultId)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchEmpresas()
  }, [userId, supabase, empresaId, setEmpresaId])

  function handleSelect(id: string) {
    setEmpresaId(id)
    localStorage.setItem(STORAGE_KEY, id)
    setOpen(false)
  }

  const currentEmpresa = empresas.find((e) => e.id === empresaId)

  if (loading) {
    return <Skeleton className="h-9 w-48 bg-zinc-800/50" />
  }

  if (empresas.length === 0) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-zinc-100"
        >
          <Building2 className="h-4 w-4 text-emerald-400" />
          <span className="max-w-[180px] truncate">
            {currentEmpresa?.razon_social ?? 'Seleccionar empresa'}
          </span>
          <ChevronsUpDown className="h-3 w-3 text-zinc-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 border-zinc-700 bg-zinc-900 p-2"
        align="start"
      >
        <p className="mb-2 px-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Mis Empresas
        </p>
        <div className="space-y-0.5">
          {empresas.map((empresa) => (
            <button
              key={empresa.id}
              onClick={() => handleSelect(empresa.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors',
                empresa.id === empresaId
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
              )}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{empresa.razon_social}</p>
                <p className="text-xs text-zinc-500">RUC: {empresa.ruc}</p>
              </div>
              {empresa.id === empresaId && (
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
