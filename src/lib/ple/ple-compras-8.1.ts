/**
 * PLE Registro de Compras - Libro 8.1
 *
 * Genera el archivo TXT del Registro de Compras segun
 * el formato 8.1 establecido por SUNAT.
 *
 * Referencia: Anexo N 2 - Estructura del Registro de Compras
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

export interface PLECompraRecord {
  /** Periodo: formato YYYYMM00 */
  periodo: string;
  /** Codigo Unico de Operacion */
  cuo: string;
  /** Correlativo del asiento contable */
  correlativo_asiento: string;
  /** Fecha de emision del comprobante: YYYY-MM-DD */
  fecha_emision: string;
  /** Fecha de vencimiento o pago: YYYY-MM-DD */
  fecha_vencimiento: string;
  /**
   * Tipo de comprobante de pago:
   * 01=Factura, 03=Boleta, 07=Nota de Credito, 08=Nota de Debito,
   * 46=Recibo de Servicios Publicos, 50=DUA (importacion)
   */
  tipo_comprobante: string;
  /** Serie del comprobante o codigo de la dependencia aduanera */
  serie: string;
  /** Anio de emision de la DUA o DSI */
  anio_dua: string;
  /** Numero del comprobante o numero de orden del formulario */
  numero: string;
  /** Numero final (reservado, puede quedar vacio) */
  numero_final: string;
  /**
   * Tipo de documento de identidad del proveedor:
   * 0=Otros, 1=DNI, 4=Carnet de Extranjeria, 6=RUC, 7=Pasaporte
   */
  tipo_doc_identidad: string;
  /** Numero de documento de identidad del proveedor */
  numero_doc: string;
  /** Apellidos y nombres o razon social del proveedor */
  nombre_tercero: string;
  /** Base imponible de las adquisiciones gravadas para operaciones gravadas y/o exportacion */
  base_imponible_og: number;
  /** IGV de las adquisiciones gravadas para operaciones gravadas y/o exportacion */
  igv_og: number;
  /** Base imponible de las adquisiciones gravadas para operaciones gravadas y/o exportacion y operaciones no gravadas */
  base_imponible_ogng: number;
  /** IGV de las adquisiciones gravadas para operaciones gravadas y/o exportacion y operaciones no gravadas */
  igv_ogng: number;
  /** Base imponible de las adquisiciones gravadas para operaciones no gravadas */
  base_imponible_ng: number;
  /** IGV de las adquisiciones gravadas para operaciones no gravadas */
  igv_ng: number;
  /** Valor de las adquisiciones no gravadas */
  adquisiciones_no_gravadas: number;
  /** ISC (Impuesto Selectivo al Consumo) */
  isc: number;
  /** ICBPER */
  icbper: number;
  /** Otros tributos y cargos */
  otros_tributos: number;
  /** Importe total del comprobante de pago */
  total: number;
  /** Tipo de cambio */
  tipo_cambio: number;
  /** Fecha de emision del comprobante que se modifica: YYYY-MM-DD */
  fecha_emision_mod: string;
  /** Tipo del comprobante que se modifica */
  tipo_comp_mod: string;
  /** Serie del comprobante que se modifica */
  serie_mod: string;
  /** Codigo de la dependencia aduanera (DUA) del documento modificado */
  cod_dua_mod: string;
  /** Numero del comprobante que se modifica */
  numero_mod: string;
  /** Fecha de emision de la constancia de deposito de detraccion: YYYY-MM-DD */
  fecha_detraccion: string;
  /** Numero de la constancia de deposito de detraccion */
  numero_detraccion: string;
  /** Marca del sujeto no domiciliado */
  marca_no_domiciliado: number;
  /**
   * Clasificacion de bienes y servicios adquiridos (Tabla 30 SUNAT):
   * 1=Bienes, 2=Servicios, 3=Contrato de construccion
   */
  clasificacion_bienes: string;
  /** Identificacion del contrato o proyecto */
  contrato: string;
  /** Error tipo 1: inconsistencia en el tipo de cambio */
  error_tipo1: number;
  /** Error tipo 2: inconsistencia en proveedor no domiciliado */
  error_tipo2: number;
  /** Error tipo 3: inconsistencia en tipo comprobante modificado */
  error_tipo3: number;
  /** Error tipo 4: inconsistencia en la fecha */
  error_tipo4: number;
  /** Indicador de comprobantes de pago cancelados con medios de pago */
  indicador_pago: string;
  /**
   * Estado del comprobante:
   * 0=Anotado periodo anterior, 1=Abierto/vigente, 6=Fecha del periodo,
   * 7=Anotado periodo anterior con ajuste, 9=Anulado
   */
  estado: string;
}

/**
 * Genera el contenido TXT del Registro de Compras PLE 8.1
 *
 * @param documentos - Lista de documentos de compra
 * @param config - Configuracion PLE (periodo, ruc, tipo_libro)
 * @returns Contenido del archivo TXT con formato PLE
 */
export function generatePLECompras(
  documentos: any[],
  config: PLEConfig
): string {
  const lines: string[] = [];

  documentos.forEach((doc, index) => {
    const correlativo = padLeft(String(index + 1), 10);
    const periodoFull = config.periodo + '00';

    const record = mapToCompraRecord(doc, periodoFull, correlativo);
    const fields = buildCompraFields(record);
    lines.push(formatPLELine(fields));
  });

  return lines.join('\r\n');
}

/**
 * Mapea un documento generico a un PLECompraRecord.
 */
