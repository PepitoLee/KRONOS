/**
 * PLE Libro Diario - Libro 5.1
 *
 * Genera el archivo TXT del Libro Diario segun
 * el formato 5.1 establecido por SUNAT.
 *
 * Referencia: Anexo N 2 - Estructura del Libro Diario
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

export interface PLEDiarioRecord {
  /** Periodo: formato YYYYMM00 */
  periodo: string;
  /** Codigo Unico de Operacion (numero correlativo del asiento contable) */
  cuo: string;
  /** Correlativo del asiento contable (numero de linea del movimiento) */
  correlativo: string;
  /** Codigo de la cuenta contable (debe coincidir con el PCGE vigente) */
  cuenta_contable: string;
  /** Codigo de la unidad de operacion o centro de operacion */
  unidad_operacion: string;
  /** Codigo del centro de costos */
  centro_costos: string;
  /** Tipo de moneda de origen: PEN=Soles, USD=Dolares */
  tipo_moneda: string;
  /**
   * Tipo de documento de identidad del emisor:
   * 0=Otros, 1=DNI, 4=Carnet de Extranjeria, 6=RUC, 7=Pasaporte
   */
  tipo_doc_identidad: string;
  /** Numero de documento de identidad del emisor */
  numero_doc: string;
  /**
   * Tipo de comprobante de pago o documento asociado:
   * 01=Factura, 03=Boleta, 07=Nota de Credito, 08=Nota de Debito,
   * 00=Otros, 05=Libro contable
   */
  tipo_comprobante: string;
  /** Serie del comprobante o codigo de la dependencia */
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
  /** Glosa referencial (descripcion adicional) */
  glosa_referencial: string;
  /** Debe (monto en el debe) */
  debe: number;
  /** Haber (monto en el haber) */
  haber: number;
  /**
   * Dato estructurado (codigo del libro o registro):
   * Ej: 0501 para Libro Diario
   */
  dato_estructurado: string;
  /**
   * Estado de la operacion:
   * 1=Abierto/vigente, 8=Anulado, 9=Anulado en periodo anterior
   */
  estado: string;
}

/**
 * Genera el contenido TXT del Libro Diario PLE 5.1
 *
 * @param asientos - Lista de asientos contables (cabecera con glosa, fecha, etc.)
 * @param movimientos - Lista de movimientos/lineas de cada asiento
 * @param config - Configuracion PLE (periodo, ruc, tipo_libro)
 * @returns Contenido del archivo TXT con formato PLE
 */
export function generatePLEDiario(
  asientos: any[],
  movimientos: any[],
  config: PLEConfig
): string {
  const lines: string[] = [];
  const periodoFull = config.periodo + '00';

  /**
   * Si se proporcionan movimientos separados, se usan directamente.
   * Si no, se intentan extraer los movimientos de cada asiento.
   */
  if (movimientos && movimientos.length > 0) {
    movimientos.forEach((mov, index) => {
      const asiento = findAsiento(asientos, mov.asiento_id || mov.cuo);
      const record = mapToDiarioRecord(mov, asiento, periodoFull, index);
      const fields = buildDiarioFields(record);
      lines.push(formatPLELine(fields));
    });
  } else {
    let lineNumber = 0;

    asientos.forEach((asiento) => {
      const detalles = asiento.movimientos || asiento.detalles || [];

      detalles.forEach((detalle: any) => {
        lineNumber++;
        const record = mapToDiarioRecord(detalle, asiento, periodoFull, lineNumber - 1);
        const fields = buildDiarioFields(record);
        lines.push(formatPLELine(fields));
      });
    });
  }

  return lines.join('\r\n');
}

/**
 * Busca un asiento en la lista por su ID o CUO.
 */
function findAsiento(asientos: any[], asientoId: string | number): any {
  if (!asientos || !asientoId) return {};

  return asientos.find(
    (a) => a.id === asientoId || a.cuo === asientoId || String(a.id) === String(asientoId)
  ) || {};
}

/**
 * Mapea un movimiento y su asiento padre a un PLEDiarioRecord.
 */
function mapToDiarioRecord(
  mov: any,
  asiento: any,
  periodo: string,
  index: number
): PLEDiarioRecord {
  const cuo = mov.cuo || asiento?.cuo || padLeft(String(asiento?.id || index + 1), 10);
  const correlativoLinea = padLeft(String(mov.correlativo || mov.linea || index + 1), 10);

  return {
    periodo: periodo,
    cuo: cuo,
    correlativo: correlativoLinea,
    cuenta_contable: mov.cuenta_contable || mov.codigo_cuenta || '',
    unidad_operacion: mov.unidad_operacion || '',
    centro_costos: mov.centro_costos || '',
    tipo_moneda: mov.tipo_moneda || mov.moneda || 'PEN',
    tipo_doc_identidad: mov.tipo_doc_identidad || '',
    numero_doc: mov.numero_doc || mov.ruc || '',
    tipo_comprobante: mov.tipo_comprobante || asiento?.tipo_comprobante || '',
    serie: mov.serie || asiento?.serie || '',
    numero: mov.numero || asiento?.numero || '',
    fecha: mov.fecha || asiento?.fecha || '',
    fecha_vencimiento: mov.fecha_vencimiento || asiento?.fecha_vencimiento || '',
    fecha_operacion: mov.fecha_operacion || asiento?.fecha_operacion || mov.fecha || asiento?.fecha || '',
    glosa: mov.glosa || asiento?.glosa || '',
    glosa_referencial: mov.glosa_referencial || '',
    debe: Number(mov.debe) || 0,
    haber: Number(mov.haber) || 0,
    dato_estructurado: mov.dato_estructurado || '',
    estado: mov.estado || asiento?.estado || '1',
  };
}

/**
 * Construye el arreglo de campos PLE para una linea del Libro Diario 5.1.
 */
function buildDiarioFields(record: PLEDiarioRecord): PLEField[] {
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
