import {
  UIT_2025,
  ESSALUD_TASA,
  ONP_TASA,
  RMV_2025,
  ASIGNACION_FAMILIAR,
  RENTA_5TA_ESCALA,
} from '@/types/common'

export interface PayrollInput {
  sueldoBasico: number
  asignacionFamiliar: boolean
  horasExtra25: number // cantidad de horas
  horasExtra35: number // cantidad de horas
  bonificaciones: number
  comisiones: number
  otrosIngresos: number
  sistemaPrevisional: 'onp' | 'afp'
  afpTasaFondo?: number // ~10%
  afpTasaSeguro?: number // ~1.35%
  afpTasaComision?: number // ~1.15%
  adelantos: number
  prestamos: number
  otrosDescuentos: number
  diasTrabajados: number
  horasTrabajadas: number
  tieneSctr?: boolean
  sctrTasa?: number
}

export interface PayrollResult {
  // Ingresos
  sueldoBasico: number
  asignacionFamiliar: number
  horasExtra25Monto: number
  horasExtra35Monto: number
  bonificaciones: number
  comisiones: number
  otrosIngresos: number
  totalBruto: number
  // Descuentos trabajador
  onp: number
  afpFondo: number
  afpSeguro: number
  afpComision: number
  impuestoRenta5ta: number
  adelantos: number
  prestamos: number
  otrosDescuentos: number
  totalDescuentos: number
  // Aportes empleador
  essaludEmpleador: number
  sctr: number
  // Neto
  netoPagar: number
  // Meta
  diasTrabajados: number
  horasTrabajadas: number
  horasExtraCantidad: number
}

/**
 * Calcula el valor hora basado en sueldo mensual
 * Jornada máxima: 48 horas semanales = 8 horas diarias x 6 días
 * Horas mensuales = 8 * 30 = 240 (promedio)
 */
function calcularValorHora(sueldoMensual: number): number {
  return sueldoMensual / 240
}

/**
 * Calcula horas extra al 25% (primeras 2 horas después de jornada)
 */
function calcularHorasExtra25(valorHora: number, cantidad: number): number {
  return valorHora * 1.25 * cantidad
}

/**
 * Calcula horas extra al 35% (a partir de la 3ra hora)
 */
function calcularHorasExtra35(valorHora: number, cantidad: number): number {
  return valorHora * 1.35 * cantidad
}

/**
 * Calcula Impuesto a la Renta de 5ta Categoría
 * Escala progresiva sobre remuneración anual proyectada menos 7 UIT
 */
export function calcularRenta5ta(remuneracionMensual: number, mesActual: number = new Date().getMonth() + 1): number {
  // Remuneración anual proyectada (12 meses + 2 gratificaciones)
  const remuneracionAnual = remuneracionMensual * 14 // 12 sueldos + 2 gratificaciones

  // Deducción de 7 UIT
  const deduccion7UIT = 7 * UIT_2025
  const rentaNeta = Math.max(0, remuneracionAnual - deduccion7UIT)

  if (rentaNeta <= 0) return 0

  // Calcular impuesto según escala progresiva
  let impuestoAnual = 0
  let baseRestante = rentaNeta

  for (const tramo of RENTA_5TA_ESCALA) {
    const limiteTramo = tramo.limite === Infinity ? Infinity : tramo.limite * UIT_2025
    const limiteAnterior = RENTA_5TA_ESCALA.indexOf(tramo) === 0
      ? 0
      : RENTA_5TA_ESCALA[RENTA_5TA_ESCALA.indexOf(tramo) - 1].limite * UIT_2025

    const rangoTramo = tramo.limite === Infinity ? Infinity : limiteTramo - limiteAnterior
    const montoEnTramo = Math.min(baseRestante, rangoTramo)

    impuestoAnual += montoEnTramo * tramo.tasa
    baseRestante -= montoEnTramo

    if (baseRestante <= 0) break
  }

  // Retención mensual = Impuesto anual / meses restantes
  // En los primeros meses se divide entre 12, luego se ajusta
  const mesesRestantes = 13 - mesActual // incluye el mes actual
  const retencionMensual = impuestoAnual / Math.max(mesesRestantes, 1)

  return Math.round(retencionMensual * 100) / 100
}

/**
 * Calcula la planilla completa de un empleado
 */
export function calcularPlanillaEmpleado(input: PayrollInput): PayrollResult {
  // --- INGRESOS ---
  const asignacionFamiliarMonto = input.asignacionFamiliar ? ASIGNACION_FAMILIAR : 0
  const valorHora = calcularValorHora(input.sueldoBasico)
  const horasExtra25Monto = calcularHorasExtra25(valorHora, input.horasExtra25)
  const horasExtra35Monto = calcularHorasExtra35(valorHora, input.horasExtra35)

  const totalBruto =
    input.sueldoBasico +
    asignacionFamiliarMonto +
    horasExtra25Monto +
    horasExtra35Monto +
    input.bonificaciones +
    input.comisiones +
    input.otrosIngresos

  // --- DESCUENTOS TRABAJADOR ---
  let onp = 0
  let afpFondo = 0
  let afpSeguro = 0
  let afpComision = 0

  if (input.sistemaPrevisional === 'onp') {
    onp = Math.round(totalBruto * ONP_TASA * 100) / 100
  } else {
    afpFondo = Math.round(totalBruto * (input.afpTasaFondo ?? 0.10) * 100) / 100
    afpSeguro = Math.round(totalBruto * (input.afpTasaSeguro ?? 0.0135) * 100) / 100
    afpComision = Math.round(totalBruto * (input.afpTasaComision ?? 0.0115) * 100) / 100
  }

  const impuestoRenta5ta = calcularRenta5ta(totalBruto)

  const totalDescuentos =
    onp +
    afpFondo +
    afpSeguro +
    afpComision +
    impuestoRenta5ta +
    input.adelantos +
    input.prestamos +
    input.otrosDescuentos

  // --- APORTES EMPLEADOR ---
  const essaludEmpleador = Math.round(totalBruto * ESSALUD_TASA * 100) / 100
  const sctr = input.tieneSctr
    ? Math.round(totalBruto * (input.sctrTasa ?? 0.0153) * 100) / 100
    : 0

  // --- NETO ---
  const netoPagar = Math.round((totalBruto - totalDescuentos) * 100) / 100

  return {
    sueldoBasico: input.sueldoBasico,
    asignacionFamiliar: asignacionFamiliarMonto,
    horasExtra25Monto: Math.round(horasExtra25Monto * 100) / 100,
    horasExtra35Monto: Math.round(horasExtra35Monto * 100) / 100,
    bonificaciones: input.bonificaciones,
    comisiones: input.comisiones,
    otrosIngresos: input.otrosIngresos,
    totalBruto: Math.round(totalBruto * 100) / 100,
    onp,
    afpFondo,
    afpSeguro,
    afpComision,
    impuestoRenta5ta,
    adelantos: input.adelantos,
    prestamos: input.prestamos,
    otrosDescuentos: input.otrosDescuentos,
    totalDescuentos: Math.round(totalDescuentos * 100) / 100,
    essaludEmpleador,
    sctr,
    netoPagar,
    diasTrabajados: input.diasTrabajados,
    horasTrabajadas: input.horasTrabajadas,
    horasExtraCantidad: input.horasExtra25 + input.horasExtra35,
  }
}
