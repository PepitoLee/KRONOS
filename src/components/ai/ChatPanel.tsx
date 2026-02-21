'use client'

import { useRef, useEffect } from 'react'
import { Bot, User, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatPanelProps {
  messages: Message[]
  onSend: (msg: string) => void
  loading: boolean
  placeholder?: string
}

export function ChatPanel({ messages, onSend, loading, placeholder }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = inputRef.current?.value.trim()
    if (value) {
      onSend(value)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
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
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: '0.1s' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-zinc-800 p-3">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder || 'Escribe un mensaje...'}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-500/50"
          disabled={loading}
        />
        <Button type="submit" size="sm" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
