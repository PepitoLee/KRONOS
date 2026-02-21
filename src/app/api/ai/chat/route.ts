import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'El campo "message" es requerido y debe ser texto.' },
        { status: 400 }
      )
    }

    if (message.trim().length === 0) {
      return NextResponse.json(
        { error: 'El mensaje no puede estar vacio.' },
        { status: 400 }
      )
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: 'El mensaje excede el limite de 4000 caracteres.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      response: `KRONOS AI esta en desarrollo. Tu consulta: "${message}". Pronto podre analizar tus datos financieros con inteligencia artificial.`,
      status: 'preview',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor. Intente nuevamente.' },
      { status: 500 }
    )
  }
}
