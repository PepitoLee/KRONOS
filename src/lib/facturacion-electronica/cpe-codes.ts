// Codigos SUNAT para Comprobantes de Pago Electronico (CPE)
// Referencia: Anexos de la RS 340-2017/SUNAT y actualizaciones

export const tiposComprobante: Record<string, string> = {
  '01': 'Factura',
  '03': 'Boleta de Venta',
  '07': 'Nota de Credito',
  '08': 'Nota de Debito',
}

export const tiposDocumentoIdentidad: Record<string, string> = {
  '0': 'Otros',
  '1': 'DNI',
  '4': 'Carnet de Extranjeria',
  '6': 'RUC',
  '7': 'Pasaporte',
}

export const tiposAfectacionIGV: Record<string, string> = {
  '10': 'Gravado - Operacion Onerosa',
  '11': 'Gravado - Retiro por premio',
  '12': 'Gravado - Retiro por donacion',
  '13': 'Gravado - Retiro',
  '14': 'Gravado - Retiro por publicidad',
  '15': 'Gravado - Bonificaciones',
  '16': 'Gravado - Retiro por entrega a trabajadores',
  '20': 'Exonerado - Operacion Onerosa',
  '30': 'Inafecto - Operacion Onerosa',
  '31': 'Inafecto - Retiro por bonificacion',
  '32': 'Inafecto - Retiro',
  '33': 'Inafecto - Retiro por muestras medicas',
  '34': 'Inafecto - Retiro por convenio colectivo',
  '35': 'Inafecto - Retiro por premio',
  '36': 'Inafecto - Retiro por publicidad',
  '40': 'Exportacion',
}

export const unidadesMedida: Record<string, string> = {
  'NIU': 'Unidad (Bienes)',
  'ZZ': 'Servicio',
  'KGM': 'Kilogramo',
  'MTR': 'Metro',
  'LTR': 'Litro',
  'GLL': 'Galon',
  'TNE': 'Tonelada',
  'HUR': 'Hora',
  'DAY': 'Dia',
  'MON': 'Mes',
  'BX': 'Caja',
  'DZN': 'Docena',
  'PK': 'Paquete',
  'SET': 'Juego',
  'GRM': 'Gramo',
}

export const tiposMoneda: Record<string, string> = {
  'PEN': 'Sol',
  'USD': 'Dolar Americano',
  'EUR': 'Euro',
}

export const codigosError: Record<string, string> = {
  '2010': 'El numero de RUC del emisor no existe',
  '2017': 'El numero de documento del receptor no cumple con el estandar',
  '2022': 'El numero de serie no corresponde al tipo de comprobante',
  '2023': 'El numero correlativo no cumple con el formato establecido',
  '2033': 'El tipo de moneda no es valido',
  '2070': 'La fecha de emision se encuentra fuera del plazo permitido',
  '2072': 'El IGV calculado no corresponde al valor del item',
  '2100': 'El tipo de documento de identidad del receptor no es valido',
  '2116': 'El valor unitario del item difiere del precio unitario entre la cantidad',
  '2171': 'El total del comprobante no coincide con la sumatoria de items',
  '2204': 'El numero de RUC del emisor no se encuentra activo',
  '2205': 'El numero de RUC del emisor no se encuentra habido',
  '2302': 'El comprobante ya fue informado anteriormente',
  '2371': 'El tipo de afectacion del IGV no es consistente con el monto de IGV',
  '2505': 'El tipo de cambio no se encuentra dentro del rango permitido',
  '2800': 'Error en la estructura del XML',
  '2801': 'La firma digital del comprobante no es valida',
  '2950': 'El documento electrónico se encuentra fuera del plazo de envio',
}

export const tiposNotaCredito: Record<string, string> = {
  '01': 'Anulacion de la operacion',
  '02': 'Anulacion por error en el RUC',
  '03': 'Correccion por error en la descripcion',
  '04': 'Descuento global',
  '05': 'Descuento por item',
  '06': 'Devolucion total',
  '07': 'Devolucion parcial',
  '08': 'Bonificacion',
  '09': 'Disminucion en el valor',
  '10': 'Otros conceptos',
}

export const tiposNotaDebito: Record<string, string> = {
  '01': 'Intereses por mora',
  '02': 'Aumento en el valor',
  '03': 'Penalidades / otros conceptos',
}
