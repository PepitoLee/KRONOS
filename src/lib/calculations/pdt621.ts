import { IGV_TASA } from '@/types/common'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface PDT621Input {
  /** Base imponible de ventas gravadas (sin IGV) */
  ventas_gravadas: number
  /** Base imponible de compras gravadas (sin IGV) */
  compras_gravadas: number
  /** Ventas no gravadas (exoneradas / inafectas) */
  ventas_no_gravadas: number
  /** Ventas por exportacion */
  ventas_exportacion: number
  /** Percepciones del periodo */
  percepciones: number
  /** Retenciones del periodo */
  retenciones: number
  /** Saldo a favor del periodo anterior (credito fiscal no aplicado) */
  saldo_a_favor_anterior: number
  /** Descuentos concedidos en ventas */
  descuentos_ventas?: number
  /** Adquisiciones gravadas para operaciones mixtas */
  compras_gravadas_mixtas?: number
  /** Coeficiente para pago a cuenta IR (1.5% por defecto, puede ser 1.0%) */
  coeficiente_ir?: number
  /** Periodo tributario en formato YYYY-MM */
  periodo?: string
  /** RUC de la empresa */
  ruc?: string
  /** Razon social */
  razon_social?: string
}

export interface PDT621Data {
  periodo: string
  ruc: string
  razon_social: string
  casillas: Record<string, number>
}

