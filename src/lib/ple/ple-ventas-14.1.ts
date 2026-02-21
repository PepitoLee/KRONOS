/**
 * PLE Registro de Ventas e Ingresos - Libro 14.1
 *
 * Genera el archivo TXT del Registro de Ventas segun
 * el formato 14.1 establecido por SUNAT.
 *
 * Referencia: Anexo N 2 - Estructura del Registro de Ventas e Ingresos
 * Resoluciones SUNAT vigentes.
 */

import {
  type PLEConfig,
  type PLEField,
  formatPLELine,
  formatPLEAmount,
  formatPLEDate,
  padLeft,
} from './ple-generator';

export interface PLEVentaRecord {
  /** Periodo: formato YYYYMM00 */
  periodo: string;
  /** Codigo Unico de Operacion (correlativo del registro o asiento contable) */
  cuo: string;
  /** Correlativo del asiento contable (M + numero) */
  correlativo_asiento: string;
  /** Fecha de emision del comprobante: YYYY-MM-DD */
  fecha_emision: string;
  /** Fecha de vencimiento o pago: YYYY-MM-DD */
  fecha_vencimiento: string;
  /**
   * Tipo de comprobante de pago o documento:
   * 01=Factura, 03=Boleta de Venta, 07=Nota de Credito, 08=Nota de Debito
   */
  tipo_comprobante: string;
  /** Serie del comprobante */
  serie: string;
  /** Numero del comprobante */
  numero: string;
  /** Numero final (para resumen diario de boletas, caso contrario vacio) */
  numero_final: string;
  /**
   * Tipo de documento de identidad del cliente:
   * 0=Otros, 1=DNI, 4=Carnet de Extranjeria, 6=RUC, 7=Pasaporte
   */
  tipo_doc_identidad: string;
  /** Numero de documento de identidad del cliente */
  numero_doc: string;
  /** Apellidos y nombres o razon social del cliente */
  nombre_tercero: string;
  /** Valor facturado de la exportacion */
  exportacion: number;
  /** Base imponible de la operacion gravada */
  base_imponible: number;
  /** Descuento de la base imponible */
  descuento_base: number;
  /** IGV y/o IPM (18%) */
  igv: number;
  /** Descuento del IGV */
  descuento_igv: number;
  /** Importe total de la operacion exonerada */
  exonerada: number;
  /** Importe total de la operacion inafecta */
  inafecta: number;
  /** ISC (Impuesto Selectivo al Consumo) */
  isc: number;
  /** Base imponible de la operacion gravada con IVAP */
  base_ivap: number;
  /** IVAP */
  ivap: number;
  /** ICBPER (Impuesto al Consumo de Bolsas de Plastico) */
  icbper: number;
  /** Otros tributos y cargos */
  otros_tributos: number;
  /** Importe total del comprobante de pago */
  total: number;
  /** Tipo de cambio (si moneda extranjera) */
  tipo_cambio: number;
  /** Fecha de emision del comprobante que se modifica: YYYY-MM-DD */
  fecha_emision_mod: string;
  /** Tipo del comprobante que se modifica */
  tipo_comp_mod: string;
  /** Serie del comprobante que se modifica */
  serie_mod: string;
  /** Numero del comprobante que se modifica */
  numero_mod: string;
  /** Identificacion del contrato o proyecto */
  contrato: string;
  /** Error tipo 1: inconsistencia en el tipo de cambio */
  error_tipo1: number;
  /** Indicador de pago del IGV: marca de pago */
  indicador_pago: number;
  /**
   * Estado del comprobante:
   * 1=Abierto/vigente, 2=Anulado con doc, 8=Anulado,
   * 9=Anulado en periodo anterior
   */
  estado: string;
}

/**
 * Genera el contenido TXT del Registro de Ventas PLE 14.1
 *
 * @param documentos - Lista de documentos de venta
 * @param config - Configuracion PLE (periodo, ruc, tipo_libro)
 * @returns Contenido del archivo TXT con formato PLE
 */
export function generatePLEVentas(
  documentos: any[],
  config: PLEConfig
): string {
  const lines: string[] = [];

  documentos.forEach((doc, index) => {
    const correlativo = padLeft(String(index + 1), 10);
    const periodoFull = config.periodo + '00';

    const record = mapToVentaRecord(doc, periodoFull, correlativo);
    const fields = buildVentaFields(record);
    lines.push(formatPLELine(fields));
  });

  return lines.join('\r\n');
}

