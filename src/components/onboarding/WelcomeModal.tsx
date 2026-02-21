'use client'

import { useEffect } from 'react'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { DollarSign, Settings, FileText, BarChart3, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'kronos_onboarding_complete'

const steps = [
  {
    icon: Settings,
    title: 'Configura tu empresa',
    description: 'Ingresa los datos de tu empresa, RUC y plan contable para comenzar.',
  },
  {
    icon: FileText,
    title: 'Registra documentos',
    description: 'Registra tus facturas de compra y venta para llevar el control contable.',
  },
  {
    icon: BarChart3,
    title: 'Visualiza reportes',
    description: 'Accede a estados financieros, ratios e indicadores en tiempo real.',
  },
]

export function WelcomeModal() {
  const { showWelcome, setShowWelcome, setCurrentStep } = useOnboardingStore()

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      setShowWelcome(true)
    }
  }, [setShowWelcome])

  if (!showWelcome) return null

  function handleStart() {
    setShowWelcome(false)
    setCurrentStep(1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#0d1117] p-8 shadow-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20">
            <DollarSign className="h-9 w-9 text-emerald-400" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-zinc-100">
            Bienvenido a KRONOS
          </h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-sm">
            Tu ERP financiero inteligente para gestionar la contabilidad de tu empresa peruana de forma simple y eficiente.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-8 space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={index}
                className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-emerald-400">
                      Paso {index + 1}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    {step.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col gap-3">
          <Button
            onClick={handleStart}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Comenzar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <button
            onClick={() => {
              setShowWelcome(false)
              localStorage.setItem(STORAGE_KEY, 'true')
            }}
            className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            Omitir configuración inicial
          </button>
        </div>
      </div>
    </div>
  )
}
