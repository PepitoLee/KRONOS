'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils/currency'
import { getCurrentPeriod } from '@/lib/utils/dates'
import { calcularPlanillaEmpleado, type PayrollResult } from '@/lib/calculations/payroll'
import { Calculator, Loader2, Check, Save } from 'lucide-react'
import { toast } from 'sonner'

interface Empleado {
  id: string
  nombres: string
  apellidos: string
  sueldo_basico: number
  asignacion_familiar: boolean
  cargo: string
  area: string
}

interface EmpleadoConCalculo extends Empleado {
  resultado?: PayrollResult
  sistemaPrevisional: 'onp' | 'afp'
  horasExtra25: number
  horasExtra35: number
  bonificaciones: number
  adelantos: number
}

export default function CalcularPlanillaPage() {
  const [empleados, setEmpleados] = useState<EmpleadoConCalculo[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [periodo, setPeriodo] = useState(getCurrentPeriod())
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('empleados')
        .select('id, nombres, apellidos, sueldo_basico, asignacion_familiar, cargo, area')
        .eq('estado', 'activo')
        .order('apellidos')

      setEmpleados(
        (data ?? []).map((e) => ({
          ...(e as Empleado),
          sistemaPrevisional: 'onp' as const,
          horasExtra25: 0,
          horasExtra35: 0,
          bonificaciones: 0,
          adelantos: 0,
        }))
      )
      setLoading(false)
    }
    load()
  }, [supabase])

  function calcularTodos() {
    setCalculating(true)
    const actualizados = empleados.map((emp) => ({
      ...emp,
      resultado: calcularPlanillaEmpleado({
        sueldoBasico: emp.sueldo_basico,
        asignacionFamiliar: emp.asignacion_familiar,
        horasExtra25: emp.horasExtra25,
        horasExtra35: emp.horasExtra35,
        bonificaciones: emp.bonificaciones,
        comisiones: 0,
        otrosIngresos: 0,
        sistemaPrevisional: emp.sistemaPrevisional,
        adelantos: emp.adelantos,
        prestamos: 0,
        otrosDescuentos: 0,
        diasTrabajados: 30,
        horasTrabajadas: 240,
      }),
    }))
    setEmpleados(actualizados)
    setCalculating(false)
    toast.success('Planilla calculada para todos los empleados')
  }

  async function guardarPlanilla() {
    if (!empleados.some((e) => e.resultado)) {
      toast.error('Primero calcule la planilla')
      return
    }

    setSaving(true)
    try {
      const empleadosConResultado = empleados.filter((e) => e.resultado)
      const totalBruto = empleadosConResultado.reduce((s, e) => s + (e.resultado?.totalBruto ?? 0), 0)
      const totalDescuentos = empleadosConResultado.reduce((s, e) => s + (e.resultado?.totalDescuentos ?? 0), 0)
      const totalAportes = empleadosConResultado.reduce((s, e) => s + (e.resultado?.essaludEmpleador ?? 0) + (e.resultado?.sctr ?? 0), 0)
      const totalNeto = empleadosConResultado.reduce((s, e) => s + (e.resultado?.netoPagar ?? 0), 0)

      const userRes = await supabase.auth.getUser()
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', userRes.data.user?.id)
        .single()

      // Insertar planilla
      const { data: planilla, error: planillaError } = await supabase
        .from('planillas')
        .insert({
          empresa_id: usuario?.empresa_id,
          periodo,
          tipo: 'mensual',
          estado: 'calculado',
          total_bruto: totalBruto,
          total_descuentos: totalDescuentos,
          total_aportes: totalAportes,
          total_neto: totalNeto,
        })
        .select()
        .single()

      if (planillaError) throw planillaError

      // Insertar detalles
      const detalles = empleadosConResultado.map((emp) => ({
        planilla_id: planilla.id,
        empleado_id: emp.id,
        sueldo_basico: emp.resultado!.sueldoBasico,
        asignacion_familiar: emp.resultado!.asignacionFamiliar,
        horas_extra_25: emp.resultado!.horasExtra25Monto,
        horas_extra_35: emp.resultado!.horasExtra35Monto,
        bonificaciones: emp.resultado!.bonificaciones,
        total_bruto: emp.resultado!.totalBruto,
        onp: emp.resultado!.onp,
        afp_fondo: emp.resultado!.afpFondo,
        afp_seguro: emp.resultado!.afpSeguro,
        afp_comision: emp.resultado!.afpComision,
        impuesto_renta_5ta: emp.resultado!.impuestoRenta5ta,
        adelantos: emp.resultado!.adelantos,
        total_descuentos: emp.resultado!.totalDescuentos,
        essalud_empleador: emp.resultado!.essaludEmpleador,
        sctr: emp.resultado!.sctr,
        neto_pagar: emp.resultado!.netoPagar,
        dias_trabajados: emp.resultado!.diasTrabajados,
        horas_trabajadas: emp.resultado!.horasTrabajadas,
        horas_extra_cantidad: emp.resultado!.horasExtraCantidad,
      }))

      const { error: detallesError } = await supabase.from('planilla_detalles').insert(detalles)
      if (detallesError) throw detallesError

      toast.success('Planilla guardada exitosamente')
    } catch (error) {
      toast.error('Error al guardar', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setSaving(false)
    }
  }

  function updateEmpleado(index: number, field: keyof EmpleadoConCalculo, value: unknown) {
    setEmpleados((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const totales = {
    bruto: empleados.reduce((s, e) => s + (e.resultado?.totalBruto ?? 0), 0),
    descuentos: empleados.reduce((s, e) => s + (e.resultado?.totalDescuentos ?? 0), 0),
    neto: empleados.reduce((s, e) => s + (e.resultado?.netoPagar ?? 0), 0),
    essalud: empleados.reduce((s, e) => s + (e.resultado?.essaludEmpleador ?? 0), 0),
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-800/50" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Calcular Planilla</h2>
          <p className="text-sm text-zinc-500">Cálculo de remuneraciones mensuales</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-zinc-500">Periodo</Label>
            <Input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-40 bg-zinc-900 border-zinc-800 font-mono"
            />
          </div>
          <Button onClick={calcularTodos} className="bg-blue-600 hover:bg-blue-700" disabled={calculating}>
            {calculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
            Calcular Todo
          </Button>
          <Button onClick={guardarPlanilla} className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </div>

      {/* Totales */}
      {empleados.some((e) => e.resultado) && (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
            <p className="text-xs text-zinc-500">Total Bruto</p>
            <p className="mt-1 text-xl font-bold font-mono text-zinc-100">{formatCurrency(totales.bruto)}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
            <p className="text-xs text-zinc-500">Total Descuentos</p>
            <p className="mt-1 text-xl font-bold font-mono text-red-400">-{formatCurrency(totales.descuentos)}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
            <p className="text-xs text-zinc-500">Total Neto</p>
            <p className="mt-1 text-xl font-bold font-mono text-emerald-400">{formatCurrency(totales.neto)}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
            <p className="text-xs text-zinc-500">EsSalud Empleador</p>
            <p className="mt-1 text-xl font-bold font-mono text-amber-400">{formatCurrency(totales.essalud)}</p>
          </div>
        </div>
      )}

      {/* Employee rows */}
      <div className="space-y-3">
        {empleados.map((emp, index) => (
          <div
            key={emp.id}
            className="rounded-lg border border-zinc-800 bg-[#111827] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-zinc-100">
                  {emp.apellidos}, {emp.nombres}
                </p>
                <p className="text-xs text-zinc-500">
                  {emp.cargo} - {emp.area} | Básico: {formatCurrency(emp.sueldo_basico)}
                  {emp.asignacion_familiar && ' | + Asig. Familiar'}
                </p>
              </div>
              {emp.resultado && (
                <div className="text-right">
                  <p className="text-sm text-zinc-500">Neto a pagar</p>
                  <p className="text-lg font-bold font-mono text-emerald-400">
                    {formatCurrency(emp.resultado.netoPagar)}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">Sistema</Label>
                <Select
                  value={emp.sistemaPrevisional}
                  onValueChange={(v) => updateEmpleado(index, 'sistemaPrevisional', v)}
                >
                  <SelectTrigger className="h-8 bg-zinc-900 border-zinc-800 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onp">ONP (13%)</SelectItem>
                    <SelectItem value="afp">AFP (~12.5%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">H.Extra 25%</Label>
                <Input
                  type="number"
                  value={emp.horasExtra25}
                  onChange={(e) => updateEmpleado(index, 'horasExtra25', Number(e.target.value))}
                  className="h-8 bg-zinc-900 border-zinc-800 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">H.Extra 35%</Label>
                <Input
                  type="number"
                  value={emp.horasExtra35}
                  onChange={(e) => updateEmpleado(index, 'horasExtra35', Number(e.target.value))}
                  className="h-8 bg-zinc-900 border-zinc-800 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">Bonificaciones</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={emp.bonificaciones}
                  onChange={(e) => updateEmpleado(index, 'bonificaciones', Number(e.target.value))}
                  className="h-8 bg-zinc-900 border-zinc-800 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">Adelantos</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={emp.adelantos}
                  onChange={(e) => updateEmpleado(index, 'adelantos', Number(e.target.value))}
                  className="h-8 bg-zinc-900 border-zinc-800 text-xs font-mono"
                />
              </div>
            </div>

            {emp.resultado && (
              <div className="mt-3 grid grid-cols-6 gap-2 rounded-md bg-zinc-900/50 p-2 text-xs">
                <div>
                  <span className="text-zinc-500">Bruto:</span>{' '}
                  <span className="font-mono text-zinc-300">{formatCurrency(emp.resultado.totalBruto)}</span>
                </div>
                <div>
                  <span className="text-zinc-500">{emp.sistemaPrevisional === 'onp' ? 'ONP' : 'AFP'}:</span>{' '}
                  <span className="font-mono text-red-400">
                    -{formatCurrency(emp.sistemaPrevisional === 'onp' ? emp.resultado.onp : emp.resultado.afpFondo + emp.resultado.afpSeguro + emp.resultado.afpComision)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">IR 5ta:</span>{' '}
                  <span className="font-mono text-red-400">-{formatCurrency(emp.resultado.impuestoRenta5ta)}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Desc:</span>{' '}
                  <span className="font-mono text-red-400">-{formatCurrency(emp.resultado.totalDescuentos)}</span>
                </div>
                <div>
                  <span className="text-zinc-500">EsSalud:</span>{' '}
                  <span className="font-mono text-amber-400">{formatCurrency(emp.resultado.essaludEmpleador)}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Neto:</span>{' '}
                  <span className="font-mono font-semibold text-emerald-400">{formatCurrency(emp.resultado.netoPagar)}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {empleados.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <p>No hay empleados activos registrados.</p>
          <p className="text-sm mt-1">Registre empleados primero en la sección de Empleados.</p>
        </div>
      )}
    </div>
  )
}
