// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface TipoCambio {
  fecha: string
  compra: number
  venta: number
  fuente: string
}

export type MonedaCodigo = 'PEN' | 'USD'

// ---------------------------------------------------------------------------
// API Calls
// ---------------------------------------------------------------------------

/**
 * Obtiene el tipo de cambio de SUNAT para una fecha especifica.
 * Llama al endpoint interno /api/tipo-cambio que actua como proxy
 * hacia el servicio de SUNAT para evitar problemas de CORS.
 *
 * @param fecha - Fecha en formato ISO (YYYY-MM-DD)
 * @returns Tipo de cambio con compra, venta y fuente, o null si no esta disponible
 */
export async function fetchTipoCambioSUNAT(
  fecha: string
): Promise<TipoCambio | null> {
  try {
    const response = await fetch(
      `/api/tipo-cambio?fecha=${encodeURIComponent(fecha)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error(
        `Error al obtener tipo de cambio: ${response.status} ${response.statusText}`
      )
      return null
    }

    const data = await response.json()

    if (!data || typeof data.compra !== 'number' || typeof data.venta !== 'number') {
      console.error('Respuesta de tipo de cambio con formato invalido:', data)
      return null
    }

    return {
      fecha: data.fecha ?? fecha,
      compra: data.compra,
      venta: data.venta,
      fuente: data.fuente ?? 'SUNAT',
    }
  } catch (error) {
    console.error('Error al consultar tipo de cambio:', error)
    return null
  }
}

/**
 * Obtiene solo el tipo de cambio venta para una fecha.
 * El tipo de cambio venta es el que se usa para registrar operaciones
 * en moneda extranjera segun normativa contable peruana (NIC 21).
 *
 * @param fecha - Fecha en formato ISO (YYYY-MM-DD)
 * @returns Tipo de cambio venta, o 0 si no se pudo obtener
 */
export async function getTipoCambioVenta(fecha: string): Promise<number> {
  const tc = await fetchTipoCambioSUNAT(fecha)
  return tc?.venta ?? 0
}

// ---------------------------------------------------------------------------
// Conversion de moneda
// ---------------------------------------------------------------------------

/**
 * Convierte un monto entre PEN y USD usando el tipo de cambio proporcionado.
 *
 * Reglas contables peruanas:
 * - PEN a USD: se divide entre el tipo de cambio (venta)
 * - USD a PEN: se multiplica por el tipo de cambio (venta)
 * - Si la moneda origen y destino son iguales, retorna el mismo monto
 *
 * @param monto - Monto a convertir
 * @param tipoCambio - Tipo de cambio a aplicar (normalmente tipo venta SUNAT)
 * @param de - Moneda de origen ('PEN' o 'USD')
 * @param a - Moneda de destino ('PEN' o 'USD')
 * @returns Monto convertido redondeado a 2 decimales
 * @throws Error si el tipo de cambio es 0 o negativo
 */
export function convertirMoneda(
  monto: number,
  tipoCambio: number,
  de: MonedaCodigo,
  a: MonedaCodigo
): number {
  if (de === a) {
    return Math.round(monto * 100) / 100
  }

  if (tipoCambio <= 0) {
    throw new Error(
      `Tipo de cambio invalido: ${tipoCambio}. Debe ser mayor a 0.`
    )
  }

  let resultado: number

  if (de === 'USD' && a === 'PEN') {
    // Dolares a Soles: multiplicar por TC
    resultado = monto * tipoCambio
  } else {
    // Soles a Dolares: dividir entre TC
    resultado = monto / tipoCambio
  }

  return Math.round(resultado * 100) / 100
}
