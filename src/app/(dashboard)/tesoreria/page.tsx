'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { formatCurrency } from '@/lib/utils/currency'
import Link from 'next/link'
import {
  Wallet,
  Landmark,
  ArrowRight,
  ClipboardCheck,
  ArrowUpDown,
  FileCheck2,
  Building2,
} from 'lucide-react'

interface CuentaBancaria {
  id: string
  nombre: string
  banco: string
  numero_cuenta: string
  moneda: 'PEN' | 'USD'
  saldo: number
  tipo: string
}

export default function TesoreriaPage() {
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCuentas() {
      try {
        const { data, error } = await supabase
          .from('cuentas_bancarias')
          .select('id, nombre, banco, numero_cuenta, moneda, saldo, tipo')
          .order('banco', { ascending: true })

        if (error) {
          console.error('Error fetching cuentas bancarias:', error)
          return
        }

        setCuentas(data ?? [])
      } finally {
        setLoading(false)
      }
    }

    fetchCuentas()
  }, [supabase])

  const saldoTotalPEN = cuentas
    .filter((c) => c.moneda === 'PEN')
    .reduce((sum, c) => sum + c.saldo, 0)

  const saldoTotalUSD = cuentas
    .filter((c) => c.moneda === 'USD')
    .reduce((sum, c) => sum + c.saldo, 0)

  const modules = [
    {
      title: 'Cuadre de Caja',
      description:
        'Concilia el saldo fisico de caja con los movimientos del sistema. Registra diferencias por turno.',
      href: '/tesoreria/cuadre-caja',
      icon: ClipboardCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      title: 'Depositos',
      description:
        'Registra y gestiona depositos bancarios. Controla el estado de verificacion y conciliacion.',
      href: '/tesoreria/depositos',
      icon: ArrowUpDown,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Conciliaciones Bancarias',
      description:
        'Compara los saldos contables con los extractos bancarios para identificar diferencias.',
      href: '/tesoreria/conciliaciones',
      icon: FileCheck2,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
  ]

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <Wallet className="h-7 w-7 text-emerald-400" />
          Tesoreria
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Gestion de caja, depositos bancarios y conciliaciones
        </p>
      </div>

      {/* Bank Account Summary */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-zinc-400" />
          <h3 className="text-lg font-semibold text-zinc-100">Saldos de Cuentas Bancarias</h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-800/50" />
            ))}
          </div>
        ) : cuentas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Landmark className="h-12 w-12 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">No se encontraron cuentas bancarias registradas.</p>
            <p className="text-xs text-zinc-600 mt-1">
              Configure las cuentas bancarias en la seccion de administracion.
            </p>
          </div>
        ) : (
          <>
            {/* Totals */}
            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-sm text-zinc-400">Total Soles (PEN)</p>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {formatCurrency(saldoTotalPEN, 'PEN')}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {cuentas.filter((c) => c.moneda === 'PEN').length} cuenta(s)
                </p>
              </div>
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                <p className="text-sm text-zinc-400">Total Dolares (USD)</p>
                <p className="text-2xl font-bold font-mono text-blue-400 mt-1">
                  {formatCurrency(saldoTotalUSD, 'USD')}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {cuentas.filter((c) => c.moneda === 'USD').length} cuenta(s)
                </p>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-2">
              {cuentas.map((cuenta) => (
                <div
                  key={cuenta.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-zinc-800 p-2">
                      <Building2 className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{cuenta.nombre}</p>
                      <p className="text-xs text-zinc-500">
                        {cuenta.banco} - {cuenta.numero_cuenta}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold font-mono ${
                        cuenta.moneda === 'PEN' ? 'text-emerald-400' : 'text-blue-400'
                      }`}
                    >
                      {formatCurrency(cuenta.saldo, cuenta.moneda)}
                    </p>
                    <p className="text-xs text-zinc-500 capitalize">{cuenta.tipo}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Module Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        {modules.map((mod) => {
          const Icon = mod.icon
          return (
            <Link key={mod.href} href={mod.href}>
              <div
                className={`group relative rounded-xl border ${mod.borderColor} ${mod.bgColor} p-6 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20`}
              >
                <div className={`mb-4 inline-flex rounded-lg ${mod.bgColor} p-3`}>
                  <Icon className={`h-7 w-7 ${mod.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-white">
                  {mod.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{mod.description}</p>
                <div className={`mt-4 inline-flex items-center text-sm font-medium ${mod.color}`}>
                  Ir al modulo
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
