export function linearRegression(data: number[]): {
  slope: number
  intercept: number
  predict: (x: number) => number
} {
  const n = data.length
  if (n < 2) return { slope: 0, intercept: data[0] ?? 0, predict: () => data[0] ?? 0 }

  const xMean = (n - 1) / 2
  const yMean = data.reduce((s, v) => s + v, 0) / n

  let numerator = 0
  let denominator = 0
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (data[i] - yMean)
    denominator += (i - xMean) ** 2
  }

  const slope = denominator !== 0 ? numerator / denominator : 0
  const intercept = yMean - slope * xMean

  return {
    slope,
    intercept,
    predict: (x: number) => slope * x + intercept,
  }
}

export function movingAverage(data: number[], window: number): number[] {
  if (window <= 0 || data.length === 0) return []
  const result: number[] = []

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1)
    const slice = data.slice(start, i + 1)
    result.push(slice.reduce((s, v) => s + v, 0) / slice.length)
  }

  return result
}

export function predictCashFlow(
  historicalMonths: { ingresos: number; egresos: number }[],
  monthsAhead: number
): { ingresos: number; egresos: number; saldo: number }[] {
  const ingresos = historicalMonths.map((m) => m.ingresos)
  const egresos = historicalMonths.map((m) => m.egresos)

  const ingresosReg = linearRegression(ingresos)
  const egresosReg = linearRegression(egresos)

  const n = historicalMonths.length
  const predictions: { ingresos: number; egresos: number; saldo: number }[] = []

  for (let i = 0; i < monthsAhead; i++) {
    const predIngresos = Math.max(0, ingresosReg.predict(n + i))
    const predEgresos = Math.max(0, egresosReg.predict(n + i))
    predictions.push({
      ingresos: Math.round(predIngresos * 100) / 100,
      egresos: Math.round(predEgresos * 100) / 100,
      saldo: Math.round((predIngresos - predEgresos) * 100) / 100,
    })
  }

  return predictions
}