export interface CasillaDetalle {
  casilla: string
  descripcion: string
  monto: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

// ---------------------------------------------------------------------------
// Descripciones oficiales de casillas PDT 621
// ---------------------------------------------------------------------------

const CASILLA_DESCRIPCIONES: Record<string, string> = {
  '100': 'Base imponible de ventas gravadas',
  '101': 'Descuentos concedidos y/o devoluciones',
  '102': 'IGV resultante (debito fiscal)',
  '105': 'Ventas no gravadas (exoneradas e inafectas)',
  '106': 'Ventas por exportacion',
  '107': 'Adquisiciones gravadas para operaciones gravadas',
  '108': 'Adquisiciones gravadas para operaciones mixtas',
  '110': 'IGV de adquisiciones (credito fiscal)',
  '111': 'IGV de adquisiciones para operaciones mixtas',
  '114': 'Total credito fiscal del periodo',
  '120': 'Saldo a favor del periodo anterior',
  '125': 'Percepciones de IGV efectuadas',
  '126': 'Retenciones de IGV efectuadas',
  '140': 'Impuesto resultante o saldo a favor (IGV)',
  '145': 'Total IGV a pagar en el periodo',
  '301': 'Ingresos netos del mes (base pago a cuenta IR)',
  '312': 'Pago a cuenta del Impuesto a la Renta',
  '314': 'Coeficiente aplicado para pago a cuenta IR',
  '500': 'Total tributos a pagar (IGV + IR)',
}

// ---------------------------------------------------------------------------
// Calculo PDT 621
// ---------------------------------------------------------------------------

/**
 * Calcula las casillas del PDT 621 (Declaracion Jurada Mensual IGV - Renta).
 *
 * Logica de calculo segun normativa SUNAT:
 * - Casilla 100: Base imponible ventas gravadas
 * - Casilla 102: Debito fiscal = (100 - 101) x 18%
 * - Casilla 110: Credito fiscal = 107 x 18%
 * - Casilla 140: IGV a pagar = debito - credito - saldo anterior - percepciones - retenciones
 * - Casilla 301: Renta neta = ingresos netos del mes
 * - Casilla 312: Pago a cuenta IR = 301 x coeficiente (1.5% o 1.0%)
 * - Casilla 500: Total tributos = IGV a pagar + pago a cuenta IR
 *
 * @param input - Datos del periodo tributario
 * @returns Estructura PDT621Data con todas las casillas calculadas
 */
export function calcularPDT621(input: PDT621Input): PDT621Data {
  const {
    ventas_gravadas,
    compras_gravadas,
    ventas_no_gravadas,
    ventas_exportacion,
    percepciones,
    retenciones,
    saldo_a_favor_anterior,
    descuentos_ventas = 0,
    compras_gravadas_mixtas = 0,
    coeficiente_ir = 0.015,
    periodo = '',
    ruc = '',
    razon_social = '',
  } = input

  const casillas: Record<string, number> = {}

  // --- SECCION IGV ---

  // Casilla 100: Base imponible ventas gravadas
  casillas['100'] = round2(ventas_gravadas)

  // Casilla 101: Descuentos concedidos
  casillas['101'] = round2(descuentos_ventas)

  // Casilla 102: IGV por ventas (debito fiscal)
  const baseVentas = casillas['100'] - casillas['101']
  casillas['102'] = round2(baseVentas * IGV_TASA)

  // Casilla 105: Ventas no gravadas
  casillas['105'] = round2(ventas_no_gravadas)

  // Casilla 106: Exportaciones
  casillas['106'] = round2(ventas_exportacion)

  // Casilla 107: Adquisiciones gravadas para operaciones gravadas
  casillas['107'] = round2(compras_gravadas)

  // Casilla 108: Adquisiciones gravadas para operaciones mixtas
  casillas['108'] = round2(compras_gravadas_mixtas)

  // Casilla 110: IGV por compras (credito fiscal - operaciones gravadas)
  casillas['110'] = round2(casillas['107'] * IGV_TASA)

  // Casilla 111: IGV por compras (credito fiscal - operaciones mixtas)
  casillas['111'] = round2(casillas['108'] * IGV_TASA)

  // Casilla 114: Total credito fiscal del periodo
  casillas['114'] = round2(casillas['110'] + casillas['111'])

  // Casilla 120: Saldo a favor del periodo anterior
  casillas['120'] = round2(saldo_a_favor_anterior)

  // Casilla 125: Percepciones
  casillas['125'] = round2(percepciones)

  // Casilla 126: Retenciones
  casillas['126'] = round2(retenciones)

  // Casilla 140: Impuesto resultante IGV
  // debito fiscal - credito fiscal - saldo anterior - percepciones - retenciones
  const igvResultante = round2(
    casillas['102'] -
      casillas['114'] -
      casillas['120'] -
      casillas['125'] -
      casillas['126']
  )

  // Si es positivo, se paga. Si es negativo, queda como saldo a favor.
  casillas['140'] = igvResultante

  // Casilla 145: Total IGV a pagar (solo si es positivo)
  casillas['145'] = igvResultante > 0 ? igvResultante : 0

  // --- SECCION IMPUESTO A LA RENTA ---

  // Casilla 301: Ingresos netos del mes (base para pago a cuenta)
  // Incluye ventas gravadas, no gravadas y exportaciones menos descuentos
  casillas['301'] = round2(
    casillas['100'] - casillas['101'] + casillas['105'] + casillas['106']
  )

  // Casilla 314: Coeficiente aplicado
  casillas['314'] = coeficiente_ir

  // Casilla 312: Pago a cuenta del IR
  casillas['312'] = round2(casillas['301'] * coeficiente_ir)

  // --- TOTAL ---

  // Casilla 500: Total tributos a pagar
  casillas['500'] = round2(casillas['145'] + casillas['312'])

  return {
    periodo,
    ruc,
    razon_social,
    casillas,
  }
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

/**
 * Convierte las casillas del PDT 621 a un formato legible con descripciones.
 *
 * @param data - Resultado de calcularPDT621
 * @returns Array de casillas con descripcion y monto para renderizar en UI
 */
export function formatCasillasPDT(data: PDT621Data): CasillaDetalle[] {
  const casillasOrdenadas = Object.keys(data.casillas).sort(
    (a, b) => parseInt(a) - parseInt(b)
  )

  return casillasOrdenadas.map((casilla) => ({
    casilla,
    descripcion: CASILLA_DESCRIPCIONES[casilla] ?? `Casilla ${casilla}`,
    monto: data.casillas[casilla],
  }))
}

/**
 * Obtiene el saldo a favor para arrastrar al siguiente periodo.
 * Si casilla 140 es negativa, ese valor absoluto es el saldo a favor.
 *
 * @param data - Resultado de calcularPDT621
 * @returns Saldo a favor disponible para el siguiente periodo (>= 0)
 */
export function getSaldoAFavorSiguiente(data: PDT621Data): number {
  const igvResultante = data.casillas['140'] ?? 0
  return igvResultante < 0 ? round2(Math.abs(igvResultante)) : 0
}