/**
 * Mapea un documento generico a un PLEVentaRecord.
 */
function mapToVentaRecord(
  doc: any,
  periodo: string,
  correlativo: string
): PLEVentaRecord {
  return {
    periodo: periodo,
    cuo: doc.cuo || correlativo,
    correlativo_asiento: doc.correlativo_asiento || `M${correlativo}`,
    fecha_emision: doc.fecha_emision || '',
    fecha_vencimiento: doc.fecha_vencimiento || doc.fecha_emision || '',
    tipo_comprobante: padLeft(doc.tipo_comprobante || '01', 2),
    serie: doc.serie || '',
    numero: doc.numero || '',
    numero_final: doc.numero_final || '',
    tipo_doc_identidad: doc.tipo_doc_identidad || '6',
    numero_doc: doc.numero_doc || doc.ruc || '',
    nombre_tercero: doc.nombre_tercero || doc.razon_social || '',
    exportacion: Number(doc.exportacion) || 0,
    base_imponible: Number(doc.base_imponible) || 0,
    descuento_base: Number(doc.descuento_base) || 0,
    igv: Number(doc.igv) || 0,
    descuento_igv: Number(doc.descuento_igv) || 0,
    exonerada: Number(doc.exonerada) || 0,
    inafecta: Number(doc.inafecta) || 0,
    isc: Number(doc.isc) || 0,
    base_ivap: Number(doc.base_ivap) || 0,
    ivap: Number(doc.ivap) || 0,
    icbper: Number(doc.icbper) || 0,
    otros_tributos: Number(doc.otros_tributos) || 0,
    total: Number(doc.total) || 0,
    tipo_cambio: Number(doc.tipo_cambio) || 0,
    fecha_emision_mod: doc.fecha_emision_mod || '',
    tipo_comp_mod: doc.tipo_comp_mod || '',
    serie_mod: doc.serie_mod || '',
    numero_mod: doc.numero_mod || '',
    contrato: doc.contrato || '',
    error_tipo1: Number(doc.error_tipo1) || 0,
    indicador_pago: Number(doc.indicador_pago) || 0,
    estado: doc.estado || '1',
  };
}

/**
 * Construye el arreglo de campos PLE para una linea del Registro de Ventas 14.1.
 */
function buildVentaFields(record: PLEVentaRecord): PLEField[] {
  return [
    { value: record.periodo, length: 8, type: 'text' },
    { value: record.cuo, length: 40, type: 'text' },
    { value: record.correlativo_asiento, length: 10, type: 'text' },
    { value: record.fecha_emision, length: 10, type: 'date' },
    { value: record.fecha_vencimiento, length: 10, type: 'date' },
    { value: record.tipo_comprobante, length: 2, type: 'text' },
    { value: record.serie, length: 20, type: 'text' },
    { value: record.numero, length: 20, type: 'text' },
    { value: record.numero_final, length: 20, type: 'text' },
    { value: record.tipo_doc_identidad, length: 1, type: 'text' },
    { value: record.numero_doc, length: 15, type: 'text' },
    { value: record.nombre_tercero, length: 100, type: 'text' },
    { value: record.exportacion, length: 15, type: 'number' },
    { value: record.base_imponible, length: 15, type: 'number' },
    { value: record.descuento_base, length: 15, type: 'number' },
    { value: record.igv, length: 15, type: 'number' },
    { value: record.descuento_igv, length: 15, type: 'number' },
    { value: record.exonerada, length: 15, type: 'number' },
    { value: record.inafecta, length: 15, type: 'number' },
    { value: record.isc, length: 15, type: 'number' },
    { value: record.base_ivap, length: 15, type: 'number' },
    { value: record.ivap, length: 15, type: 'number' },
    { value: record.icbper, length: 15, type: 'number' },
    { value: record.otros_tributos, length: 15, type: 'number' },
    { value: record.total, length: 15, type: 'number' },
    { value: record.tipo_cambio, length: 10, type: 'number' },
    { value: record.fecha_emision_mod, length: 10, type: 'date' },
    { value: record.tipo_comp_mod, length: 2, type: 'text' },
    { value: record.serie_mod, length: 20, type: 'text' },
    { value: record.numero_mod, length: 20, type: 'text' },
    { value: record.contrato, length: 12, type: 'text' },
    { value: record.error_tipo1, length: 1, type: 'text' },
    { value: record.indicador_pago, length: 1, type: 'text' },
    { value: record.estado, length: 1, type: 'text' },
  ];
}
