/**
 * Motor de contabilidad automatica - KRONOS ERP Financiero
 * Genera asientos contables (journal entries) a partir de documentos comerciales
 * siguiendo el Plan Contable General Empresarial (PCGE) peruano.
 */

import { existeCuentaPCGE } from './pcge-catalog'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface AsientoLinea {
  /** Codigo de cuenta PCGE (4 digitos) */
  cuenta_codigo: string
  /** Descripcion de la linea del asiento */
  glosa: string
  /** Monto al debe */
  debe: number
  /** Monto al haber */
  haber: number
}

export interface AsientoGenerado {
  /** Descripcion general del asiento */
  glosa: string
  /** Tipo de asiento: VENTA, COMPRA, NC_VENTA, NC_COMPRA, ND_VENTA, ND_COMPRA, HONORARIOS */
  tipo: string
  /** Lineas del asiento contable */
  lineas: AsientoLinea[]
}

export interface DocumentoInput {
  /** Tipo de comprobante de pago */
  tipo: 'factura' | 'boleta' | 'nota_credito' | 'nota_debito' | 'recibo_honorarios' | 'ticket'
  /** Indica si el documento corresponde a una compra o venta */
  tipo_operacion: 'compra' | 'venta'
  /** Base imponible sin IGV */
  subtotal: number
  /** Monto del IGV */
  igv: number
  /** Monto total del documento */
  total: number
  /** Serie del comprobante (ej. F001, B001, E001) */
  serie: string
  /** Numero correlativo del comprobante */
  numero: string
  /** Razon social o nombre del cliente/proveedor */
  nombre_tercero: string
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100
}

function construirGlosa(doc: DocumentoInput): string {
  const tipoDoc = doc.tipo.replace(/_/g, ' ').toUpperCase()
  return `${tipoDoc} ${doc.serie}-${doc.numero} ${doc.nombre_tercero}`
}

/**
 * Invierte debe y haber en cada linea del asiento.
 * Utilizado para notas de credito que revierten operaciones previas.
 */
function invertirLineas(lineas: AsientoLinea[]): AsientoLinea[] {
  return lineas.map((linea) => ({
    ...linea,
    debe: linea.haber,
    haber: linea.debe,
  }))
}

// ---------------------------------------------------------------------------
// Generadores por tipo de operacion
// ---------------------------------------------------------------------------

function generarAsientoVenta(doc: DocumentoInput): AsientoLinea[] {
  return [
    {
      cuenta_codigo: '1212',
      glosa: `Cuentas por cobrar - ${doc.nombre_tercero}`,
      debe: redondear(doc.total),
      haber: 0,
    },
    {
      cuenta_codigo: '7011',
      glosa: `Ventas mercaderias - ${doc.serie}-${doc.numero}`,
      debe: 0,
      haber: redondear(doc.subtotal),
    },
    {
      cuenta_codigo: '4011',
      glosa: `IGV ventas - ${doc.serie}-${doc.numero}`,
      debe: 0,
      haber: redondear(doc.igv),
    },
  ]
}

function generarAsientoCompra(doc: DocumentoInput): AsientoLinea[] {
  return [
    {
      cuenta_codigo: '6011',
      glosa: `Compras mercaderias - ${doc.nombre_tercero}`,
      debe: redondear(doc.subtotal),
      haber: 0,
    },
    {
      cuenta_codigo: '4011',
      glosa: `Credito fiscal IGV - ${doc.serie}-${doc.numero}`,
      debe: redondear(doc.igv),
      haber: 0,
    },
    {
      cuenta_codigo: '4212',
      glosa: `Cuentas por pagar - ${doc.nombre_tercero}`,
      debe: 0,
      haber: redondear(doc.total),
    },
  ]
}

function generarAsientoHonorariosCompra(doc: DocumentoInput): AsientoLinea[] {
  return [
    {
      cuenta_codigo: '6329',
      glosa: `Servicios terceros - ${doc.nombre_tercero}`,
      debe: redondear(doc.subtotal),
      haber: 0,
    },
    {
      cuenta_codigo: '4011',
      glosa: `Credito fiscal IGV - ${doc.serie}-${doc.numero}`,
      debe: redondear(doc.igv),
      haber: 0,
    },
    {
      cuenta_codigo: '4212',
      glosa: `Cuentas por pagar honorarios - ${doc.nombre_tercero}`,
      debe: 0,
      haber: redondear(doc.total),
    },
  ]
}

function generarAsientoHonorariosVenta(doc: DocumentoInput): AsientoLinea[] {
  return [
    {
      cuenta_codigo: '1212',
      glosa: `Cuentas por cobrar - ${doc.nombre_tercero}`,
      debe: redondear(doc.total),
      haber: 0,
    },
    {
      cuenta_codigo: '7041',
      glosa: `Ingresos por servicios - ${doc.serie}-${doc.numero}`,
      debe: 0,
      haber: redondear(doc.subtotal),
    },
    {
      cuenta_codigo: '4011',
      glosa: `IGV ventas servicios - ${doc.serie}-${doc.numero}`,
      debe: 0,
      haber: redondear(doc.igv),
    },
  ]
}

