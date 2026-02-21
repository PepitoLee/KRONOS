'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/stores/app-store'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Building2,
  BookOpen,
  FileText,
  PartyPopper,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  BarChart3,
  TrendingUp,
  Bot,
} from 'lucide-react'
import Link from 'next/link'

const STORAGE_KEY = 'kronos_onboarding_complete'

interface EmpresaForm {
  ruc: string
  razon_social: string
  direccion: string
}

const stepsMeta = [
  { icon: Building2, title: 'Datos de Empresa' },
  { icon: BookOpen, title: 'Plan Contable' },
  { icon: FileText, title: 'Primer Documento' },
  { icon: PartyPopper, title: 'Completado' },
]

export function SetupWizard() {
  const { currentStep, setCurrentStep, setCompleted, showWelcome } = useOnboardingStore()
  const { empresaId } = useAppStore()
  const supabase = createClient()

  const [empresaForm, setEmpresaForm] = useState<EmpresaForm>({
    ruc: '',
    razon_social: '',
    direccion: '',
  })
  const [saving, setSaving] = useState(false)
  const [pcgeStatus, setPcgeStatus] = useState<'none' | 'exists' | 'generating'>('none')
  const [pcgeCount, setPcgeCount] = useState(0)

  useEffect(() => {
    async function loadEmpresa() {
      if (!empresaId) return

      const { data } = await supabase
        .from('empresas')
        .select('ruc, razon_social, direccion')
        .eq('id', empresaId)
        .single()

      if (data) {
        setEmpresaForm({
          ruc: data.ruc ?? '',
          razon_social: data.razon_social ?? '',
          direccion: data.direccion ?? '',
        })
      }
    }

    loadEmpresa()
  }, [empresaId, supabase])

  useEffect(() => {
    async function checkPCGE() {
      if (!empresaId) return

      const { count } = await supabase
        .from('plan_contable')
        .select('id', { count: 'exact', head: true })
        .eq('empresa_id', empresaId)

      setPcgeCount(count ?? 0)
      setPcgeStatus(count && count > 0 ? 'exists' : 'none')
    }

    if (currentStep === 2) {
      checkPCGE()
    }
  }, [currentStep, empresaId, supabase])

  if (showWelcome || currentStep < 1) return null

  const progress = (currentStep / stepsMeta.length) * 100

  async function handleSaveEmpresa() {
    if (!empresaId) return
    setSaving(true)
    try {
      await supabase
        .from('empresas')
        .update({
          ruc: empresaForm.ruc,
          razon_social: empresaForm.razon_social,
          direccion: empresaForm.direccion,
        })
        .eq('id', empresaId)
    } finally {
      setSaving(false)
      setCurrentStep(2)
    }
  }

  async function handleGeneratePCGE() {
    if (!empresaId) return
    setPcgeStatus('generating')

    const baseCuentas = [
      { codigo: '10', nombre: 'Efectivo y Equivalentes de Efectivo', nivel: 2, tipo: 'activo' },
      { codigo: '101', nombre: 'Caja', nivel: 3, tipo: 'activo' },
      { codigo: '1011', nombre: 'Caja - Moneda Nacional', nivel: 4, tipo: 'activo' },
      { codigo: '104', nombre: 'Cuentas Corrientes en Instituciones Financieras', nivel: 3, tipo: 'activo' },
      { codigo: '1041', nombre: 'Cuentas Corrientes Operativas', nivel: 4, tipo: 'activo' },
      { codigo: '12', nombre: 'Cuentas por Cobrar Comerciales - Terceros', nivel: 2, tipo: 'activo' },
      { codigo: '121', nombre: 'Facturas, Boletas y Otros Comprobantes por Cobrar', nivel: 3, tipo: 'activo' },
      { codigo: '1212', nombre: 'Emitidas en Cartera', nivel: 4, tipo: 'activo' },
      { codigo: '20', nombre: 'Mercaderias', nivel: 2, tipo: 'activo' },
      { codigo: '201', nombre: 'Mercaderias Manufacturadas', nivel: 3, tipo: 'activo' },
      { codigo: '33', nombre: 'Inmuebles, Maquinaria y Equipo', nivel: 2, tipo: 'activo' },
      { codigo: '335', nombre: 'Muebles y Enseres', nivel: 3, tipo: 'activo' },
      { codigo: '336', nombre: 'Equipos Diversos', nivel: 3, tipo: 'activo' },
      { codigo: '40', nombre: 'Tributos, Contraprestaciones y Aportes por Pagar', nivel: 2, tipo: 'pasivo' },
      { codigo: '4011', nombre: 'IGV - Cuenta Propia', nivel: 4, tipo: 'pasivo' },
      { codigo: '4017', nombre: 'Impuesto a la Renta', nivel: 4, tipo: 'pasivo' },
      { codigo: '42', nombre: 'Cuentas por Pagar Comerciales - Terceros', nivel: 2, tipo: 'pasivo' },
      { codigo: '421', nombre: 'Facturas, Boletas y Otros Comprobantes por Pagar', nivel: 3, tipo: 'pasivo' },
      { codigo: '4212', nombre: 'Emitidas', nivel: 4, tipo: 'pasivo' },
      { codigo: '50', nombre: 'Capital', nivel: 2, tipo: 'patrimonio' },
      { codigo: '501', nombre: 'Capital Social', nivel: 3, tipo: 'patrimonio' },
      { codigo: '59', nombre: 'Resultados Acumulados', nivel: 2, tipo: 'patrimonio' },
      { codigo: '591', nombre: 'Utilidades no Distribuidas', nivel: 3, tipo: 'patrimonio' },
      { codigo: '60', nombre: 'Compras', nivel: 2, tipo: 'gasto' },
      { codigo: '601', nombre: 'Mercaderias', nivel: 3, tipo: 'gasto' },
      { codigo: '6011', nombre: 'Mercaderias Manufacturadas', nivel: 4, tipo: 'gasto' },
      { codigo: '62', nombre: 'Gastos de Personal, Directores y Gerentes', nivel: 2, tipo: 'gasto' },
      { codigo: '621', nombre: 'Remuneraciones', nivel: 3, tipo: 'gasto' },
      { codigo: '6211', nombre: 'Sueldos y Salarios', nivel: 4, tipo: 'gasto' },
      { codigo: '63', nombre: 'Gastos de Servicios Prestados por Terceros', nivel: 2, tipo: 'gasto' },
      { codigo: '636', nombre: 'Servicios Basicos', nivel: 3, tipo: 'gasto' },
      { codigo: '70', nombre: 'Ventas', nivel: 2, tipo: 'ingreso' },
      { codigo: '701', nombre: 'Mercaderias', nivel: 3, tipo: 'ingreso' },
      { codigo: '7011', nombre: 'Mercaderias Manufacturadas', nivel: 4, tipo: 'ingreso' },
      { codigo: '7011.1', nombre: 'Terceros', nivel: 5, tipo: 'ingreso' },
    ]

    const rows = baseCuentas.map((c) => ({
      empresa_id: empresaId,
      codigo: c.codigo,
      nombre: c.nombre,
      nivel: c.nivel,
      tipo: c.tipo,
      activo: true,
    }))

    const { error } = await supabase.from('plan_contable').upsert(rows, {
      onConflict: 'empresa_id,codigo',
    })

    if (!error) {
      setPcgeStatus('exists')
      setPcgeCount(rows.length)
    } else {
      console.error('Error generating PCGE:', error)
      setPcgeStatus('none')
    }
  }

  function handleComplete() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setCompleted(true)
    setCurrentStep(0)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-xl rounded-2xl border border-zinc-800 bg-[#0d1117] shadow-2xl">
        {/* Progress header */}
        <div className="border-b border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-3">
            {stepsMeta.map((step, i) => {
              const Icon = step.icon
              const stepNum = i + 1
              const isActive = currentStep === stepNum
              const isDone = currentStep > stepNum
              return (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isActive
                          ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/50'
                          : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  {i < stepsMeta.length - 1 && (
                    <div
                      className={`hidden sm:block h-0.5 w-12 ${
                        currentStep > stepNum ? 'bg-emerald-500' : 'bg-zinc-800'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <Progress value={progress} className="h-1" />
          <p className="mt-2 text-sm text-zinc-400">
            Paso {currentStep} de {stepsMeta.length} — {stepsMeta[currentStep - 1]?.title}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">Datos de tu empresa</h3>
                <p className="text-sm text-zinc-500">
                  Ingresa la información basica de tu empresa para comenzar.
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-zinc-400">RUC</Label>
                  <Input
                    value={empresaForm.ruc}
                    onChange={(e) =>
                      setEmpresaForm((prev) => ({ ...prev, ruc: e.target.value }))
                    }
                    placeholder="20123456789"
                    maxLength={11}
                    className="mt-1 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400">Razon Social</Label>
                  <Input
                    value={empresaForm.razon_social}
                    onChange={(e) =>
                      setEmpresaForm((prev) => ({ ...prev, razon_social: e.target.value }))
                    }
                    placeholder="Mi Empresa SAC"
                    className="mt-1 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400">Direccion</Label>
                  <Input
                    value={empresaForm.direccion}
                    onChange={(e) =>
                      setEmpresaForm((prev) => ({ ...prev, direccion: e.target.value }))
                    }
                    placeholder="Av. Principal 123, Lima"
                    className="mt-1 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">Plan Contable General Empresarial</h3>
                <p className="text-sm text-zinc-500">
                  El PCGE es obligatorio para empresas peruanas. Puedes generar el plan base o importar uno personalizado.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                {pcgeStatus === 'exists' ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                      <Check className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-400">
                        Plan contable configurado
                      </p>
                      <p className="text-xs text-zinc-500">
                        {pcgeCount} cuentas registradas
                      </p>
                    </div>
                  </div>
                ) : pcgeStatus === 'generating' ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                    <p className="text-sm text-zinc-400">Generando plan contable base...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                        <BookOpen className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-300">
                          Sin plan contable
                        </p>
                        <p className="text-xs text-zinc-500">
                          Genera el PCGE base con las cuentas mas comunes
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleGeneratePCGE}
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Generar PCGE Base
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">Registra tu primer documento</h3>
                <p className="text-sm text-zinc-500">
                  Registra una factura de compra o venta para ver como funciona KRONOS.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
                <FileText className="mx-auto h-12 w-12 text-zinc-600" />
                <p className="mt-3 text-sm text-zinc-400">
                  Crea tu primera factura para activar los reportes y estados financieros.
                </p>
                <Link href="/documentos/nuevo">
                  <Button className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700">
                    <FileText className="mr-2 h-4 w-4" />
                    Crear Documento
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20">
                  <PartyPopper className="h-9 w-9 text-emerald-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-100">Configuración completada</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Tu empresa esta lista. Explora los modulos de KRONOS para gestionar tu contabilidad.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/documentos"
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center transition-colors hover:border-emerald-500/30"
                >
                  <FileText className="mx-auto h-6 w-6 text-emerald-400" />
                  <p className="mt-2 text-xs font-medium text-zinc-300">Documentos</p>
                </Link>
                <Link
                  href="/estados-financieros"
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center transition-colors hover:border-emerald-500/30"
                >
                  <BarChart3 className="mx-auto h-6 w-6 text-blue-400" />
                  <p className="mt-2 text-xs font-medium text-zinc-300">Estados Financieros</p>
                </Link>
                <Link
                  href="/indicadores"
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center transition-colors hover:border-emerald-500/30"
                >
                  <TrendingUp className="mx-auto h-6 w-6 text-amber-400" />
                  <p className="mt-2 text-xs font-medium text-zinc-300">Indicadores</p>
                </Link>
                <Link
                  href="/ai"
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center transition-colors hover:border-emerald-500/30"
                >
                  <Bot className="mx-auto h-6 w-6 text-purple-400" />
                  <p className="mt-2 text-xs font-medium text-zinc-300">KRONOS AI</p>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between border-t border-zinc-800 p-6">
          {currentStep > 1 && currentStep < 4 ? (
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="text-zinc-400 hover:text-zinc-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
          ) : (
            <div />
          )}

          {currentStep === 1 && (
            <Button
              onClick={handleSaveEmpresa}
              disabled={saving}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Siguiente
            </Button>
          )}
          {currentStep === 2 && (
            <Button
              onClick={() => setCurrentStep(3)}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {currentStep === 3 && (
            <Button
              onClick={() => setCurrentStep(4)}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {currentStep === 4 && (
            <Button
              onClick={handleComplete}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Check className="mr-2 h-4 w-4" />
              Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

