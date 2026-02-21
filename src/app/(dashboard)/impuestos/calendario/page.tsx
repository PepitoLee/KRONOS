'use client'

import { useState, useMemo } from 'react'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Vencimiento {
  fecha: string
  obligacion: string
  formulario: string
  descripcion: string
  prioridad: 'alta' | 'media' | 'baja'
}

function getVencimientoDay(ultimoDigito: string): number {
  const map: Record<string, number> = {
    '0': 12, '1': 13, '2': 14, '3': 14,
    '4': 15, '5': 15, '6': 16, '7': 16,
    '8': 17, '9': 17,
  }
  return map[ultimoDigito] ?? 15
}

function generarCalendario(anio: number, digitoRUC: string): Vencimiento[] {
  const diaVenc = getVencimientoDay(digitoRUC)
  const vencimientos: Vencimiento[] = []

  for (let mes = 1; mes <= 12; mes++) {
    const periodoRef = mes === 1
      ? `${anio - 1}-12`
      : `${anio}-${String(mes - 1).padStart(2, '0')}`
    const fechaVenc = `${anio}-${String(mes).padStart(2, '0')}-${String(diaVenc).padStart(2, '0')}`

    vencimientos.push({
      fecha: fechaVenc,
      obligacion: `PDT 621 - Periodo ${periodoRef}`,
      formulario: 'F. Virtual 621',
      descripcion: 'Declaracion y pago mensual IGV-Renta',
      prioridad: 'alta',
    })

    vencimientos.push({
      fecha: fechaVenc,
      obligacion: `PLAME - Periodo ${periodoRef}`,
      formulario: 'PDT PLAME',
      descripcion: 'Planilla electronica mensual',
      prioridad: 'alta',
    })

    vencimientos.push({
      fecha: fechaVenc,
      obligacion: `Libros PLE - Periodo ${periodoRef}`,
      formulario: 'PLE 5.2',
      descripcion: 'Libros electronicos del periodo',
      prioridad: 'media',
    })
  }

  // DJ Anual (marzo)
  vencimientos.push({
    fecha: `${anio}-03-${String(Math.min(diaVenc + 15, 31)).padStart(2, '0')}`,
    obligacion: `DJ Anual IR ${anio - 1}`,
    formulario: 'F. Virtual 710',
    descripcion: 'Declaracion jurada anual del Impuesto a la Renta',
    prioridad: 'alta',
  })

  return vencimientos.sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export default function CalendarioTributarioPage() {
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [digitoRUC, setDigitoRUC] = useState('1')
  const [mesFilter, setMesFilter] = useState(new Date().getMonth() + 1)

  const calendario = useMemo(() => generarCalendario(anio, digitoRUC), [anio, digitoRUC])
  const hoy = new Date().toISOString().split('T')[0]

  const vencimientosMes = calendario.filter((v) => {
    const mes = parseInt(v.fecha.split('-')[1])
    return mes === mesFilter
  })

  const proximosVencimientos = calendario
    .filter((v) => v.fecha >= hoy)
    .slice(0, 5)

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <CalendarIcon className="h-7 w-7 text-emerald-400" />
          Calendario Tributario {anio}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">Vencimientos SUNAT segun ultimo digito de RUC</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-400">Año:</label>
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 outline-none"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-400">Ultimo digito RUC:</label>
          <select
            value={digitoRUC}
            onChange={(e) => setDigitoRUC(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 outline-none"
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i} value={String(i)}>{i}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Proximos Vencimientos */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-amber-400">
          <Clock className="h-5 w-5" />
          Proximos Vencimientos
        </h3>
        <div className="space-y-3">
          {proximosVencimientos.map((v, i) => {
            const vencDate = new Date(v.fecha + 'T12:00:00')
            const diasRestantes = Math.ceil((vencDate.getTime() - new Date().getTime()) / 86400000)
            return (
              <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <div className="flex items-center gap-3">
                  {diasRestantes <= 7 ? (
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  ) : (
                    <CalendarIcon className="h-4 w-4 text-zinc-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{v.obligacion}</p>
                    <p className="text-xs text-zinc-500">{v.formulario}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-300">{new Date(v.fecha + 'T12:00:00').toLocaleDateString('es-PE')}</p>
                  <p className={`text-xs font-medium ${diasRestantes <= 7 ? 'text-red-400' : diasRestantes <= 15 ? 'text-amber-400' : 'text-zinc-500'}`}>
                    {diasRestantes} dias
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Month Selector + Detail */}
      <div className="rounded-xl border border-zinc-800 bg-[#111827] overflow-hidden">
        <div className="flex overflow-x-auto border-b border-zinc-800">
          {meses.map((m, i) => (
            <button
              key={m}
              onClick={() => setMesFilter(i + 1)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors ${
                mesFilter === i + 1
                  ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="divide-y divide-zinc-800/50">
          {vencimientosMes.length > 0 ? (
            vencimientosMes.map((v, i) => {
              const isPast = v.fecha < hoy
              return (
                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/20">
                  <div className="flex items-center gap-3">
                    {isPast ? (
                      <CheckCircle2 className="h-4 w-4 text-zinc-600" />
                    ) : v.prioridad === 'alta' ? (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    ) : (
                      <CalendarIcon className="h-4 w-4 text-zinc-500" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${isPast ? 'text-zinc-600' : 'text-zinc-200'}`}>{v.obligacion}</p>
                      <p className="text-xs text-zinc-500">{v.descripcion}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${isPast ? 'text-zinc-600' : 'text-zinc-300'}`}>
                      {new Date(v.fecha + 'T12:00:00').toLocaleDateString('es-PE')}
                    </p>
                    <span className={`text-xs ${
                      v.prioridad === 'alta' ? 'text-red-400' :
                      v.prioridad === 'media' ? 'text-amber-400' : 'text-zinc-500'
                    }`}>
                      {v.formulario}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="px-6 py-8 text-center text-zinc-500 text-sm">
              No hay vencimientos para este mes
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
