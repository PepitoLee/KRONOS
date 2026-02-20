import type { BalanceGeneral, EstadoResultados } from './financial-statements'

export interface RatiosFinancieros {
  // Liquidez
  liquidezCorriente: number
  pruebaAcida: number
  capitalTrabajo: number
  liquidezAbsoluta: number
  // Endeudamiento
  endeudamientoTotal: number
  endeudamientoPatrimonial: number
  coberturaIntereses: number
  // Rentabilidad
  margenBruto: number
  margenOperativo: number
  margenNeto: number
  roa: number
  roe: number
  // Gestión
  rotacionCxC: number
  periodoCobro: number
  rotacionCxP: number
  periodoPago: number
}

type SemaforoColor = 'verde' | 'amarillo' | 'rojo'

export interface RatioConSemaforo {
  nombre: string
  valor: number
  semaforo: SemaforoColor
  interpretacion: string
  formula: string
}

/**
 * Calcula todos los ratios financieros
 */
export function calcularRatios(
  balance: BalanceGeneral,
  resultados: EstadoResultados
): RatiosFinancieros {
  const safe = (num: number, den: number) => (den === 0 ? 0 : num / den)

  return {
    // Liquidez
    liquidezCorriente: round(safe(balance.totalActivoCorriente, balance.totalPasivoCorriente)),
    pruebaAcida: round(
      safe(balance.totalActivoCorriente - balance.inventarios, balance.totalPasivoCorriente)
    ),
    capitalTrabajo: round(balance.totalActivoCorriente - balance.totalPasivoCorriente),
    liquidezAbsoluta: round(safe(balance.efectivoEquivalentes, balance.totalPasivoCorriente)),

    // Endeudamiento
    endeudamientoTotal: round(safe(balance.totalPasivos, balance.totalActivos)),
    endeudamientoPatrimonial: round(safe(balance.totalPasivos, balance.totalPatrimonio)),
    coberturaIntereses: round(safe(resultados.utilidadOperativa, resultados.gastosFinancieros)),

    // Rentabilidad (en porcentaje)
    margenBruto: round(safe(resultados.utilidadBruta, resultados.ventasNetas) * 100),
    margenOperativo: round(safe(resultados.utilidadOperativa, resultados.ventasNetas) * 100),
    margenNeto: round(safe(resultados.utilidadNeta, resultados.ventasNetas) * 100),
    roa: round(safe(resultados.utilidadNeta, balance.totalActivos) * 100),
    roe: round(safe(resultados.utilidadNeta, balance.totalPatrimonio) * 100),

    // Gestión
    rotacionCxC: round(safe(resultados.ventasNetas, balance.cuentasCobrarComerciales)),
    periodoCobro: round(safe(365, safe(resultados.ventasNetas, balance.cuentasCobrarComerciales))),
    rotacionCxP: round(safe(resultados.costoVentas, balance.cuentasPagarComerciales)),
    periodoPago: round(safe(365, safe(resultados.costoVentas, balance.cuentasPagarComerciales))),
  }
}

/**
 * Evalúa un ratio y le asigna un semáforo
 */
export function evaluarRatio(nombre: string, valor: number): RatioConSemaforo {
  const evaluaciones: Record<string, {
    verde: [number, number]
    amarillo: [number, number]
    formula: string
  }> = {
    liquidezCorriente: {
      verde: [1.5, 3],
      amarillo: [1, 1.5],
      formula: 'Activo Corriente / Pasivo Corriente',
    },
    pruebaAcida: {
      verde: [1, 2],
      amarillo: [0.5, 1],
      formula: '(Activo Corriente - Inventarios) / Pasivo Corriente',
    },
    endeudamientoTotal: {
      verde: [0, 0.5],
      amarillo: [0.5, 0.7],
      formula: 'Pasivo Total / Activo Total',
    },
    margenBruto: {
      verde: [30, 100],
      amarillo: [15, 30],
      formula: 'Utilidad Bruta / Ventas Netas × 100',
    },
    margenNeto: {
      verde: [10, 100],
      amarillo: [3, 10],
      formula: 'Utilidad Neta / Ventas Netas × 100',
    },
    roa: {
      verde: [5, 100],
      amarillo: [2, 5],
      formula: 'Utilidad Neta / Activo Total × 100',
    },
    roe: {
      verde: [15, 100],
      amarillo: [5, 15],
      formula: 'Utilidad Neta / Patrimonio × 100',
    },
  }

  const config = evaluaciones[nombre]
  if (!config) {
    return { nombre, valor, semaforo: 'amarillo', interpretacion: 'Sin benchmark', formula: '' }
  }

  let semaforo: SemaforoColor
  let interpretacion: string

  if (valor >= config.verde[0] && valor <= config.verde[1]) {
    semaforo = 'verde'
    interpretacion = 'Indicador saludable'
  } else if (valor >= config.amarillo[0] && valor <= config.amarillo[1]) {
    semaforo = 'amarillo'
    interpretacion = 'Requiere atención'
  } else {
    semaforo = 'rojo'
    interpretacion = 'Situación crítica'
  }

  return { nombre, valor, semaforo, interpretacion, formula: config.formula }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
