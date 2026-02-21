import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0]

  try {
    // Intentar obtener tipo de cambio de SBS/SUNAT
    const [year, month, day] = fecha.split('-')
    const sbs_url = `https://www.sbs.gob.pe/app/pp/SISTIP_PORTAL/Paginas/Publicacion/TipoCambioPromedio.aspx`

    // Fallback: usar un valor aproximado basado en fecha
    // En produccion, conectar con API real de SBS
    const response = await fetch(
      `https://api.apis.net.pe/v2/sunat/tipo-cambio?fecha=${fecha}`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      }
    ).catch(() => null)

    if (response?.ok) {
      const data = await response.json()
      return NextResponse.json({
        fecha: data.fecha || fecha,
        compra: Number(data.compra) || 3.70,
        venta: Number(data.venta) || 3.75,
        fuente: 'SUNAT',
      })
    }

    // Fallback con valor por defecto
    return NextResponse.json({
      fecha,
      compra: 3.70,
      venta: 3.75,
      fuente: 'estimado',
    })
  } catch {
    return NextResponse.json({
      fecha,
      compra: 3.70,
      venta: 3.75,
      fuente: 'estimado',
    })
  }
}
