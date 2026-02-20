/**
 * Motor de cálculo para Estados Financieros
 * Basado en movimientos contables (debe/haber) por cuenta
 */

export interface CuentaSaldo {
  codigo: string
  nombre: string
  tipo: string
  debe: number
  haber: number
  saldo: number
}

export interface EstadoResultados {
  ventasBrutas: number
  descuentosDevoluciones: number
  ventasNetas: number
  costoVentas: number
  utilidadBruta: number
  gastosAdministracion: number
  gastosVenta: number
  utilidadOperativa: number // EBIT
  ingresosFinancieros: number
  gastosFinancieros: number
  utilidadAntesImpuestos: number
  impuestoRenta: number
  utilidadNeta: number
  depreciacion: number
  amortizacion: number
  ebitda: number
}

export interface BalanceGeneral {
  // Activo Corriente
  efectivoEquivalentes: number
  cuentasCobrarComerciales: number
  inventarios: number
  otrosActivosCorrientes: number
  totalActivoCorriente: number
  // Activo No Corriente
  inmueblesMaquinariaEquipo: number
  depreciacionAcumulada: number
  intangibles: number
  totalActivoNoCorriente: number
  totalActivos: number
  // Pasivo Corriente
  cuentasPagarComerciales: number
  tributosPorPagar: number
  remuneracionesPorPagar: number
  otrasCuentasPagar: number
  totalPasivoCorriente: number
  // Pasivo No Corriente
  deudasLargoPlazo: number
  totalPasivoNoCorriente: number
  totalPasivos: number
  // Patrimonio
  capital: number
  resultadosAcumulados: number
  resultadoEjercicio: number
  totalPatrimonio: number
  totalPasivoPatrimonio: number
}

export interface FlujoCaja {
  // Operativo
  cobrosClientes: number
  pagosProveedores: number
  pagosPlanilla: number
  pagosImpuestos: number
  otrosPagosOperativos: number
  flujoOperativo: number
  // Inversión
  compraActivosFijos: number
  ventaActivos: number
  flujoInversion: number
  // Financiamiento
  prestamosRecibidos: number
  amortizacionPrestamos: number
  flujoFinanciamiento: number
  // Neto
  flujoNeto: number
  saldoInicial: number
  saldoFinal: number
}

/**
 * Calcula el Estado de Resultados a partir de saldos de cuentas
 */
export function calcularEstadoResultados(
  cuentas: CuentaSaldo[],
  tasaImpuesto: number = 0.295
): EstadoResultados {
  // Funciones helper para sumar saldos por prefijo de cuenta
  const sumarPorPrefijo = (prefijo: string): number =>
    cuentas
      .filter((c) => c.codigo.startsWith(prefijo))
      .reduce((sum, c) => sum + Math.abs(c.saldo), 0)

  const ventasBrutas = sumarPorPrefijo('70') // Ventas
  const descuentosDevoluciones = sumarPorPrefijo('74') // Descuentos
  const ventasNetas = ventasBrutas - descuentosDevoluciones

  const costoVentas = sumarPorPrefijo('69') // Costo de ventas

  const utilidadBruta = ventasNetas - costoVentas

  const gastosAdministracion = sumarPorPrefijo('94') || sumarPorPrefijo('63') // Gastos admin
  const gastosVenta = sumarPorPrefijo('95') || sumarPorPrefijo('64') // Gastos venta

  const utilidadOperativa = utilidadBruta - gastosAdministracion - gastosVenta

  const ingresosFinancieros = sumarPorPrefijo('77') // Ingresos financieros
  const gastosFinancieros = sumarPorPrefijo('67') // Gastos financieros

  const utilidadAntesImpuestos = utilidadOperativa + ingresosFinancieros - gastosFinancieros

  const impuestoRenta = Math.max(0, utilidadAntesImpuestos * tasaImpuesto)
  const utilidadNeta = utilidadAntesImpuestos - impuestoRenta

  const depreciacion = sumarPorPrefijo('68') // Depreciación
  const amortizacion = 0 // Simplificado

  const ebitda = utilidadOperativa + depreciacion + amortizacion

  return {
    ventasBrutas: round(ventasBrutas),
    descuentosDevoluciones: round(descuentosDevoluciones),
    ventasNetas: round(ventasNetas),
    costoVentas: round(costoVentas),
    utilidadBruta: round(utilidadBruta),
    gastosAdministracion: round(gastosAdministracion),
    gastosVenta: round(gastosVenta),
    utilidadOperativa: round(utilidadOperativa),
    ingresosFinancieros: round(ingresosFinancieros),
    gastosFinancieros: round(gastosFinancieros),
    utilidadAntesImpuestos: round(utilidadAntesImpuestos),
    impuestoRenta: round(impuestoRenta),
    utilidadNeta: round(utilidadNeta),
    depreciacion: round(depreciacion),
    amortizacion: round(amortizacion),
    ebitda: round(ebitda),
  }
}

