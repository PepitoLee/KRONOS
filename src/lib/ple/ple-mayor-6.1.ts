/**
 * PLE Libro Mayor - Libro 6.1
 *
 * Genera el archivo TXT del Libro Mayor segun
 * el formato 6.1 establecido por SUNAT.
 *
 * El Libro Mayor agrupa los movimientos del Libro Diario
 * por cuenta contable, mostrando los saldos acumulados.
 *
 * Referencia: Anexo N 2 - Estructura del Libro Mayor
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

export interface PLEMayorRecord {
  /** Periodo: formato YYYYMM00 */
  periodo: string;
  /** Codigo Unico de Operacion (referencia al asiento del diario) */
  cuo: string;
  /** Correlativo del asiento contable */
  correlativo: string;
  /** Codigo de la cuenta contable (PCGE vigente) */
  cuenta_contable: string;
  /** Codigo de la unidad de operacion */
  unidad_operacion: string;
  /** Codigo del centro de costos */
  centro_costos: string;
  /** Tipo de moneda de origen: PEN=Soles, USD=Dolares */
  tipo_moneda: string;
  /**
   * Tipo de documento de identidad:
   * 0=Otros, 1=DNI, 4=Carnet de Extranjeria, 6=RUC, 7=Pasaporte
   */
  tipo_doc_identidad: string;
  /** Numero de documento de identidad */
  numero_doc: string;
  /** Tipo de comprobante de pago o documento */
  tipo_comprobante: string;
  /** Serie del comprobante */
  serie: string;
  /** Numero del comprobante */
  numero: string;
  /** Fecha contable: YYYY-MM-DD */
  fecha: string;
  /** Fecha de vencimiento: YYYY-MM-DD */
  fecha_vencimiento: string;
  /** Fecha de operacion o emision: YYYY-MM-DD */
  fecha_operacion: string;
  /** Glosa o descripcion de la operacion */
  glosa: string;
  /** Glosa referencial */
  glosa_referencial: string;
  /** Debe (monto en el debe) */
  debe: number;
  /** Haber (monto en el haber) */
  haber: number;
  /** Dato estructurado (codigo del libro o registro de origen) */
  dato_estructurado: string;
  /**
   * Estado de la operacion:
   * 1=Abierto/vigente, 8=Anulado, 9=Anulado en periodo anterior
   */
  estado: string;
}

/**
 * Agrupa movimientos por cuenta contable y genera el contenido
 * TXT del Libro Mayor PLE 6.1.
 *
 * Los movimientos se ordenan primero por cuenta contable
 * y luego por fecha, tal como lo requiere el formato del Libro Mayor.
 *
 * @param movimientos - Lista de movimientos contables (pueden provenir del Libro Diario)
 * @param config - Configuracion PLE (periodo, ruc, tipo_libro)
 * @returns Contenido del archivo TXT con formato PLE
 */
export function generatePLEMayor(
  movimientos: any[],
  config: PLEConfig
): string {
  const lines: string[] = [];
  const periodoFull = config.periodo + '00';

  const sorted = sortByCuentaAndFecha(movimientos);

  sorted.forEach((mov, index) => {
    const record = mapToMayorRecord(mov, periodoFull, index);
    const fields = buildMayorFields(record);
    lines.push(formatPLELine(fields));
  });

  return lines.join('\r\n');
}

/**
 * Ordena los movimientos primero por cuenta contable y luego por fecha.
 * Esto asegura que el Libro Mayor presente los registros agrupados
 * correctamente por cuenta.
 */
function sortByCuentaAndFecha(movimientos: any[]): any[] {
  return [...movimientos].sort((a, b) => {
    const cuentaA = a.cuenta_contable || a.codigo_cuenta || '';
    const cuentaB = b.cuenta_contable || b.codigo_cuenta || '';

    if (cuentaA < cuentaB) return -1;
    if (cuentaA > cuentaB) return 1;

    const fechaA = a.fecha || a.fecha_operacion || '';
    const fechaB = b.fecha || b.fecha_operacion || '';

    if (fechaA < fechaB) return -1;
    if (fechaA > fechaB) return 1;

    return 0;
  });
}

/**
 * Mapea un movimiento generico a un PLEMayorRecord.
 */
function mapToMayorRecord(
  mov: any,
  periodo: string,
  index: number
): PLEMayorRecord {
  const cuo = mov.cuo || padLeft(String(mov.asiento_id || index + 1), 10);
  const correlativo = padLeft(String(mov.correlativo || mov.linea || index + 1), 10);

  return {
    periodo: periodo,
    cuo: cuo,
    correlativo: correlativo,
    cuenta_contable: mov.cuenta_contable || mov.codigo_cuenta || '',
    unidad_operacion: mov.unidad_operacion || '',
    centro_costos: mov.centro_costos || '',
    tipo_moneda: mov.tipo_moneda || mov.moneda || 'PEN',
    tipo_doc_identidad: mov.tipo_doc_identidad || '',
    numero_doc: mov.numero_doc || mov.ruc || '',
    tipo_comprobante: mov.tipo_comprobante || '',
    serie: mov.serie || '',
    numero: mov.numero || '',
    fecha: mov.fecha || '',
    fecha_vencimiento: mov.fecha_vencimiento || '',
    fecha_operacion: mov.fecha_operacion || mov.fecha || '',
    glosa: mov.glosa || '',
    glosa_referencial: mov.glosa_referencial || '',
    debe: Number(mov.debe) || 0,
    haber: Number(mov.haber) || 0,
    dato_estructurado: mov.dato_estructurado || '',
    estado: mov.estado || '1',
  };
}

/**
 * Construye el arreglo de campos PLE para una linea del Libro Mayor 6.1.
 *
 * La estructura es identica al Libro Diario 5.1 ya que ambos comparten
 * el mismo formato de campos segun la normativa SUNAT.
 */
function buildMayorFields(record: PLEMayorRecord): PLEField[] {
  return [
    { value: record.periodo, length: 8, type: 'text' },
    { value: record.cuo, length: 40, type: 'text' },
    { value: record.correlativo, length: 10, type: 'text' },
    { value: record.cuenta_contable, length: 24, type: 'text' },
    { value: record.unidad_operacion, length: 24, type: 'text' },
    { value: record.centro_costos, length: 24, type: 'text' },
    { value: record.tipo_moneda, length: 3, type: 'text' },
    { value: record.tipo_doc_identidad, length: 1, type: 'text' },
    { value: record.numero_doc, length: 15, type: 'text' },
    { value: record.tipo_comprobante, length: 2, type: 'text' },
    { value: record.serie, length: 20, type: 'text' },
    { value: record.numero, length: 20, type: 'text' },
    { value: record.fecha, length: 10, type: 'date' },
    { value: record.fecha_vencimiento, length: 10, type: 'date' },
    { value: record.fecha_operacion, length: 10, type: 'date' },
    { value: record.glosa, length: 200, type: 'text' },
    { value: record.glosa_referencial, length: 200, type: 'text' },
    { value: record.debe, length: 15, type: 'number' },
    { value: record.haber, length: 15, type: 'number' },
    { value: record.dato_estructurado, length: 24, type: 'text' },
    { value: record.estado, length: 1, type: 'text' },
  ];
}
