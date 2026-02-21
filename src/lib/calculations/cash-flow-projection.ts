import { format, addMonths, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface CashFlowItem {
  fecha: string
  concepto: string
  tipo: 'ingreso' | 'egreso'
  monto: number
  categoria: string
  fuente: string
}

export interface CashFlowProjection {
  periodo: string
  saldo_inicial: number
  ingresos: number
  egresos: number
  saldo_final: number
  items: CashFlowItem[]
}

export interface CashFlowParams {
  saldo_inicial: number
  cxc: { fecha_vencimiento: string; total: number; cliente?: string }[]
  cxp: { fecha_vencimiento: string; total: number; proveedor?: string }[]
  gastos_fijos: { concepto: string; monto: number }[]
  meses: number
}

export interface CashFlowChartData {
  mes: string
  ingresos: number
  egresos: number
  saldo: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Determina si una fecha (string ISO) cae dentro de un rango mensual.
 */
function fechaEnMes(fechaStr: string, inicioMes: Date, finMes: Date): boolean {
  try {
    const fecha = parseISO(fechaStr)
    return isWithinInterval(fecha, { start: inicioMes, end: finMes })
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Cash Flow Projection
// ---------------------------------------------------------------------------

/**
 * Proyecta el flujo de caja para N meses a futuro.
 *
 * El calculo considera:
 * - Cobros esperados de cuentas por cobrar (CxC) segun fecha de vencimiento
 * - Pagos programados de cuentas por pagar (CxP) segun fecha de vencimiento
 * - Gastos fijos recurrentes mensuales (planillas, alquiler, servicios, etc.)
 * - Saldo acumulado mes a mes (saldo final del mes anterior = saldo inicial del siguiente)
 *
 * @param params - Parametros de proyeccion
 * @returns Array de proyecciones mensuales con detalle de items
 */
export function calcularFlujoProyectado(params: CashFlowParams): CashFlowProjection[] {
  const { saldo_inicial, cxc, cxp, gastos_fijos, meses } = params

  if (meses < 1 || meses > 60) {
    throw new Error('El numero de meses debe estar entre 1 y 60')
  }

  const projections: CashFlowProjection[] = []
  let saldoAcumulado = saldo_inicial
  const ahora = new Date()

  for (let i = 0; i < meses; i++) {
    const mesActual = addMonths(ahora, i)
    const inicio = startOfMonth(mesActual)
    const fin = endOfMonth(mesActual)
    const periodo = format(mesActual, 'yyyy-MM')
    const mesLabel = format(mesActual, 'MMMM yyyy', { locale: es })

    const items: CashFlowItem[] = []
    let totalIngresos = 0
    let totalEgresos = 0

    // --- Ingresos: cobros esperados de CxC ---
    for (const cuenta of cxc) {
      if (fechaEnMes(cuenta.fecha_vencimiento, inicio, fin)) {
        const monto = round2(cuenta.total)
        items.push({
          fecha: cuenta.fecha_vencimiento,
          concepto: cuenta.cliente
            ? `Cobro CxC - ${cuenta.cliente}`
            : 'Cobro cuenta por cobrar',
          tipo: 'ingreso',
          monto,
          categoria: 'cuentas_por_cobrar',
          fuente: 'CxC',
        })
        totalIngresos += monto
      }
    }

    // --- Egresos: pagos programados de CxP ---
    for (const cuenta of cxp) {
      if (fechaEnMes(cuenta.fecha_vencimiento, inicio, fin)) {
        const monto = round2(cuenta.total)
        items.push({
          fecha: cuenta.fecha_vencimiento,
          concepto: cuenta.proveedor
            ? `Pago CxP - ${cuenta.proveedor}`
            : 'Pago cuenta por pagar',
          tipo: 'egreso',
          monto,
          categoria: 'cuentas_por_pagar',
          fuente: 'CxP',
        })
        totalEgresos += monto
      }
    }

    // --- Egresos: gastos fijos recurrentes ---
    for (const gasto of gastos_fijos) {
      const monto = round2(gasto.monto)
      items.push({
        fecha: format(fin, 'yyyy-MM-dd'),
        concepto: gasto.concepto,
        tipo: 'egreso',
        monto,
        categoria: 'gastos_fijos',
        fuente: 'Recurrente',
      })
      totalEgresos += monto
    }

    // Ordenar items por fecha
    items.sort((a, b) => a.fecha.localeCompare(b.fecha))

    const saldoInicial = round2(saldoAcumulado)
    const saldoFinal = round2(saldoInicial + totalIngresos - totalEgresos)

    projections.push({
      periodo,
      saldo_inicial: saldoInicial,
      ingresos: round2(totalIngresos),
      egresos: round2(totalEgresos),
      saldo_final: saldoFinal,
      items,
    })

    saldoAcumulado = saldoFinal
  }

  return projections
}

// ---------------------------------------------------------------------------
// Chart Data
// ---------------------------------------------------------------------------

/**
 * Transforma las proyecciones en datos listos para graficar.
 *
 * @param projections - Proyecciones generadas por calcularFlujoProyectado
 * @returns Array con datos por mes para componentes de chart
 */
export function getFlujoCajaChartData(
  projections: CashFlowProjection[]
): CashFlowChartData[] {
  return projections.map((p) => {
    const fecha = parseISO(`${p.periodo}-01`)
    return {
      mes: format(fecha, 'MMM yy', { locale: es }),
      ingresos: p.ingresos,
      egresos: p.egresos,
      saldo: p.saldo_final,
    }
  })
}
