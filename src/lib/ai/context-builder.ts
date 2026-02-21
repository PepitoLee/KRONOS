import { SupabaseClient } from '@supabase/supabase-js'

export interface FinancialContext {
  empresa: { ruc: string; razon_social: string }
  periodo: string
  ventas_mes: number
  compras_mes: number
  utilidad_bruta: number
  saldo_bancario: number
  empleados_activos: number
  cxc_total: number
  cxp_total: number
}

function getCurrentPeriod(): { year: number; month: number; label: string; startDate: string; endDate: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const lastDay = new Date(year, month, 0).getDate()
  return {
    year,
    month,
    label: `${year}-${String(month).padStart(2, '0')}`,
    startDate: `${year}-${String(month).padStart(2, '0')}-01`,
    endDate: `${year}-${String(month).padStart(2, '0')}-${lastDay}`,
  }
}

export async function buildFinancialContext(supabase: SupabaseClient): Promise<FinancialContext> {
  const periodo = getCurrentPeriod()

  const [
    empresaResult,
    ventasResult,
    comprasResult,
    bancosResult,
    empleadosResult,
    cxcResult,
    cxpResult,
  ] = await Promise.all([
    supabase
      .from('empresas')
      .select('ruc, razon_social')
      .limit(1)
      .single(),

    supabase
      .from('documentos')
      .select('total')
      .in('tipo_documento', ['01', '03'])
      .gte('fecha_emision', periodo.startDate)
      .lte('fecha_emision', periodo.endDate)
      .eq('tipo_operacion', 'venta'),

    supabase
      .from('documentos')
      .select('total')
      .in('tipo_documento', ['01', '03'])
      .gte('fecha_emision', periodo.startDate)
      .lte('fecha_emision', periodo.endDate)
      .eq('tipo_operacion', 'compra'),

    supabase
      .from('cuentas_bancarias')
      .select('saldo_actual'),

    supabase
      .from('empleados')
      .select('id')
      .eq('estado', 'activo'),

    supabase
      .from('documentos')
      .select('total')
      .eq('tipo_operacion', 'venta')
      .eq('estado_pago', 'pendiente'),

    supabase
      .from('documentos')
      .select('total')
      .eq('tipo_operacion', 'compra')
      .eq('estado_pago', 'pendiente'),
  ])

  const empresa = empresaResult.data ?? { ruc: '', razon_social: '' }

  const ventasMes = (ventasResult.data ?? []).reduce(
    (sum: number, doc: { total: number }) => sum + (doc.total ?? 0),
    0
  )

  const comprasMes = (comprasResult.data ?? []).reduce(
    (sum: number, doc: { total: number }) => sum + (doc.total ?? 0),
    0
  )

  const saldoBancario = (bancosResult.data ?? []).reduce(
    (sum: number, cuenta: { saldo_actual: number }) => sum + (cuenta.saldo_actual ?? 0),
    0
  )

  const empleadosActivos = empleadosResult.data?.length ?? 0

  const cxcTotal = (cxcResult.data ?? []).reduce(
    (sum: number, doc: { total: number }) => sum + (doc.total ?? 0),
    0
  )

  const cxpTotal = (cxpResult.data ?? []).reduce(
    (sum: number, doc: { total: number }) => sum + (doc.total ?? 0),
    0
  )

  return {
    empresa: {
      ruc: empresa.ruc,
      razon_social: empresa.razon_social,
    },
    periodo: periodo.label,
    ventas_mes: ventasMes,
    compras_mes: comprasMes,
    utilidad_bruta: ventasMes - comprasMes,
    saldo_bancario: saldoBancario,
    empleados_activos: empleadosActivos,
    cxc_total: cxcTotal,
    cxp_total: cxpTotal,
  }
}
