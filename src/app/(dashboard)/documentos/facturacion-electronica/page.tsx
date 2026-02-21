'use client'

import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { Receipt, Send, CheckCircle2, XCircle, Clock, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

const stats = [
  { label: 'Emitidas', valor: 0, icon: CheckCircle2, color: 'text-emerald-400' },
  { label: 'Pendientes', valor: 0, icon: Clock, color: 'text-amber-400' },
  { label: 'Aceptadas', valor: 0, icon: CheckCircle2, color: 'text-blue-400' },
  { label: 'Rechazadas', valor: 0, icon: XCircle, color: 'text-red-400' },
]

export default function FacturacionElectronicaPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <Receipt className="h-7 w-7 text-emerald-400" />
          Facturacion Electronica
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Emision de comprobantes electronicos conectados a SUNAT
        </p>
      </div>

      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-300">Modulo en desarrollo</p>
            <p className="text-xs text-blue-400/70 mt-1">
              La facturacion electronica requiere certificado digital y conexion con un OSE
              autorizado por SUNAT. Este modulo genera la estructura UBL 2.1 necesaria para la
              emision.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl border border-zinc-800 bg-[#111827] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.valor}</p>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#111827] overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-100">Documentos Recientes</h3>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-zinc-700 text-zinc-500"
            disabled
          >
            <Send className="h-3 w-3" />
            Enviar a SUNAT
          </Button>
        </div>
        <div className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">
            No hay documentos electronicos registrados
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Configure su certificado digital y OSE para comenzar a emitir comprobantes electronicos
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#111827] p-6">
        <h3 className="text-sm font-semibold text-zinc-100 mb-4">Requisitos para Activar</h3>
        <div className="space-y-3">
          {[
            { step: 'Certificado digital vigente (SUNAT)', done: false },
            { step: 'Conexion con OSE autorizado (Nubefact, Bizlinks, etc.)', done: false },
            { step: 'Clave SOL configurada', done: false },
            { step: 'Serie de facturacion electronica asignada', done: false },
          ].map((req) => (
            <div key={req.step} className="flex items-center gap-3">
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  req.done ? 'border-emerald-400 bg-emerald-400/20' : 'border-zinc-600'
                }`}
              >
                {req.done && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
              </div>
              <span className={`text-sm ${req.done ? 'text-zinc-300' : 'text-zinc-500'}`}>
                {req.step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
