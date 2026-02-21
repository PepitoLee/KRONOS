const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]

export function validateRUC(ruc: string): boolean {
  if (!ruc || ruc.length !== 11 || !/^\d{11}$/.test(ruc)) return false

  const prefix = ruc.substring(0, 2)
  if (!['10', '15', '17', '20'].includes(prefix)) return false

  const digits = ruc.split('').map(Number)
  const sum = WEIGHTS.reduce((acc, w, i) => acc + w * digits[i], 0)
  const remainder = 11 - (sum % 11)
  const checkDigit = remainder === 10 ? 0 : remainder === 11 ? 1 : remainder

  return checkDigit === digits[10]
}

export function getRUCType(ruc: string): 'persona_natural' | 'persona_juridica' | 'invalido' {
  if (!validateRUC(ruc)) return 'invalido'
  const prefix = ruc.substring(0, 2)
  if (prefix === '10' || prefix === '15') return 'persona_natural'
  return 'persona_juridica'
}
