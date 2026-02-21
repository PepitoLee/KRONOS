import { format, addDays, parseISO, isAfter, isBefore, addMonths } from 'date-fns'
import { es } from 'date-fns/locale'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface VencimientoTributario {
  fecha: string
  obligacion: string
  formulario: string
  descripcion: string
  prioridad: 'alta' | 'media' | 'baja'
}

// ---------------------------------------------------------------------------
// Constantes del cronograma SUNAT
// ---------------------------------------------------------------------------

/**
 * Dia habil de vencimiento segun el ultimo digito del RUC.
 * Basado en el cronograma oficial de SUNAT.
 * El dia indicado es el dia habil del mes siguiente al periodo tributario.
 */
const VENCIMIENTO_POR_DIGITO: Record<string, number> = {
  '0': 12,
  '1': 13,
  '2': 14,
  '3': 14,
  '4': 15,
  '5': 15,
  '6': 16,
  '7': 16,
  '8': 17,
  '9': 17,
}

/** Buenos contribuyentes vencen el dia 22 del mes siguiente */
const VENCIMIENTO_BUENOS_CONTRIBUYENTES = 22

/**
 * Obligaciones tributarias mensuales con su formulario asociado.
 */
const OBLIGACIONES_MENSUALES = [
  {
    obligacion: 'PDT 621 - IGV Renta Mensual',
    formulario: 'Formulario Virtual 621',
    descripcion:
      'Declaracion y pago mensual del IGV e Impuesto a la Renta (pago a cuenta)',
    prioridad: 'alta' as const,
  },
  {
    obligacion: 'PDT PLAME - Planilla Electronica',
    formulario: 'PDT PLAME',
    descripcion:
      'Declaracion de planilla electronica, retenciones y aportes (ONP, EsSalud, Renta 5ta)',
    prioridad: 'alta' as const,
  },
  {
    obligacion: 'Libros Electronicos PLE',
    formulario: 'PLE - SUNAT',
    descripcion:
      'Registro de Compras y Registro de Ventas electronicos del periodo',
    prioridad: 'media' as const,
  },
]

/**
 * Obligaciones anuales con mes y dia aproximado de vencimiento.
 */
