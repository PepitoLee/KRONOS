export interface ComprobanteElectronico {
  serie: string
  numero: number
  tipo_comprobante: '01' | '03' | '07' | '08' // Factura, Boleta, NC, ND
  fecha_emision: string
  emisor: {
    ruc: string
    razon_social: string
    direccion: string
    ubigeo: string
  }
  receptor: {
    tipo_documento: '6' | '1' | '0' // RUC, DNI, Otros
    numero_documento: string
    razon_social: string
    direccion?: string
  }
  items: ItemComprobante[]
  subtotal: number
  igv: number
  total: number
  moneda: 'PEN' | 'USD'
  tipo_cambio?: number
  estado_sunat?: 'pendiente' | 'aceptado' | 'rechazado' | 'observado'
  hash_cpe?: string
  xml_firmado?: string
  cdr_respuesta?: string
}

export interface ItemComprobante {
  cantidad: number
  unidad_medida: string
  descripcion: string
  valor_unitario: number
  precio_unitario: number
  igv: number
  total: number
  tipo_afectacion_igv: '10' | '20' | '30' // Gravado, Exonerado, Inafecto
}

export interface RespuestaSUNAT {
  codigo: string
  descripcion: string
  hash: string
  aceptado: boolean
  observaciones?: string[]
}
