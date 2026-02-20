import { IGV_TASA, RENTA_GENERAL_TASA, UIT_2025 } from '@/types/common'

export interface IGVCalculo {
  periodo: string
  igvVentas: number // débito fiscal
  igvCompras: number // crédito fiscal
  igvAPagar: number
  creditoFiscalFavor: number
}

/**
 * Calcula el IGV mensual
 * IGV a pagar = Débito fiscal (ventas) - Crédito fiscal (compras)
 */
export function calcularIGV(
  totalVentasSinIGV: number,
  totalComprasSinIGV: number,
  periodo: string
): IGVCalculo {
  const igvVentas = Math.round(totalVentasSinIGV * IGV_TASA * 100) / 100
  const igvCompras = Math.round(totalComprasSinIGV * IGV_TASA * 100) / 100
  const diferencia = igvVentas - igvCompras

  return {
    periodo,
    igvVentas,
    igvCompras,
    igvAPagar: diferencia > 0 ? diferencia : 0,
    creditoFiscalFavor: diferencia < 0 ? Math.abs(diferencia) : 0,
  }
}

export interface RentaAnualCalculo {
  utilidadNeta: number
  impuestoRenta: number
  tasa: number
  regimen: 'GENERAL' | 'MYPE'
  pagoACuentaMensual: number
}

/**
 * Calcula Impuesto a la Renta empresarial anual
 */
export function calcularRentaAnual(
  utilidadNeta: number,
  regimen: 'GENERAL' | 'MYPE' = 'GENERAL',
  ingresosNetosMensuales: number = 0
): RentaAnualCalculo {
  let impuestoRenta: number
  let tasa: number

  if (regimen === 'MYPE') {
    // Hasta 15 UIT: 10%, exceso: 29.5%
    const limite15UIT = 15 * UIT_2025
    if (utilidadNeta <= limite15UIT) {
      impuestoRenta = utilidadNeta * 0.10
      tasa = 0.10
    } else {
      impuestoRenta = limite15UIT * 0.10 + (utilidadNeta - limite15UIT) * RENTA_GENERAL_TASA
      tasa = impuestoRenta / utilidadNeta
    }
  } else {
    // Régimen General: 29.5%
    impuestoRenta = utilidadNeta * RENTA_GENERAL_TASA
    tasa = RENTA_GENERAL_TASA
  }

  // Pagos a cuenta mensuales: 1.5% de ingresos netos mensuales
  const pagoACuentaMensual = Math.round(ingresosNetosMensuales * 0.015 * 100) / 100

  return {
    utilidadNeta,
    impuestoRenta: Math.round(impuestoRenta * 100) / 100,
    tasa: Math.round(tasa * 10000) / 10000,
    regimen,
    pagoACuentaMensual,
  }
}

/**
 * Genera calendario de obligaciones tributarias mensuales
 */
export function getCalendarioTributario(anio: number) {
  const meses = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1
    // Vencimiento según último dígito de RUC (aproximado al día 15-20 del mes siguiente)
    const mesVencimiento = mes === 12 ? 1 : mes + 1
    const anioVencimiento = mes === 12 ? anio + 1 : anio

    return {
      periodo: `${anio}-${String(mes).padStart(2, '0')}`,
      mesNombre: new Date(anio, i).toLocaleDateString('es-PE', { month: 'long' }),
      fechaVencimientoAprox: `${anioVencimiento}-${String(mesVencimiento).padStart(2, '0')}-15`,
      obligaciones: ['IGV', 'Pago a cuenta IR', 'PDT 621'],
    }
  })

  return meses
}