const OBLIGACIONES_ANUALES = [
  {
    mes: 3,
    dia: 31,
    obligacion: 'Declaracion Jurada Anual del IR',
    formulario: 'Formulario Virtual 710',
    descripcion:
      'Declaracion Jurada Anual del Impuesto a la Renta de tercera categoria',
    prioridad: 'alta' as const,
  },
  {
    mes: 3,
    dia: 31,
    obligacion: 'DAOT - Declaracion Anual de Operaciones con Terceros',
    formulario: 'Formulario Virtual 3500',
    descripcion:
      'Declaracion de operaciones con terceros que superen 2 UIT en el ejercicio',
    prioridad: 'media' as const,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calcula la fecha aproximada de vencimiento para un periodo tributario.
 * El vencimiento cae en el mes siguiente al periodo declarado.
 *
 * @param periodoMes - Mes del periodo tributario (1-12)
 * @param periodoAnio - Anio del periodo tributario
 * @param diaVencimiento - Dia del mes de vencimiento
 * @returns Fecha en formato ISO (YYYY-MM-DD)
 */
function calcularFechaVencimiento(
  periodoMes: number,
  periodoAnio: number,
  diaVencimiento: number
): string {
  // El vencimiento es en el mes siguiente al periodo
  const fechaPeriodo = new Date(periodoAnio, periodoMes - 1, 1)
  const mesSiguiente = addMonths(fechaPeriodo, 1)

  const anioVenc = mesSiguiente.getFullYear()
  const mesVenc = mesSiguiente.getMonth() + 1

  // Ajustar dia si excede los dias del mes
  const ultimoDia = new Date(anioVenc, mesVenc, 0).getDate()
  const diaFinal = Math.min(diaVencimiento, ultimoDia)

  return `${anioVenc}-${String(mesVenc).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`
}

function getNombreMes(mes: number): string {
  const fecha = new Date(2024, mes - 1, 1)
  return format(fecha, 'MMMM', { locale: es })
}

// ---------------------------------------------------------------------------
// Calendario tributario
// ---------------------------------------------------------------------------

/**
 * Genera el calendario tributario completo para un anio fiscal,
 * segun el ultimo digito del RUC de la empresa.
 *
 * Incluye:
 * - Obligaciones mensuales: PDT 621, PDT PLAME, Libros Electronicos
 * - Obligaciones anuales: DJ Anual IR, DAOT
 *
 * El cronograma de vencimientos sigue la tabla oficial de SUNAT
 * donde el digito del RUC determina el dia habil de vencimiento.
 *
 * @param anio - Anio fiscal
 * @param ultimoDigitoRUC - Ultimo digito del RUC (0-9) o 'buenos' para buenos contribuyentes
 * @returns Array de vencimientos tributarios ordenados por fecha
 */
export function getCalendarioTributario(
  anio: number,
  ultimoDigitoRUC: string
): VencimientoTributario[] {
  const vencimientos: VencimientoTributario[] = []

  // Determinar el dia de vencimiento segun el digito del RUC
  const esBuenContribuyente = ultimoDigitoRUC.toLowerCase() === 'buenos'
  const diaVencimiento = esBuenContribuyente
    ? VENCIMIENTO_BUENOS_CONTRIBUYENTES
    : VENCIMIENTO_POR_DIGITO[ultimoDigitoRUC]

  if (diaVencimiento === undefined) {
    throw new Error(
      `Digito de RUC invalido: "${ultimoDigitoRUC}". Debe ser 0-9 o "buenos".`
    )
  }

  // --- Obligaciones mensuales (12 periodos) ---
  for (let mes = 1; mes <= 12; mes++) {
    const fechaVencimiento = calcularFechaVencimiento(mes, anio, diaVencimiento)
    const periodoLabel = `${getNombreMes(mes)} ${anio}`

    for (const obligacion of OBLIGACIONES_MENSUALES) {
      vencimientos.push({
        fecha: fechaVencimiento,
        obligacion: `${obligacion.obligacion} - ${periodoLabel}`,
        formulario: obligacion.formulario,
        descripcion: `${obligacion.descripcion}. Periodo: ${periodoLabel}`,
        prioridad: obligacion.prioridad,
      })
    }
  }

  // --- Obligaciones anuales ---
  for (const anual of OBLIGACIONES_ANUALES) {
    const ultimoDia = new Date(anio + 1, anual.mes, 0).getDate()
    const diaFinal = Math.min(anual.dia, ultimoDia)

    vencimientos.push({
      fecha: `${anio + 1}-${String(anual.mes).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`,
      obligacion: `${anual.obligacion} - Ejercicio ${anio}`,
      formulario: anual.formulario,
      descripcion: `${anual.descripcion}. Ejercicio gravable: ${anio}`,
      prioridad: anual.prioridad,
    })
  }

  // Ordenar por fecha
  vencimientos.sort((a, b) => a.fecha.localeCompare(b.fecha))

  return vencimientos
}

// ---------------------------------------------------------------------------
// Filtros
// ---------------------------------------------------------------------------

/**
 * Filtra los vencimientos que ocurren en los proximos N dias desde hoy.
 *
 * @param calendario - Calendario completo generado por getCalendarioTributario
 * @param dias - Cantidad de dias a futuro para filtrar (default: 30)
 * @returns Vencimientos proximos ordenados por fecha
 */
export function getProximosVencimientos(
  calendario: VencimientoTributario[],
  dias: number = 30
): VencimientoTributario[] {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const limite = addDays(hoy, dias)

  return calendario.filter((v) => {
    const fecha = parseISO(v.fecha)
    return (
      (isAfter(fecha, hoy) || fecha.getTime() === hoy.getTime()) &&
      isBefore(fecha, limite)
    )
  })
}

/**
 * Filtra los vencimientos de un mes especifico.
 *
 * @param calendario - Calendario completo
 * @param mes - Numero de mes (1-12)
 * @returns Vencimientos del mes solicitado
 */
export function getMesVencimientos(
  calendario: VencimientoTributario[],
  mes: number
): VencimientoTributario[] {
  if (mes < 1 || mes > 12) {
    throw new Error(`Mes invalido: ${mes}. Debe estar entre 1 y 12.`)
  }

  const mesStr = String(mes).padStart(2, '0')

  return calendario.filter((v) => {
    const partes = v.fecha.split('-')
    return partes[1] === mesStr
  })
}
