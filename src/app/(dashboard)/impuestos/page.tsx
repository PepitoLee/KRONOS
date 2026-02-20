'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { formatCurrency } from '@/lib/utils/currency'
import { getCurrentPeriod } from '@/lib/utils/dates'
import { calcularIGV, calcularRentaAnual } from '@/lib/calculations/taxes'
import { IGV_TASA } from '@/types/common'
import Link from 'next/link'
import { Receipt, Landmark, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

interface ResumenIGV {
  igvVentas: number
  igvCompras: number
  igvAPagar: number
  creditoFiscalFavor: number
}

interface ResumenRenta {
  ingresoAnualProyectado: number
  impuestoEstimado: number
  pagoACuentaMensual: number
}

export default function ImpuestosPage() {
  const [resumenIGV, setResumenIGV] = useState<ResumenIGV>({
    igvVentas: 0,
    igvCompras: 0,
    igvAPagar: 0,
    creditoFiscalFavor: 0,
  })
  const [resumenRenta, setResumenRenta] = useState<ResumenRenta>({
    ingresoAnualProyectado: 0,
    impuestoEstimado: 0,
    pagoACuentaMensual: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchResumen() {
      try {
        const periodo = getCurrentPeriod()
        const inicioMes = `${periodo}-01`
        const [anio, mes] = periodo.split('-').map(Number)
        const finMes = new Date(anio, mes, 0).toISOString().split('T')[0]

        const { data: documentos } = await supabase
          .from('documentos')
          .select('tipo_operacion, subtotal, igv, total')
          .gte('fecha_emision', inicioMes)
          .lte('fecha_emision', finMes)
          .neq('estado', 'anulado')

        const docs = documentos ?? []

        const totalVentasSinIGV = docs
          .filter((d) => d.tipo_operacion === 'venta')
          .reduce((sum, d) => sum + (d.subtotal ?? d.total / (1 + IGV_TASA)), 0)

        const totalComprasSinIGV = docs
          .filter((d) => d.tipo_operacion === 'compra')
          .reduce((sum, d) => sum + (d.subtotal ?? d.total / (1 + IGV_TASA)), 0)

        const igvCalc = calcularIGV(totalVentasSinIGV, totalComprasSinIGV, periodo)

        setResumenIGV({
          igvVentas: igvCalc.igvVentas,
          igvCompras: igvCalc.igvCompras,
          igvAPagar: igvCalc.igvAPagar,
          creditoFiscalFavor: igvCalc.creditoFiscalFavor,
        })

        const mesActual = new Date().getMonth() + 1
        const ingresosAcumulados = docs
          .filter((d) => d.tipo_operacion === 'venta')
          .reduce((sum, d) => sum + (d.subtotal ?? d.total / (1 + IGV_TASA)), 0)

        const ingresoAnualProyectado = ingresosAcumulados * (12 / mesActual)
        const gastosEstimados = ingresoAnualProyectado * 0.7
        const utilidadEstimada = ingresoAnualProyectado - gastosEstimados

        const rentaCalc = calcularRentaAnual(utilidadEstimada, 'GENERAL', ingresosAcumulados)

        setResumenRenta({
          ingresoAnualProyectado,
          impuestoEstimado: rentaCalc.impuestoRenta,
          pagoACuentaMensual: rentaCalc.pagoACuentaMensual,
        })
      } catch (error) {
        console.error('Error fetching tax summary:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResumen()
  }, [supabase])

  const modules = [
    {
      title: 'IGV - Impuesto General a las Ventas',
      description:
        'Calcula el IGV mensual: debito fiscal (ventas) menos credito fiscal (compras). Visualiza la evolucion y detalle de documentos.',
      href: '/impuestos/igv',
      icon: Receipt,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      summary: loading ? null : (
        <div className="mt-4 space-y-2 border-t border-emerald-500/10 pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">IGV Ventas (Debito)</span>
            <span className="font-mono text-emerald-400">{formatCurrency(resumenIGV.igvVentas)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">IGV Compras (Credito)</span>
            <span className="font-mono text-sky-400">{formatCurrency(resumenIGV.igvCompras)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-zinc-300">
              {resumenIGV.igvAPagar > 0 ? 'IGV a Pagar' : 'Credito Fiscal a Favor'}
            </span>
            <span className={`font-mono ${resumenIGV.igvAPagar > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {formatCurrency(resumenIGV.igvAPagar > 0 ? resumenIGV.igvAPagar : resumenIGV.creditoFiscalFavor)}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Impuesto a la Renta',
      description:
        'Proyeccion anual del Impuesto a la Renta empresarial, pagos a cuenta mensuales y calendario tributario.',
      href: '/impuestos/renta',
      icon: Landmark,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      summary: loading ? null : (
        <div className="mt-4 space-y-2 border-t border-blue-500/10 pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Ingreso Anual Proyectado</span>
            <span className="font-mono text-blue-400">{formatCurrency(resumenRenta.ingresoAnualProyectado)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">IR Estimado Anual</span>
            <span className="font-mono text-amber-400">{formatCurrency(resumenRenta.impuestoEstimado)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-zinc-300">Pago a Cuenta Mensual</span>
            <span className="font-mono text-red-400">{formatCurrency(resumenRenta.pagoACuentaMensual)}</span>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <Landmark className="h-7 w-7 text-emerald-400" />
          Impuestos
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Gestion tributaria: IGV mensual e Impuesto a la Renta empresarial segun normativa SUNAT
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
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
                {loading ? (
                  <div className="mt-4 space-y-2 border-t border-zinc-800/50 pt-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-4 animate-pulse rounded bg-zinc-800/50" />
                    ))}
                  </div>
                ) : (
                  mod.summary
                )}
                <div className={`mt-4 inline-flex items-center text-sm font-medium ${mod.color}`}>
                  Ver detalle
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