/**
 * Calcula el Balance General a partir de saldos de cuentas
 */
export function calcularBalanceGeneral(
  cuentas: CuentaSaldo[],
  resultadoEjercicio: number = 0
): BalanceGeneral {
  const sumarPorPrefijo = (prefijo: string): number =>
    cuentas
      .filter((c) => c.codigo.startsWith(prefijo))
      .reduce((sum, c) => sum + Math.abs(c.saldo), 0)

  // Activo Corriente
  const efectivoEquivalentes = sumarPorPrefijo('10') // Efectivo
  const cuentasCobrarComerciales = sumarPorPrefijo('12') // CxC
  const inventarios = sumarPorPrefijo('20') + sumarPorPrefijo('21') // Inventarios
  const otrosActivosCorrientes = sumarPorPrefijo('16') + sumarPorPrefijo('18')
  const totalActivoCorriente =
    efectivoEquivalentes + cuentasCobrarComerciales + inventarios + otrosActivosCorrientes

  // Activo No Corriente
  const inmueblesMaquinariaEquipo = sumarPorPrefijo('33') // IME
  const depreciacionAcumulada = sumarPorPrefijo('39') // Depreciación acumulada
  const intangibles = sumarPorPrefijo('34') // Intangibles
  const totalActivoNoCorriente = inmueblesMaquinariaEquipo - depreciacionAcumulada + intangibles

  const totalActivos = totalActivoCorriente + totalActivoNoCorriente

  // Pasivo Corriente
  const cuentasPagarComerciales = sumarPorPrefijo('42') // CxP
  const tributosPorPagar = sumarPorPrefijo('40') // Tributos
  const remuneracionesPorPagar = sumarPorPrefijo('41') // Remuneraciones
  const otrasCuentasPagar = sumarPorPrefijo('46') + sumarPorPrefijo('47')
  const totalPasivoCorriente =
    cuentasPagarComerciales + tributosPorPagar + remuneracionesPorPagar + otrasCuentasPagar

  // Pasivo No Corriente
  const deudasLargoPlazo = sumarPorPrefijo('45') // Obligaciones financieras LP
  const totalPasivoNoCorriente = deudasLargoPlazo

  const totalPasivos = totalPasivoCorriente + totalPasivoNoCorriente

  // Patrimonio
  const capital = sumarPorPrefijo('50') // Capital
  const resultadosAcumulados = sumarPorPrefijo('59') // Resultados acumulados
  const totalPatrimonio = capital + resultadosAcumulados + resultadoEjercicio

  return {
    efectivoEquivalentes: round(efectivoEquivalentes),
    cuentasCobrarComerciales: round(cuentasCobrarComerciales),
    inventarios: round(inventarios),
    otrosActivosCorrientes: round(otrosActivosCorrientes),
    totalActivoCorriente: round(totalActivoCorriente),
    inmueblesMaquinariaEquipo: round(inmueblesMaquinariaEquipo),
    depreciacionAcumulada: round(depreciacionAcumulada),
    intangibles: round(intangibles),
    totalActivoNoCorriente: round(totalActivoNoCorriente),
    totalActivos: round(totalActivos),
    cuentasPagarComerciales: round(cuentasPagarComerciales),
    tributosPorPagar: round(tributosPorPagar),
    remuneracionesPorPagar: round(remuneracionesPorPagar),
    otrasCuentasPagar: round(otrasCuentasPagar),
    totalPasivoCorriente: round(totalPasivoCorriente),
    deudasLargoPlazo: round(deudasLargoPlazo),
    totalPasivoNoCorriente: round(totalPasivoNoCorriente),
    totalPasivos: round(totalPasivos),
    capital: round(capital),
    resultadosAcumulados: round(resultadosAcumulados),
    resultadoEjercicio: round(resultadoEjercicio),
    totalPatrimonio: round(totalPatrimonio),
    totalPasivoPatrimonio: round(totalPasivos + totalPatrimonio),
  }
}

