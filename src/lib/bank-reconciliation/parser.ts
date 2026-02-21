export interface MovimientoBancario {
  fecha: string
  descripcion: string
  referencia: string
  monto: number
  tipo: 'cargo' | 'abono'
  saldo?: number
}

function cleanField(value: string): string {
  return value.replace(/^["']|["']$/g, '').trim()
}

function parseDate(raw: string): string {
  const cleaned = raw.trim()

  // DD/MM/YYYY
  const dmy = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (dmy) {
    const day = dmy[1].padStart(2, '0')
    const month = dmy[2].padStart(2, '0')
    return `${dmy[3]}-${month}-${day}`
  }

  // YYYY-MM-DD
  const ymd = cleaned.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/)
  if (ymd) {
    const month = ymd[2].padStart(2, '0')
    const day = ymd[3].padStart(2, '0')
    return `${ymd[1]}-${month}-${day}`
  }

  return cleaned
}

function parseAmount(raw: string): number {
  const cleaned = raw
    .replace(/['"$S\/\s]/g, '')
    .replace(/,(\d{2})$/, '.$1')
    .replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function splitCSVLine(line: string, separator: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === separator && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

function detectSeparator(header: string): string {
  const semicolonCount = (header.match(/;/g) ?? []).length
  const commaCount = (header.match(/,/g) ?? []).length
  const tabCount = (header.match(/\t/g) ?? []).length

  if (tabCount >= semicolonCount && tabCount >= commaCount) return '\t'
  if (semicolonCount >= commaCount) return ';'
  return ','
}

function getLines(csv: string): string[] {
  return csv
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
}

/**
 * Banco de Credito del Peru (BCP)
 * Formato tipico: Fecha;Descripcion;Referencia;Cargo;Abono;Saldo
 */
export function parseBCPStatement(csv: string): MovimientoBancario[] {
  const lines = getLines(csv)
  if (lines.length < 2) return []

  const separator = detectSeparator(lines[0])
  const results: MovimientoBancario[] = []

  for (let i = 1; i < lines.length; i++) {
    const fields = splitCSVLine(lines[i], separator).map(cleanField)
    if (fields.length < 5) continue

    const fecha = parseDate(fields[0])
    const descripcion = fields[1]
    const referencia = fields[2]
    const cargo = parseAmount(fields[3])
    const abono = parseAmount(fields[4])
    const saldo = fields.length > 5 ? parseAmount(fields[5]) : undefined

    if (cargo > 0) {
      results.push({ fecha, descripcion, referencia, monto: cargo, tipo: 'cargo', saldo })
    }
    if (abono > 0) {
      results.push({ fecha, descripcion, referencia, monto: abono, tipo: 'abono', saldo })
    }
  }

  return results
}

/**
 * Interbank
 * Formato tipico: Fecha;Operacion;Descripcion;Monto;Saldo
 * Monto negativo = cargo, positivo = abono
 */
export function parseInterbankStatement(csv: string): MovimientoBancario[] {
  const lines = getLines(csv)
  if (lines.length < 2) return []

  const separator = detectSeparator(lines[0])
  const results: MovimientoBancario[] = []

  for (let i = 1; i < lines.length; i++) {
    const fields = splitCSVLine(lines[i], separator).map(cleanField)
    if (fields.length < 4) continue

    const fecha = parseDate(fields[0])
    const referencia = fields[1]
    const descripcion = fields[2]
    const monto = parseAmount(fields[3])
    const saldo = fields.length > 4 ? parseAmount(fields[4]) : undefined

    if (monto === 0) continue

    results.push({
      fecha,
      descripcion,
      referencia,
      monto: Math.abs(monto),
      tipo: monto < 0 ? 'cargo' : 'abono',
      saldo,
    })
  }

  return results
}

/**
 * BBVA Continental
 * Formato tipico: Fecha;Hora;Descripcion;Referencia;Cargo;Abono;Saldo
 */
export function parseBBVAStatement(csv: string): MovimientoBancario[] {
  const lines = getLines(csv)
  if (lines.length < 2) return []

  const separator = detectSeparator(lines[0])
  const results: MovimientoBancario[] = []

  for (let i = 1; i < lines.length; i++) {
    const fields = splitCSVLine(lines[i], separator).map(cleanField)
    if (fields.length < 6) continue

    const fecha = parseDate(fields[0])
    const descripcion = fields[2]
    const referencia = fields[3]
    const cargo = parseAmount(fields[4])
    const abono = parseAmount(fields[5])
    const saldo = fields.length > 6 ? parseAmount(fields[6]) : undefined

    if (cargo > 0) {
      results.push({ fecha, descripcion, referencia, monto: cargo, tipo: 'cargo', saldo })
    }
    if (abono > 0) {
      results.push({ fecha, descripcion, referencia, monto: abono, tipo: 'abono', saldo })
    }
  }

  return results
}

/**
 * Parser generico que intenta detectar el formato automaticamente.
 * Busca columnas con nombres comunes y mapea apropiadamente.
 */
export function parseGenericStatement(csv: string): MovimientoBancario[] {
  const lines = getLines(csv)
  if (lines.length < 2) return []

  const separator = detectSeparator(lines[0])
  const headers = splitCSVLine(lines[0], separator).map(h => cleanField(h).toLowerCase())

  const dateIdx = headers.findIndex(h =>
    /fecha|date|f\.\s*oper/i.test(h)
  )
  const descIdx = headers.findIndex(h =>
    /descripcion|concepto|detalle|description|glosa/i.test(h)
  )
  const refIdx = headers.findIndex(h =>
    /referencia|ref|operacion|numero|nro/i.test(h)
  )
  const cargoIdx = headers.findIndex(h =>
    /cargo|debito|debit|retiro|salida/i.test(h)
  )
  const abonoIdx = headers.findIndex(h =>
    /abono|credito|credit|deposito|entrada/i.test(h)
  )
  const montoIdx = headers.findIndex(h =>
    /monto|importe|amount|valor/i.test(h)
  )
  const saldoIdx = headers.findIndex(h =>
    /saldo|balance/i.test(h)
  )

  const hasSeparateColumns = cargoIdx !== -1 && abonoIdx !== -1
  const hasSingleAmount = montoIdx !== -1

  if (dateIdx === -1) return []

  const results: MovimientoBancario[] = []

  for (let i = 1; i < lines.length; i++) {
    const fields = splitCSVLine(lines[i], separator).map(cleanField)
    if (fields.length < 3) continue

    const fecha = parseDate(fields[dateIdx] ?? '')
    const descripcion = descIdx !== -1 ? fields[descIdx] : ''
    const referencia = refIdx !== -1 ? fields[refIdx] : ''
    const saldo = saldoIdx !== -1 ? parseAmount(fields[saldoIdx]) : undefined

    if (hasSeparateColumns) {
      const cargo = parseAmount(fields[cargoIdx])
      const abono = parseAmount(fields[abonoIdx])

      if (cargo > 0) {
        results.push({ fecha, descripcion, referencia, monto: cargo, tipo: 'cargo', saldo })
      }
      if (abono > 0) {
        results.push({ fecha, descripcion, referencia, monto: abono, tipo: 'abono', saldo })
      }
    } else if (hasSingleAmount) {
      const monto = parseAmount(fields[montoIdx])
      if (monto === 0) continue

      results.push({
        fecha,
        descripcion,
        referencia,
        monto: Math.abs(monto),
        tipo: monto < 0 ? 'cargo' : 'abono',
        saldo,
      })
    }
  }

  return results
}
