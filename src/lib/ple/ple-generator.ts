/**
 * PLE (Programa de Libros Electronicos) - Core Generator
 *
 * Utilities for generating SUNAT-compliant TXT files
 * for Peru's electronic accounting books system.
 *
 * Format specification: SUNAT Resoluciones de Superintendencia
 * All fields are pipe-separated (|) with specific formatting rules.
 */

export interface PLEConfig {
  /** Periodo contable en formato YYYYMM */
  periodo: string;
  /** RUC del contribuyente (11 digitos) */
  ruc: string;
  /** Tipo de libro electronico (ej: "050100", "060100", "080100", "140100") */
  tipo_libro: string;
}

export interface PLEField {
  /** Valor del campo */
  value: string | number;
  /** Longitud maxima del campo */
  length: number;
  /** Tipo de dato del campo */
  type: 'text' | 'number' | 'date';
}

/**
 * Rellena un string por la izquierda con el caracter indicado
 * hasta alcanzar la longitud deseada.
 */
export function padLeft(value: string, length: number, char: string = '0'): string {
  const str = String(value);
  if (str.length >= length) {
    return str.substring(0, length);
  }
  return char.repeat(length - str.length) + str;
}

/**
 * Convierte una fecha de formato YYYY-MM-DD a DD/MM/YYYY
 * que es el formato requerido por SUNAT en los archivos PLE.
 */
export function formatPLEDate(date: string): string {
  if (!date || date.trim() === '') {
    return '';
  }

  const parts = date.split('-');
  if (parts.length !== 3) {
    return date;
  }

  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Formatea un monto numerico a 2 decimales con punto decimal,
 * segun el formato requerido por SUNAT.
 */
export function formatPLEAmount(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00';
  }
  return amount.toFixed(2);
}

/**
 * Genera una linea PLE a partir de un arreglo de campos,
 * separados por pipe (|). Cada linea termina con pipe.
 */
export function formatPLELine(fields: PLEField[]): string {
  const values = fields.map((field) => {
    const raw = field.value !== null && field.value !== undefined
      ? String(field.value)
      : '';

    switch (field.type) {
      case 'number':
        return formatPLEAmount(Number(raw) || 0);

      case 'date':
        return formatPLEDate(raw);

      case 'text':
      default:
        if (field.length > 0 && raw.length > field.length) {
          return raw.substring(0, field.length);
        }
        return raw;
    }
  });

  return values.join('|') + '|';
}

/**
 * Genera el nombre de archivo PLE segun el formato oficial de SUNAT:
 * LE{RUC}{YYYYMM00}{libro}{hoja}{operIndicator}{content}{moneda}{genIndicator}.txt
 *
 * @param ruc - RUC del contribuyente (11 digitos)
 * @param periodo - Periodo en formato YYYYMM
 * @param libro - Identificador del libro (ej: "140100")
 * @param hoja - Numero de hoja informativa
 * @param operIndicator - Indicador de operaciones: 1=con info, 0=sin info
 * @param content - Indicador de contenido: 1=con contenido, 0=sin contenido
 * @param moneda - Indicador de moneda: 1=soles, 2=dolares
 * @param genIndicator - Indicador de generacion: 1=generado
 */
export function generatePLEFilename(
  ruc: string,
  periodo: string,
  libro: string,
  hoja: string = '00',
  operIndicator: string = '1',
  content: string = '1',
  moneda: string = '1',
  genIndicator: string = '1'
): string {
  const paddedRuc = padLeft(ruc, 11);
  const periodoDay = periodo + '00';

  return `LE${paddedRuc}${periodoDay}${libro}${hoja}${operIndicator}${content}${moneda}${genIndicator}.txt`;
}

/**
 * Crea un archivo Blob con el contenido PLE y dispara la descarga
 * en el navegador del usuario.
 */
export function downloadPLETxt(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
