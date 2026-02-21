'use client'

import { useState, useRef, useEffect } from 'react'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { Bot, Send, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const quickPrompts = [
  'Analiza mis ventas del mes',
  'Resume mi situacion financiera',
  'Que impuestos debo pagar este mes?',
  'Como puedo mejorar mi flujo de caja?',
]

export default function KronosAIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        'Hola, soy KRONOS AI, tu asistente financiero inteligente. Puedo ayudarte a analizar tus datos financieros, resolver dudas tributarias y darte recomendaciones para tu negocio. ¿En que puedo ayudarte?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'No pude procesar tu consulta. Intenta de nuevo.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Error de conexion. Verifica tu conexion e intenta de nuevo.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <BreadcrumbNav />
        <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <Bot className="h-7 w-7 text-emerald-400" />
          KRONOS AI
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Asistente financiero inteligente para tu negocio
        </p>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-zinc-800 bg-[#111827] p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                msg.role === 'assistant' ? 'bg-emerald-500/20' : 'bg-zinc-700'
              }`}
            >
              {msg.role === 'assistant' ? (
                <Bot className="h-4 w-4 text-emerald-400" />
              ) : (
                <User className="h-4 w-4 text-zinc-300" />
              )}
            </div>
            <div
              className={`max-w-[75%] rounded-xl px-4 py-3 ${
                msg.role === 'assistant'
                  ? 'bg-zinc-800/50 text-zinc-200'
                  : 'bg-emerald-500/10 text-zinc-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="mt-1 text-xs text-zinc-600">
                {msg.timestamp.toLocaleTimeString('es-PE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
              <Bot className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-zinc-500"
                  style={{ animationDelay: '0.1s' }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-zinc-500"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-emerald-500/30 hover:text-emerald-400"
            >
              <Sparkles className="h-3 w-3" />
              {prompt}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="mt-3 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu consulta financiera..."
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-500/50"
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-emerald-600 px-4 hover:bg-emerald-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