/**
 * Calcula el Flujo de Caja
 */
export function calcularFlujoCaja(
  movimientos: {
    tipo: string
    concepto: string
    monto: number
    categoria: 'operativo' | 'inversion' | 'financiamiento'
  }[],
  saldoInicial: number = 0
): FlujoCaja {
  const operativos = movimientos.filter((m) => m.categoria === 'operativo')
  const inversiones = movimientos.filter((m) => m.categoria === 'inversion')
  const financiamiento = movimientos.filter((m) => m.categoria === 'financiamiento')

  const cobrosClientes = operativos
    .filter((m) => m.tipo === 'ingreso' && m.concepto.includes('cliente'))
    .reduce((s, m) => s + m.monto, 0)
  const pagosProveedores = operativos
    .filter((m) => m.tipo === 'egreso' && m.concepto.includes('proveedor'))
    .reduce((s, m) => s + m.monto, 0)
  const pagosPlanilla = operativos
    .filter((m) => m.tipo === 'egreso' && m.concepto.includes('planilla'))
    .reduce((s, m) => s + m.monto, 0)
  const pagosImpuestos = operativos
    .filter((m) => m.tipo === 'egreso' && m.concepto.includes('impuesto'))
    .reduce((s, m) => s + m.monto, 0)
  const otrosPagosOperativos = operativos
    .filter(
      (m) =>
        m.tipo === 'egreso' &&
        !m.concepto.includes('proveedor') &&
        !m.concepto.includes('planilla') &&
        !m.concepto.includes('impuesto')
    )
    .reduce((s, m) => s + m.monto, 0)

  const flujoOperativo =
    cobrosClientes - pagosProveedores - pagosPlanilla - pagosImpuestos - otrosPagosOperativos

  const compraActivosFijos = inversiones
    .filter((m) => m.tipo === 'egreso')
    .reduce((s, m) => s + m.monto, 0)
  const ventaActivos = inversiones
    .filter((m) => m.tipo === 'ingreso')
    .reduce((s, m) => s + m.monto, 0)
  const flujoInversion = ventaActivos - compraActivosFijos

  const prestamosRecibidos = financiamiento
    .filter((m) => m.tipo === 'ingreso')
    .reduce((s, m) => s + m.monto, 0)
  const amortizacionPrestamos = financiamiento
    .filter((m) => m.tipo === 'egreso')
    .reduce((s, m) => s + m.monto, 0)
  const flujoFinanciamiento = prestamosRecibidos - amortizacionPrestamos

  const flujoNeto = flujoOperativo + flujoInversion + flujoFinanciamiento
  const saldoFinal = saldoInicial + flujoNeto

  return {
    cobrosClientes: round(cobrosClientes),
    pagosProveedores: round(pagosProveedores),
    pagosPlanilla: round(pagosPlanilla),
    pagosImpuestos: round(pagosImpuestos),
    otrosPagosOperativos: round(otrosPagosOperativos),
    flujoOperativo: round(flujoOperativo),
    compraActivosFijos: round(compraActivosFijos),
    ventaActivos: round(ventaActivos),
    flujoInversion: round(flujoInversion),
    prestamosRecibidos: round(prestamosRecibidos),
    amortizacionPrestamos: round(amortizacionPrestamos),
    flujoFinanciamiento: round(flujoFinanciamiento),
    flujoNeto: round(flujoNeto),
    saldoInicial: round(saldoInicial),
    saldoFinal: round(saldoFinal),
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