function mapToCompraRecord(
  doc: any,
  periodo: string,
  correlativo: string
): PLECompraRecord {
  return {
    periodo: periodo,
    cuo: doc.cuo || correlativo,
    correlativo_asiento: doc.correlativo_asiento || `M${correlativo}`,
    fecha_emision: doc.fecha_emision || '',
    fecha_vencimiento: doc.fecha_vencimiento || doc.fecha_emision || '',
    tipo_comprobante: padLeft(doc.tipo_comprobante || '01', 2),
    serie: doc.serie || '',
    anio_dua: doc.anio_dua || '',
    numero: doc.numero || '',
    numero_final: doc.numero_final || '',
    tipo_doc_identidad: doc.tipo_doc_identidad || '6',
    numero_doc: doc.numero_doc || doc.ruc || '',
    nombre_tercero: doc.nombre_tercero || doc.razon_social || '',
    base_imponible_og: Number(doc.base_imponible_og) || Number(doc.base_imponible) || 0,
    igv_og: Number(doc.igv_og) || Number(doc.igv) || 0,
    base_imponible_ogng: Number(doc.base_imponible_ogng) || 0,
    igv_ogng: Number(doc.igv_ogng) || 0,
    base_imponible_ng: Number(doc.base_imponible_ng) || 0,
    igv_ng: Number(doc.igv_ng) || 0,
    adquisiciones_no_gravadas: Number(doc.adquisiciones_no_gravadas) || 0,
    isc: Number(doc.isc) || 0,
    icbper: Number(doc.icbper) || 0,
    otros_tributos: Number(doc.otros_tributos) || 0,
    total: Number(doc.total) || 0,
    tipo_cambio: Number(doc.tipo_cambio) || 0,
    fecha_emision_mod: doc.fecha_emision_mod || '',
    tipo_comp_mod: doc.tipo_comp_mod || '',
    serie_mod: doc.serie_mod || '',
    cod_dua_mod: doc.cod_dua_mod || '',
    numero_mod: doc.numero_mod || '',
    fecha_detraccion: doc.fecha_detraccion || '',
    numero_detraccion: doc.numero_detraccion || '',
    marca_no_domiciliado: Number(doc.marca_no_domiciliado) || 0,
    clasificacion_bienes: doc.clasificacion_bienes || '',
    contrato: doc.contrato || '',
    error_tipo1: Number(doc.error_tipo1) || 0,
    error_tipo2: Number(doc.error_tipo2) || 0,
    error_tipo3: Number(doc.error_tipo3) || 0,
    error_tipo4: Number(doc.error_tipo4) || 0,
    indicador_pago: doc.indicador_pago || '',
    estado: doc.estado || '1',
  };
}

/**
 * Construye el arreglo de campos PLE para una linea del Registro de Compras 8.1.
 */
function buildCompraFields(record: PLECompraRecord): PLEField[] {
  return [
    { value: record.periodo, length: 8, type: 'text' },
    { value: record.cuo, length: 40, type: 'text' },
    { value: record.correlativo_asiento, length: 10, type: 'text' },
    { value: record.fecha_emision, length: 10, type: 'date' },
    { value: record.fecha_vencimiento, length: 10, type: 'date' },
    { value: record.tipo_comprobante, length: 2, type: 'text' },
    { value: record.serie, length: 20, type: 'text' },
    { value: record.anio_dua, length: 4, type: 'text' },
    { value: record.numero, length: 20, type: 'text' },
    { value: record.numero_final, length: 20, type: 'text' },
    { value: record.tipo_doc_identidad, length: 1, type: 'text' },
    { value: record.numero_doc, length: 15, type: 'text' },
    { value: record.nombre_tercero, length: 100, type: 'text' },
    { value: record.base_imponible_og, length: 15, type: 'number' },
    { value: record.igv_og, length: 15, type: 'number' },
    { value: record.base_imponible_ogng, length: 15, type: 'number' },
    { value: record.igv_ogng, length: 15, type: 'number' },
    { value: record.base_imponible_ng, length: 15, type: 'number' },
    { value: record.igv_ng, length: 15, type: 'number' },
    { value: record.adquisiciones_no_gravadas, length: 15, type: 'number' },
    { value: record.isc, length: 15, type: 'number' },
    { value: record.icbper, length: 15, type: 'number' },
    { value: record.otros_tributos, length: 15, type: 'number' },
    { value: record.total, length: 15, type: 'number' },
    { value: record.tipo_cambio, length: 10, type: 'number' },
    { value: record.fecha_emision_mod, length: 10, type: 'date' },
    { value: record.tipo_comp_mod, length: 2, type: 'text' },
    { value: record.serie_mod, length: 20, type: 'text' },
    { value: record.cod_dua_mod, length: 3, type: 'text' },
    { value: record.numero_mod, length: 20, type: 'text' },
    { value: record.fecha_detraccion, length: 10, type: 'date' },
    { value: record.numero_detraccion, length: 24, type: 'text' },
    { value: record.marca_no_domiciliado, length: 1, type: 'text' },
    { value: record.clasificacion_bienes, length: 1, type: 'text' },
    { value: record.contrato, length: 12, type: 'text' },
    { value: record.error_tipo1, length: 1, type: 'text' },
    { value: record.error_tipo2, length: 1, type: 'text' },
    { value: record.error_tipo3, length: 1, type: 'text' },
    { value: record.error_tipo4, length: 1, type: 'text' },
    { value: record.indicador_pago, length: 1, type: 'text' },
    { value: record.estado, length: 1, type: 'text' },
  ];
}