// ---------------------------------------------------------------------------
// Determinacion del tipo de asiento
// ---------------------------------------------------------------------------

function determinarTipoAsiento(doc: DocumentoInput): string {
  const esVenta = doc.tipo_operacion === 'venta'

  switch (doc.tipo) {
    case 'factura':
    case 'boleta':
    case 'ticket':
      return esVenta ? 'VENTA' : 'COMPRA'
    case 'nota_credito':
      return esVenta ? 'NC_VENTA' : 'NC_COMPRA'
    case 'nota_debito':
      return esVenta ? 'ND_VENTA' : 'ND_COMPRA'
    case 'recibo_honorarios':
      return esVenta ? 'HONORARIOS_VENTA' : 'HONORARIOS_COMPRA'
    default:
      return esVenta ? 'VENTA' : 'COMPRA'
  }
}

// ---------------------------------------------------------------------------
// Funcion principal
// ---------------------------------------------------------------------------

/**
 * Genera un asiento contable completo a partir de un documento comercial.
 *
 * Reglas aplicadas:
 * - Facturas/boletas/tickets de venta: Debe 1212, Haber 7011 + 4011
 * - Facturas/boletas/tickets de compra: Debe 6011 + 4011, Haber 4212
 * - Notas de credito: invierten el asiento de la operacion original
 * - Notas de debito: mismo sentido que la operacion original
 * - Recibos de honorarios: usan cuenta 63xx en lugar de 60xx
 *
 * @param doc - Documento de entrada con datos del comprobante
 * @returns Asiento contable generado con todas sus lineas
 */
export function generarAsientoContable(doc: DocumentoInput): AsientoGenerado {
  const tipoAsiento = determinarTipoAsiento(doc)
  const glosa = construirGlosa(doc)
  let lineas: AsientoLinea[]

  switch (tipoAsiento) {
    case 'VENTA':
      lineas = generarAsientoVenta(doc)
      break

    case 'COMPRA':
      lineas = generarAsientoCompra(doc)
      break

    case 'NC_VENTA':
      lineas = invertirLineas(generarAsientoVenta(doc))
      break

    case 'NC_COMPRA':
      lineas = invertirLineas(generarAsientoCompra(doc))
      break

    case 'ND_VENTA':
      lineas = generarAsientoVenta(doc)
      break

    case 'ND_COMPRA':
      lineas = generarAsientoCompra(doc)
      break

    case 'HONORARIOS_COMPRA':
      lineas = generarAsientoHonorariosCompra(doc)
      break

    case 'HONORARIOS_VENTA':
      lineas = generarAsientoHonorariosVenta(doc)
      break

    default:
      lineas = generarAsientoVenta(doc)
  }

  return {
    glosa,
    tipo: tipoAsiento,
    lineas,
  }
}

// ---------------------------------------------------------------------------
// Validacion
// ---------------------------------------------------------------------------

/**
 * Valida un asiento contable generado.
 *
 * Verificaciones:
 * 1. Principio de partida doble: total debe === total haber
 * 2. Todas las cuentas existen en el catalogo PCGE
 * 3. No existen lineas con montos negativos
 * 4. El asiento tiene al menos 2 lineas
 *
 * @param asiento - Asiento contable a validar
 * @returns Resultado de la validacion con detalle del error si existe
 */
export function validarAsiento(asiento: AsientoGenerado): {
  valido: boolean
  error?: string
} {
  if (!asiento.lineas || asiento.lineas.length < 2) {
    return {
      valido: false,
      error: 'El asiento debe tener al menos 2 lineas',
    }
  }

  const totalDebe = asiento.lineas.reduce(
    (sum, linea) => sum + redondear(linea.debe),
    0
  )
  const totalHaber = asiento.lineas.reduce(
    (sum, linea) => sum + redondear(linea.haber),
    0
  )

  if (redondear(totalDebe) !== redondear(totalHaber)) {
    return {
      valido: false,
      error: `Partida doble no cuadra: Debe ${redondear(totalDebe).toFixed(2)} != Haber ${redondear(totalHaber).toFixed(2)}`,
    }
  }

  for (const linea of asiento.lineas) {
    if (!existeCuentaPCGE(linea.cuenta_codigo)) {
      return {
        valido: false,
        error: `Cuenta ${linea.cuenta_codigo} no existe en el catalogo PCGE`,
      }
    }
  }

  for (const linea of asiento.lineas) {
    if (linea.debe < 0 || linea.haber < 0) {
      return {
        valido: false,
        error: `Linea con cuenta ${linea.cuenta_codigo} tiene montos negativos`,
      }
    }
  }

  return { valido: true }
}
