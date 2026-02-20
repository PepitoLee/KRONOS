export type Rol = 'admin' | 'contador' | 'tesorero' | 'auditor' | 'usuario'

export type EstadoDocumento = 'registrado' | 'contabilizado' | 'anulado'
export type TipoDocumento = 'factura' | 'boleta' | 'nota_credito' | 'nota_debito' | 'recibo_honorarios' | 'ticket'
export type TipoOperacion = 'compra' | 'venta'
export type Moneda = 'PEN' | 'USD'

export type EstadoPeriodo = 'abierto' | 'cerrado'
export type TipoCuenta = 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto' | 'costo'
export type NaturalezaCuenta = 'deudora' | 'acreedora'

export type EstadoEmpleado = 'activo' | 'cesado' | 'vacaciones' | 'licencia'
export type TipoContrato = 'indefinido' | 'plazo_fijo' | 'parcial' | 'formativo'
export type RegimenLaboral = 'general' | 'mype' | 'micro'

export type EstadoPlanilla = 'borrador' | 'calculado' | 'aprobado' | 'pagado'
export type TipoPlanilla = 'mensual' | 'gratificacion' | 'cts' | 'liquidacion'

export type EstadoPedido = 'borrador' | 'solicitado' | 'aprobado' | 'enviado' | 'recibido_parcial' | 'recibido' | 'cancelado'
export type EstadoReclamo = 'abierto' | 'en_proceso' | 'resuelto' | 'cerrado' | 'escalado'
export type PrioridadReclamo = 'baja' | 'media' | 'alta' | 'critica'

export type RegimenTributario = 'GENERAL' | 'MYPE' | 'RER' | 'RUS'

// Constantes tributarias Perú 2025
export const UIT_2025 = 5350
export const IGV_TASA = 0.18
export const ESSALUD_TASA = 0.09
export const ONP_TASA = 0.13
export const RMV_2025 = 1130
export const RENTA_GENERAL_TASA = 0.295
export const ASIGNACION_FAMILIAR = RMV_2025 * 0.10

export const RENTA_5TA_ESCALA = [
  { limite: 5, tasa: 0.08 },
  { limite: 20, tasa: 0.14 },
  { limite: 35, tasa: 0.17 },
  { limite: 45, tasa: 0.20 },
  { limite: Infinity, tasa: 0.30 },
]
