export interface IndustryBenchmark {
  metrica: string
  codigo: string
  min: number
  max: number
  promedio: number
  unidad: '%' | 'x' | 'dias'
}

export const benchmarksRestaurante: IndustryBenchmark[] = [
  { metrica: 'Margen Bruto', codigo: 'margen_bruto', min: 35, max: 45, promedio: 40, unidad: '%' },
  { metrica: 'Margen Neto', codigo: 'margen_neto', min: 5, max: 15, promedio: 10, unidad: '%' },
  { metrica: 'Ratio Corriente', codigo: 'ratio_corriente', min: 1.2, max: 1.5, promedio: 1.35, unidad: 'x' },
  { metrica: 'Rotacion Inventario', codigo: 'rotacion_inventario', min: 12, max: 15, promedio: 13.5, unidad: 'x' },
  { metrica: 'Gasto Planilla / Ventas', codigo: 'planilla_ventas', min: 25, max: 35, promedio: 30, unidad: '%' },
  { metrica: 'Dias Cobro Promedio', codigo: 'dias_cobro', min: 7, max: 15, promedio: 10, unidad: 'dias' },
  { metrica: 'Dias Pago Promedio', codigo: 'dias_pago', min: 15, max: 30, promedio: 22, unidad: 'dias' },
  { metrica: 'Costo Alimentos / Ventas', codigo: 'costo_alimentos', min: 28, max: 35, promedio: 31, unidad: '%' },
]

export const benchmarksComercio: IndustryBenchmark[] = [
  { metrica: 'Margen Bruto', codigo: 'margen_bruto', min: 20, max: 35, promedio: 27, unidad: '%' },
  { metrica: 'Margen Neto', codigo: 'margen_neto', min: 3, max: 10, promedio: 6, unidad: '%' },
  { metrica: 'Ratio Corriente', codigo: 'ratio_corriente', min: 1.5, max: 2.0, promedio: 1.75, unidad: 'x' },
  { metrica: 'Rotacion Inventario', codigo: 'rotacion_inventario', min: 6, max: 12, promedio: 9, unidad: 'x' },
  { metrica: 'Gasto Planilla / Ventas', codigo: 'planilla_ventas', min: 10, max: 20, promedio: 15, unidad: '%' },
  { metrica: 'Dias Cobro Promedio', codigo: 'dias_cobro', min: 15, max: 45, promedio: 30, unidad: 'dias' },
  { metrica: 'Dias Pago Promedio', codigo: 'dias_pago', min: 30, max: 60, promedio: 45, unidad: 'dias' },
  { metrica: 'Rentabilidad Activos (ROA)', codigo: 'roa', min: 5, max: 12, promedio: 8, unidad: '%' },
]

/**
 * Evalua un valor contra el benchmark de la industria.
 * Para metricas inversas (dias cobro, planilla/ventas, costo alimentos),
 * menor es mejor.
 */
export function evaluarContraBenchmark(
  valor: number,
  benchmark: IndustryBenchmark
): 'superior' | 'dentro' | 'inferior' {
  const inversas = ['dias_cobro', 'dias_pago', 'planilla_ventas', 'costo_alimentos']
  const esInversa = inversas.includes(benchmark.codigo)

  if (esInversa) {
    if (valor < benchmark.min) return 'superior'
    if (valor > benchmark.max) return 'inferior'
    return 'dentro'
  }

  if (valor > benchmark.max) return 'superior'
  if (valor < benchmark.min) return 'inferior'
  return 'dentro'
}

export function getBenchmarkColor(evaluacion: 'superior' | 'dentro' | 'inferior'): string {
  switch (evaluacion) {
    case 'superior':
      return 'text-emerald-400'
    case 'dentro':
      return 'text-amber-400'
    case 'inferior':
      return 'text-red-400'
  }
}

export function getBenchmarkBgColor(evaluacion: 'superior' | 'dentro' | 'inferior'): string {
  switch (evaluacion) {
    case 'superior':
      return 'bg-emerald-500/15'
    case 'dentro':
      return 'bg-amber-500/15'
    case 'inferior':
      return 'bg-red-500/15'
  }
}
