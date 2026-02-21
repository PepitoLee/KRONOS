import { FinancialContext } from './context-builder'

export const SYSTEM_PROMPT = `Eres KRONOS AI, el asistente financiero inteligente del sistema ERP KRONOS.
Tu especialidad es contabilidad, finanzas, tributacion y gestion empresarial peruana.

Reglas:
- Responde siempre en espanol.
- Basa tus respuestas en los datos financieros reales de la empresa cuando esten disponibles.
- Cita normativa SUNAT, PCGE y NIIFs cuando sea relevante.
- Si no tienes datos suficientes para una recomendacion, indicalo claramente.
- Formatea montos en Soles (S/) con 2 decimales.
- Usa un tono profesional pero accesible.
- Nunca inventes datos financieros. Si no tienes el dato, dilo.
- Cuando des consejos tributarios, aclara que es orientacion general y no reemplaza a un contador certificado.`

function formatContextBlock(context: FinancialContext): string {
  return `--- DATOS FINANCIEROS DE LA EMPRESA ---
Empresa: ${context.empresa.razon_social} (RUC: ${context.empresa.ruc})
Periodo: ${context.periodo}
Ventas del mes: S/ ${context.ventas_mes.toFixed(2)}
Compras del mes: S/ ${context.compras_mes.toFixed(2)}
Utilidad bruta: S/ ${context.utilidad_bruta.toFixed(2)}
Saldo bancario total: S/ ${context.saldo_bancario.toFixed(2)}
Empleados activos: ${context.empleados_activos}
Cuentas por cobrar (pendientes): S/ ${context.cxc_total.toFixed(2)}
Cuentas por pagar (pendientes): S/ ${context.cxp_total.toFixed(2)}
--- FIN DE DATOS ---`
}

export function buildAnalysisPrompt(context: FinancialContext, userQuery: string): string {
  return `${SYSTEM_PROMPT}

${formatContextBlock(context)}

El usuario solicita un analisis financiero. Responde de forma estructurada con:
1. Resumen de la situacion actual basado en los datos
2. Analisis especifico de lo que el usuario pregunta
3. Indicadores clave relevantes (ratios, tendencias)
4. Recomendaciones concretas y accionables

Consulta del usuario: ${userQuery}`
}

export function buildRecommendationPrompt(context: FinancialContext): string {
  const margenBruto = context.ventas_mes > 0
    ? ((context.utilidad_bruta / context.ventas_mes) * 100).toFixed(1)
    : '0.0'

  const ratioLiquidez = context.cxp_total > 0
    ? (context.saldo_bancario / context.cxp_total).toFixed(2)
    : 'N/A'

  const diasCxC = context.ventas_mes > 0
    ? Math.round((context.cxc_total / context.ventas_mes) * 30)
    : 0

  const diasCxP = context.compras_mes > 0
    ? Math.round((context.cxp_total / context.compras_mes) * 30)
    : 0

  return `${SYSTEM_PROMPT}

${formatContextBlock(context)}

Indicadores calculados:
- Margen bruto: ${margenBruto}%
- Ratio de liquidez inmediata: ${ratioLiquidez}
- Dias promedio de cobro: ${diasCxC} dias
- Dias promedio de pago: ${diasCxP} dias

Genera un reporte de recomendaciones financieras que incluya:

1. SALUD FINANCIERA GENERAL
   - Evaluacion del margen bruto y tendencia
   - Estado de liquidez y capacidad de pago

2. GESTION DE FLUJO DE CAJA
   - Analisis del ciclo de conversion de efectivo
   - Recomendaciones para optimizar cobros y pagos
   - Alertas si los dias de cobro superan a los dias de pago

3. OPORTUNIDADES DE MEJORA
   - Areas donde se puede reducir costos
   - Estrategias para mejorar la rentabilidad
   - Acciones inmediatas recomendadas

4. ALERTAS Y RIESGOS
   - Senales de alerta basadas en los ratios
   - Riesgos identificados en la operacion actual
   - Medidas preventivas sugeridas

Prioriza las recomendaciones por impacto y urgencia.`
}

export function buildTaxAdvicePrompt(context: FinancialContext, periodo: string): string {
  const igvVentas = context.ventas_mes * 0.18
  const igvCompras = context.compras_mes * 0.18
  const igvPorPagar = igvVentas - igvCompras
  const rentaMensual = context.ventas_mes > 0 ? context.ventas_mes * 0.015 : 0

  return `${SYSTEM_PROMPT}

${formatContextBlock(context)}

Periodo tributario consultado: ${periodo}

Estimaciones tributarias (aproximadas):
- IGV Ventas (debito fiscal): S/ ${igvVentas.toFixed(2)}
- IGV Compras (credito fiscal): S/ ${igvCompras.toFixed(2)}
- IGV por pagar estimado: S/ ${igvPorPagar.toFixed(2)}
- Pago a cuenta Renta (1.5%): S/ ${rentaMensual.toFixed(2)}
- Total estimado de obligaciones tributarias: S/ ${(igvPorPagar + rentaMensual).toFixed(2)}

Proporciona asesoria tributaria que incluya:

1. RESUMEN DE OBLIGACIONES DEL PERIODO
   - IGV: debito fiscal, credito fiscal, saldo a pagar o a favor
   - Renta mensual: pago a cuenta aplicable
   - Otras obligaciones (PLAME, AFP, ONP si tiene empleados)

2. CALENDARIO TRIBUTARIO
   - Fechas de vencimiento segun el ultimo digito del RUC
   - Proximas declaraciones pendientes
   - Libros electronicos PLE a presentar

3. OPTIMIZACION TRIBUTARIA LEGAL
   - Uso correcto del credito fiscal
   - Gastos deducibles que podria estar omitiendo
   - Regimenes tributarios alternativos si aplica

4. ALERTAS TRIBUTARIAS
   - Riesgos de contingencias con SUNAT
   - Inconsistencias detectadas en los datos
   - Recomendaciones para evitar multas

NOTA: Esta es orientacion general. Consulte con su contador certificado para decisiones tributarias especificas.`
}
