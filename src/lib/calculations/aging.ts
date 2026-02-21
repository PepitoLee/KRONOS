/**
 * Aging calculation module for Accounts Receivable (CxC) and Accounts Payable (CxP).
 *
 * Computes days overdue and classifies documents into standard aging ranges
 * used in Peruvian financial reporting.
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface DocumentoAging {
  id: string;
  tipo: string;
  serie: string;
  numero: string;
  nombre_tercero: string;
  ruc_dni_tercero: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  total: number;
  moneda: string;
  tipo_operacion: 'compra' | 'venta';
  dias_vencido: number;
  rango: '0-30' | '31-60' | '61-90' | '90+';
}

export interface AgingSummary {
  rango_0_30: number;
  rango_31_60: number;
  rango_61_90: number;
  rango_90_plus: number;
  total: number;
  cantidad_documentos: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000;
const DEFAULT_DAYS_TO_DUE = 30;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDate(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Fecha invalida: "${value}"`);
  }
  return parsed;
}

function assignRango(dias: number): DocumentoAging['rango'] {
  if (dias <= 30) return '0-30';
  if (dias <= 60) return '31-60';
  if (dias <= 90) return '61-90';
  return '90+';
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

function diffDays(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Calculate aging metrics for a list of documents.
 *
 * For each document the function:
 *  1. Derives the effective due date. When `fecha_vencimiento` is absent the
 *     due date defaults to `fecha_emision + 30 days`.
 *  2. Computes `dias_vencido` as the number of calendar days between the due
 *     date and the cut-off date (`fechaCorte`, defaults to today). A negative
 *     value is clamped to 0 (not yet overdue).
 *  3. Assigns the corresponding aging `rango`.
 *
 * The returned array is sorted by `dias_vencido` descending (most overdue
 * first).
 */
export function calcularAging(
  documentos: DocumentoAging[],
  fechaCorte?: Date,
): DocumentoAging[] {
  const corte = fechaCorte ?? new Date();

  const result = documentos.map((doc) => {
    const emision = parseDate(doc.fecha_emision);

    const vencimiento = doc.fecha_vencimiento
      ? parseDate(doc.fecha_vencimiento)
      : addDays(emision, DEFAULT_DAYS_TO_DUE);

    const diasVencido = Math.max(0, diffDays(vencimiento, corte));
    const rango = assignRango(diasVencido);

    return { ...doc, dias_vencido: diasVencido, rango };
  });

  result.sort((a, b) => b.dias_vencido - a.dias_vencido);

  return result;
}

/**
 * Aggregate document totals into an `AgingSummary` grouped by aging range.
 *
 * Documents are expected to have their `rango` and `total` fields already
 * populated (e.g. by calling `calcularAging` first).
 */
export function calcularAgingSummary(documentos: DocumentoAging[]): AgingSummary {
  const summary: AgingSummary = {
    rango_0_30: 0,
    rango_31_60: 0,
    rango_61_90: 0,
    rango_90_plus: 0,
    total: 0,
    cantidad_documentos: documentos.length,
  };

  for (const doc of documentos) {
    const monto = doc.total;

    switch (doc.rango) {
      case '0-30':
        summary.rango_0_30 += monto;
        break;
      case '31-60':
        summary.rango_31_60 += monto;
        break;
      case '61-90':
        summary.rango_61_90 += monto;
        break;
      case '90+':
        summary.rango_90_plus += monto;
        break;
    }

    summary.total += monto;
  }

  return summary;
}

/**
 * Transform CxC and CxP aging summaries into a dataset ready for a Recharts
 * `<BarChart>` component.
 *
 * Returns one entry per aging range with the corresponding CxC and CxP
 * totals so both series can be rendered side by side.
 */
export function getAgingChartData(
  cxc: AgingSummary,
  cxp: AgingSummary,
): { rango: string; cxc: number; cxp: number }[] {
  return [
    { rango: '0-30', cxc: cxc.rango_0_30, cxp: cxp.rango_0_30 },
    { rango: '31-60', cxc: cxc.rango_31_60, cxp: cxp.rango_31_60 },
    { rango: '61-90', cxc: cxc.rango_61_90, cxp: cxp.rango_61_90 },
    { rango: '90+', cxc: cxc.rango_90_plus, cxp: cxp.rango_90_plus },
  ];
}
