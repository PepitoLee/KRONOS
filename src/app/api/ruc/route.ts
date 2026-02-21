import { NextResponse } from 'next/server'
import { validateRUC, getRUCType } from '@/lib/utils/ruc-validation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ruc = searchParams.get('ruc')

  if (!ruc || ruc.length !== 11) {
    return NextResponse.json({ error: 'RUC debe tener 11 digitos' }, { status: 400 })
  }

  if (!validateRUC(ruc)) {
    return NextResponse.json({ error: 'RUC invalido (checksum incorrecto)' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.apis.net.pe/v2/sunat/ruc?numero=${ruc}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      }
    ).catch(() => null)

    if (response?.ok) {
      const data = await response.json()
      return NextResponse.json({
        ruc: data.numeroDocumento || ruc,
        razonSocial: data.razonSocial || '',
        estado: data.estado || 'ACTIVO',
        direccion: data.direccion || '',
        tipo: getRUCType(ruc),
      })
    }

    return NextResponse.json({
      ruc,
      razonSocial: '',
      estado: 'NO_VERIFICADO',
      direccion: '',
      tipo: getRUCType(ruc),
    })
  } catch {
    return NextResponse.json({
      ruc,
      razonSocial: '',
      estado: 'NO_VERIFICADO',
      direccion: '',
      tipo: getRUCType(ruc),
    })
  }
}
