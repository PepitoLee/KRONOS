import { MovimientoBancario } from './parser'

export interface ReconciliationMatch {
  movimiento: MovimientoBancario
  documento_id: string
  confianza: number
}

export interface ReconciliationResult {
  conciliados: ReconciliationMatch[]
  pendientes_banco: MovimientoBancario[]
  pendientes_sistema: { id: string; total: number; fecha: string }[]
}

interface DocumentoSistema {
  id: string
  total: number
  fecha_emision: string
  nombre_tercero: string
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA)
  const b = new Date(dateB)
  const diffMs = Math.abs(a.getTime() - b.getTime())
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function amountMatchScore(montoMovimiento: number, totalDocumento: number): number {
  if (montoMovimiento === totalDocumento) return 1.0

  const tolerance = 0.01
  if (Math.abs(montoMovimiento - totalDocumento) <= tolerance) return 0.98

  const percentDiff = Math.abs(montoMovimiento - totalDocumento) / Math.max(totalDocumento, 0.01)
  if (percentDiff <= 0.001) return 0.95

  return 0
}

function dateProximityScore(fechaMovimiento: string, fechaDocumento: string): number {
  const days = daysBetween(fechaMovimiento, fechaDocumento)

  if (days === 0) return 1.0
  if (days === 1) return 0.9
  if (days === 2) return 0.75
  if (days === 3) return 0.6

  return 0
}

function descriptionMatchScore(descripcionMovimiento: string, nombreTercero: string): number {
  if (!descripcionMovimiento || !nombreTercero) return 0

  const descNorm = normalizeText(descripcionMovimiento)
  const nameNorm = normalizeText(nombreTercero)

  if (descNorm.includes(nameNorm) || nameNorm.includes(descNorm)) return 0.8

  const nameWords = nameNorm.split(' ').filter(w => w.length > 2)
  if (nameWords.length === 0) return 0

  const matchedWords = nameWords.filter(word => descNorm.includes(word))
  const wordMatchRatio = matchedWords.length / nameWords.length

  if (wordMatchRatio >= 0.6) return 0.6
  if (wordMatchRatio >= 0.3) return 0.3

  return 0
}

function computeConfidence(
  amountScore: number,
  dateScore: number,
  descScore: number
): number {
  if (amountScore === 0) return 0

  const weighted = (amountScore * 0.50) + (dateScore * 0.30) + (descScore * 0.20)
  return Math.round(weighted * 100) / 100
}

export function reconcileTransactions(
  movimientos: MovimientoBancario[],
  documentos: DocumentoSistema[]
): ReconciliationResult {
  const conciliados: ReconciliationMatch[] = []
  const matchedMovimientos = new Set<number>()
  const matchedDocumentos = new Set<string>()

  const candidates: {
    movIdx: number
    docId: string
    confianza: number
    movimiento: MovimientoBancario
  }[] = []

  for (let mIdx = 0; mIdx < movimientos.length; mIdx++) {
    const mov = movimientos[mIdx]

    for (const doc of documentos) {
      const amountScore = amountMatchScore(mov.monto, doc.total)
      if (amountScore === 0) continue

      const dateScore = dateProximityScore(mov.fecha, doc.fecha_emision)
      const descScore = descriptionMatchScore(mov.descripcion, doc.nombre_tercero)

      const confianza = computeConfidence(amountScore, dateScore, descScore)

      if (confianza >= 0.4) {
        candidates.push({
          movIdx: mIdx,
          docId: doc.id,
          confianza,
          movimiento: mov,
        })
      }
    }
  }

  candidates.sort((a, b) => b.confianza - a.confianza)

  for (const candidate of candidates) {
    if (matchedMovimientos.has(candidate.movIdx)) continue
    if (matchedDocumentos.has(candidate.docId)) continue

    conciliados.push({
      movimiento: candidate.movimiento,
      documento_id: candidate.docId,
      confianza: candidate.confianza,
    })

    matchedMovimientos.add(candidate.movIdx)
    matchedDocumentos.add(candidate.docId)
  }

  const pendientes_banco = movimientos.filter(
    (_, idx) => !matchedMovimientos.has(idx)
  )

  const pendientes_sistema = documentos
    .filter(doc => !matchedDocumentos.has(doc.id))
    .map(doc => ({
      id: doc.id,
      total: doc.total,
      fecha: doc.fecha_emision,
    }))

  return {
    conciliados,
    pendientes_banco,
    pendientes_sistema,
  }
}
