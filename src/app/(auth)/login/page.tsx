'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

/* ═══════════════════════════════════════════════════════════════
   STAR & METEOR CANVAS — Pure white stars + meteor shower
   ═══════════════════════════════════════════════════════════════ */
function SpaceCanvas({ panelRef }: { panelRef: React.RefObject<HTMLDivElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    // Track mouse for parallax
    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMouse, { passive: true })

    // Stars
    interface Star {
      x: number; y: number; z: number; radius: number; opacity: number; fadeSpeed: number
    }
    const stars: Star[] = []
    for (let i = 0; i < 350; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 2 + 0.1,
        radius: Math.random() * 1.2 + 0.3,
        opacity: Math.random() * 0.6 + 0.2,
        fadeSpeed: Math.random() * 0.015 - 0.0075,
      })
    }

    // Meteors
    interface Meteor {
      active: boolean; x: number; y: number; length: number; speed: number; angle: number; opacity: number
    }
    const meteors: Meteor[] = Array.from({ length: 4 }, () => ({
      active: false, x: 0, y: 0, length: 0, speed: 0, angle: 0, opacity: 0,
    }))

    function spawnMeteor(m: Meteor) {
      m.x = Math.random() * width * 1.5
      m.y = Math.random() * height * 0.5 - 200
      m.length = Math.random() * 100 + 50
      m.speed = Math.random() * 20 + 15
      m.angle = Math.PI / 4 + (Math.random() * 0.1 - 0.05)
      m.opacity = 1
      m.active = true
    }

    let animId: number
    function animate() {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      // Update & draw stars
      for (const s of stars) {
        s.opacity += s.fadeSpeed
        if (s.opacity <= 0.05 || s.opacity >= 0.9) s.fadeSpeed *= -1
        const ox = (mx - width / 2) * 0.0003 * s.z
        const oy = (my - height / 2) * 0.0003 * s.z
        s.x -= 0.1 * s.z + ox
        s.y -= oy
        if (s.x < 0) s.x = width
        if (s.x > width) s.x = 0
        if (s.y < 0) s.y = height
        if (s.y > height) s.y = 0

        ctx.beginPath()
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${s.opacity})`
        ctx.fill()
      }

      // Spawn meteors rarely
      if (Math.random() < 0.01) {
        const inactive = meteors.find(m => !m.active)
        if (inactive) spawnMeteor(inactive)
      }

      let isRefracting = false
      const panelEl = panelRef.current

      for (const m of meteors) {
        if (!m.active) continue
        m.x -= Math.cos(m.angle) * m.speed
        m.y += Math.sin(m.angle) * m.speed
        m.opacity -= 0.012
        if (m.opacity <= 0 || m.x < -100 || m.y > height + 100) {
          m.active = false
          continue
        }

        // Draw meteor
        ctx.save()
        ctx.translate(m.x, m.y)
        ctx.rotate(m.angle)
        const grad = ctx.createLinearGradient(0, 0, -m.length, 0)
        grad.addColorStop(0, `rgba(255,255,255,${m.opacity})`)
        grad.addColorStop(0.2, `rgba(255,255,255,${m.opacity * 0.5})`)
        grad.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(-m.length, 0)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(0, 0, 1.2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${m.opacity})`
        ctx.shadowBlur = 8
        ctx.shadowColor = '#ffffff'
        ctx.fill()
        ctx.restore()

        // Check refraction against panel
        if (panelEl) {
          const rect = panelEl.getBoundingClientRect()
          if (m.x > rect.left - 80 && m.x < rect.right + 80 &&
            m.y > rect.top - 80 && m.y < rect.bottom + 80) {
            isRefracting = true
          }
        }
      }

      // Refraction effect on glass panel
      if (panelEl) {
        if (isRefracting) {
          panelEl.style.boxShadow = '0 30px 60px -10px rgba(0,0,0,1), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 60px rgba(0,255,213,0.2), inset 0 0 25px rgba(255,255,255,0.1)'
          panelEl.style.borderColor = 'rgba(0,255,213,0.4)'
        } else {
          panelEl.style.boxShadow = ''
          panelEl.style.borderColor = ''
        }
      }

      animId = requestAnimationFrame(animate)
    }

    animate()

    const onResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
    }
  }, [panelRef])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[1]"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}

/* ═══════════════════════════════════════════════════════════════
   SVG LOGO — Crown + Eye with mechanical shutters
   ═══════════════════════════════════════════════════════════════ */
interface LogoProps {
  irisOffset: { x: number; y: number }
  isTyping: boolean
  isPasswordFocused: boolean
  shutterState: 'open' | 'closed' | 'squint'
  pupilRadius: number
  booted: boolean
}

function KronosLogo({ irisOffset, isTyping, isPasswordFocused, shutterState, pupilRadius, booted }: LogoProps) {
  const shutterPaths = {
    top: {
      open: 'M 25 120 Q 100 65 175 120 Q 100 65 25 120 Z',
      closed: 'M 25 120 Q 100 65 175 120 Q 100 125 25 120 Z',
      squint: 'M 25 120 Q 100 65 175 120 Q 100 95 25 120 Z',
    },
    bottom: {
      open: 'M 25 120 Q 100 175 175 120 Q 100 175 25 120 Z',
      closed: 'M 25 120 Q 100 175 175 120 Q 100 115 25 120 Z',
      squint: 'M 25 120 Q 100 175 175 120 Q 100 145 25 120 Z',
    },
  }

  return (
    <div className="relative w-36 h-36 mb-6">
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3a3a3c" />
            <stop offset="50%" stopColor="#1c1c1e" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00ffd5" />
            <stop offset="100%" stopColor="#00aaff" />
          </linearGradient>
          <radialGradient id="lensInner" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0a1512" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
        </defs>

        {/* Base Shadow */}
        <ellipse cx="100" cy="160" rx="40" ry="5" fill="rgba(0,0,0,0.8)" style={{ filter: 'blur(5px)' }} />

        {/* Crown */}
        <g className={`kr-crown ${isTyping ? 'kr-typing-active' : ''}`}>
          <path
            d="M 50 70 L 65 30 L 85 55 L 100 15 L 115 55 L 135 30 L 150 70 Z"
            fill="url(#metalGradient)" stroke="url(#accentGradient)" strokeWidth="2"
            strokeLinejoin="round" className="kr-svg-glow kr-draw-path"
            style={{ opacity: booted ? 1 : 0, transition: 'opacity 1.5s ease 1s' }}
          />
          <path
            d="M 60 65 L 70 38 L 88 60 L 100 28 L 112 60 L 130 38 L 140 65 Z"
            fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"
            style={{ opacity: booted ? 1 : 0, transition: 'opacity 1.5s ease 1s' }}
          />
          <line
            x1="45" y1="75" x2="155" y2="75" stroke="url(#accentGradient)" strokeWidth="3"
            strokeLinecap="round" className="kr-svg-glow kr-draw-path"
            style={{ opacity: booted ? 1 : 0, transition: 'opacity 1.5s ease 1s' }}
          />
        </g>

        {/* Outer Eye Frame */}
        <g>
          <path
            d="M 15 120 Q 100 50 185 120 Q 100 190 15 120 Z"
            fill="url(#metalGradient)" stroke="rgba(255,255,255,0.15)" strokeWidth="2"
            className="kr-draw-path"
          />
          <path d="M 25 120 Q 100 65 175 120 Q 100 175 25 120 Z" fill="#000" stroke="rgba(0,0,0,0.8)" strokeWidth="3" />
          <path d="M 25 120 Q 100 65 175 120 Q 100 175 25 120 Z" fill="url(#lensInner)" />
        </g>

        {/* Iris / Pupil Group — moves to track */}
        <g style={{
          transform: `translate(${irisOffset.x}px, ${irisOffset.y}px)`,
          transition: 'transform 0.1s ease-out',
        }}>
          <circle cx="100" cy="120" r="28" fill="#111" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
          <circle
            cx="100" cy="120" r="22" fill="none" stroke="url(#accentGradient)" strokeWidth="3"
            className="kr-svg-glow kr-draw-path" opacity="0.9"
          />
          <circle cx="100" cy="120" r="18" fill="none" stroke="rgba(0,255,213,0.3)" strokeWidth="1" strokeDasharray="2 4" />
          <circle cx="100" cy="120" r="14" fill="#020504" />
          <circle
            cx="100" cy="120" r={pupilRadius} fill="#ffffff"
            className="kr-pupil-core"
            style={isPasswordFocused ? { filter: 'drop-shadow(0 0 15px #00ffd5) drop-shadow(0 0 8px #fff)' } : {}}
          />
          <path d="M 85 105 A 20 20 0 0 1 115 105 A 22 22 0 0 0 85 105" fill="rgba(255,255,255,0.3)" />
        </g>

        {/* Mechanical Shutters */}
        <g fill="#050510" stroke="rgba(0,255,213,0.4)" strokeWidth="1.5">
          <path className="kr-shutter-blade" d={shutterPaths.top[shutterState]} />
          <path className="kr-shutter-blade" d={shutterPaths.bottom[shutterState]} />
        </g>

        {/* Glass reflection over entire eye */}
        <path d="M 35 110 Q 100 70 165 110 A 100 40 0 0 0 35 110" fill="rgba(255,255,255,0.05)" />
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   WELCOME OVERLAY — Doors animation (preserved)
   ═══════════════════════════════════════════════════════════════ */
function WelcomeOverlay({ nombre, onDone }: { nombre: string; onDone: () => void }) {
  const [phase, setPhase] = useState<'closed' | 'opening' | 'revealing'>('closed')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('opening'), 100)
    const t2 = setTimeout(() => setPhase('revealing'), 1200)
    const t3 = setTimeout(() => onDone(), 3400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ perspective: '1200px' }}>
      <div className="absolute inset-0 bg-black" />

      <div className={`relative z-10 flex flex-col items-center gap-6 transition-all duration-1000 ${
        phase === 'revealing' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      }`}>
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl" style={{
          background: 'rgba(0,255,213,0.08)',
          boxShadow: '0 0 60px rgba(0,255,213,0.2)',
        }}>
          <svg viewBox="0 0 200 200" className="w-12 h-12">
            <defs>
              <linearGradient id="wo-accent" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00ffd5" />
                <stop offset="100%" stopColor="#00aaff" />
              </linearGradient>
            </defs>
            <path d="M 15 120 Q 100 50 185 120 Q 100 190 15 120 Z" fill="none" stroke="url(#wo-accent)" strokeWidth="4" />
            <circle cx="100" cy="120" r="22" fill="none" stroke="rgba(0,255,213,0.4)" strokeWidth="2" />
            <circle cx="100" cy="120" r="8" fill="#00ffd5" />
            <circle cx="106" cy="114" r="3" fill="rgba(255,255,255,0.6)" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium tracking-widest uppercase" style={{ color: 'rgba(0,255,213,0.7)' }}>
            Bienvenido
          </p>
          <h1 className={`mt-2 text-5xl font-bold text-zinc-100 transition-all duration-1000 delay-300 ${
            phase === 'revealing' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ fontFamily: "'Orbitron', sans-serif" }}>{nombre}</h1>
          <div className={`mx-auto mt-4 h-px transition-all duration-1000 delay-500 ${
            phase === 'revealing' ? 'w-64 opacity-100' : 'w-0 opacity-0'
          }`} style={{ background: 'linear-gradient(to right, transparent, rgba(0,255,213,0.5), transparent)' }} />
          <p className={`mt-4 text-sm text-zinc-600 transition-all duration-700 delay-700 ${
            phase === 'revealing' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>KRONOS &middot; Sistema de Gesti&oacute;n Integral</p>
        </div>
      </div>

      {/* Left door */}
      <div className="absolute left-0 top-0 h-full w-1/2 z-20 origin-left" style={{
        transformStyle: 'preserve-3d',
        transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: phase === 'closed' ? 'rotateY(0deg)' : 'rotateY(-105deg)',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #070707 50%, #050505 100%)',
        borderRight: '1px solid rgba(0,255,213,0.06)',
        boxShadow: phase !== 'closed' ? '-20px 0 60px rgba(0,0,0,0.9)' : 'none',
      }}>
        <div className="absolute inset-0 flex items-center justify-end pr-8">
          <div className="flex flex-col items-end gap-4">
            <div className="h-px w-32" style={{ background: 'linear-gradient(to left, rgba(0,255,213,0.2), transparent)' }} />
            <div className="h-px w-20" style={{ background: 'linear-gradient(to left, rgba(0,255,213,0.1), transparent)' }} />
          </div>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 h-16 w-1 rounded-full bg-zinc-900" />
      </div>

      {/* Right door */}
      <div className="absolute right-0 top-0 h-full w-1/2 z-20 origin-right" style={{
        transformStyle: 'preserve-3d',
        transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: phase === 'closed' ? 'rotateY(0deg)' : 'rotateY(105deg)',
        background: 'linear-gradient(225deg, #0a0a0a 0%, #070707 50%, #050505 100%)',
        borderLeft: '1px solid rgba(0,255,213,0.06)',
        boxShadow: phase !== 'closed' ? '20px 0 60px rgba(0,0,0,0.9)' : 'none',
      }}>
        <div className="absolute inset-0 flex items-center justify-start pl-8">
          <div className="flex flex-col items-start gap-4">
            <div className="h-px w-32" style={{ background: 'linear-gradient(to right, rgba(0,255,213,0.2), transparent)' }} />
            <div className="h-px w-20" style={{ background: 'linear-gradient(to right, rgba(0,255,213,0.1), transparent)' }} />
          </div>
        </div>
        <div className="absolute left-6 top-1/2 -translate-y-1/2 h-16 w-1 rounded-full bg-zinc-900" />
      </div>

      {phase !== 'closed' && (
        <div className="absolute inset-0 z-[15] pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, rgba(0,255,213,0.04) 0%, transparent 60%)',
        }} />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [welcome, setWelcome] = useState<{ show: boolean; nombre: string }>({ show: false, nombre: '' })
  const [booted, setBooted] = useState(false)

  // Eye state
  const [irisOffset, setIrisOffset] = useState({ x: 0, y: 0 })
  const [shutterState, setShutterState] = useState<'open' | 'closed' | 'squint'>('open')
  const [pupilRadius, setPupilRadius] = useState(6)
  const [isTyping, setIsTyping] = useState(false)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [pulsingLetters, setPulsingLetters] = useState<Set<number>>(new Set())

  const irisGroupRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const isSquintingRef = useRef(false)
  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })
  const animFrameRef = useRef<number>(0)

  const router = useRouter()
  const supabase = createClient()

  // Boot sequence
  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 800)
    return () => clearTimeout(t)
  }, [])

  // Eye smooth animation loop
  useEffect(() => {
    function tick() {
      const c = currentRef.current
      const t = targetRef.current
      c.x += (t.x - c.x) * 0.1
      c.y += (t.y - c.y) * 0.1

      const maxDist = 18
      const dist = Math.hypot(c.x, c.y)
      let rx = c.x, ry = c.y
      if (dist > maxDist) {
        const ratio = maxDist / dist
        rx *= ratio
        ry *= ratio
      }
      setIrisOffset({ x: rx, y: ry })
      animFrameRef.current = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [])

  // Mouse tracking for eye
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (activeField) return
      const el = irisGroupRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      targetRef.current = {
        x: (e.clientX - cx) * 0.025,
        y: (e.clientY - cy) * 0.035,
      }
    }
    document.addEventListener('mousemove', onMouse, { passive: true })
    return () => document.removeEventListener('mousemove', onMouse)
  }, [activeField])

  // Blink cycle
  useEffect(() => {
    if (!booted) return
    function doBlink() {
      if (isSquintingRef.current) {
        blinkTimeoutRef.current = setTimeout(doBlink, 1000)
        return
      }
      setShutterState('closed')
      setTimeout(() => {
        if (!isSquintingRef.current) setShutterState('open')
      }, 150)
      blinkTimeoutRef.current = setTimeout(doBlink, Math.random() * 4000 + 3000)
    }
    blinkTimeoutRef.current = setTimeout(doBlink, 3000)
    return () => { if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current) }
  }, [booted])

  // Update eye target based on input caret position
  const updateEyeForInput = useCallback((input: HTMLInputElement) => {
    const el = irisGroupRef.current
    if (!el || !input) return
    const rect = input.getBoundingClientRect()
    const eyeRect = el.getBoundingClientRect()
    const eyeCX = eyeRect.left + eyeRect.width / 2
    const eyeCY = eyeRect.top + eyeRect.height / 2
    const pct = Math.min(input.value.length / 30, 1)
    const caretX = rect.left + 20 + pct * (rect.width - 40)
    const caretY = rect.top + rect.height / 2
    targetRef.current = {
      x: (caretX - eyeCX) * 0.04,
      y: (caretY - eyeCY) * 0.04,
    }
  }, [])

  // Typing effect — crown bounces, random KRONOS letter pulses
  const triggerTypingEffect = useCallback(() => {
    setIsTyping(true)
    const idx = Math.floor(Math.random() * 6)
    setPulsingLetters(new Set([idx]))
    setTimeout(() => setPulsingLetters(new Set()), 200)

    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      if (!activeField) setIsTyping(false)
      setPulsingLetters(new Set())
    }, 400)
  }, [activeField])

  // Focus handlers
  const handleFocus = useCallback((field: 'email' | 'password') => {
    setActiveField(field)
    setIsTyping(true)
    const input = field === 'email' ? emailRef.current : passRef.current
    if (input) updateEyeForInput(input)

    if (field === 'password') {
      isSquintingRef.current = true
      setShutterState('squint')
      setPupilRadius(9)
    }
  }, [updateEyeForInput])

  const handleBlur = useCallback(() => {
    setActiveField(null)
    setIsTyping(false)
    targetRef.current = { x: 0, y: 0 }
    if (isSquintingRef.current) {
      isSquintingRef.current = false
      setShutterState('open')
      setPupilRadius(6)
    }
  }, [])

  const handleInput = useCallback((field: 'email' | 'password') => {
    const input = field === 'email' ? emailRef.current : passRef.current
    if (input) updateEyeForInput(input)
    triggerTypingEffect()
  }, [updateEyeForInput, triggerTypingEffect])

  // Auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error, data } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Error al iniciar sesión', { description: error.message })
      setLoading(false)
      return
    }

    let nombre = 'Usuario'
    if (data.user) {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('nombre')
        .eq('id', data.user.id)
        .single()
      if (usuario?.nombre) {
        nombre = usuario.nombre.split(' ')[0]
      }
    }

    setWelcome({ show: true, nombre })
  }

  const handleWelcomeDone = useCallback(() => {
    router.push('/')
    router.refresh()
  }, [router])

  const kronosLetters = ['K', 'R', 'O', 'N', 'O', 'S']

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden"
      style={{
        backgroundColor: '#000000',
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 60%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {welcome.show && <WelcomeOverlay nombre={welcome.nombre} onDone={handleWelcomeDone} />}

      {/* Star & Meteor Canvas */}
      <SpaceCanvas panelRef={panelRef} />

      {/* Glass Panel */}
      <div
        ref={panelRef}
        className={`kr-glass-panel w-full max-w-[420px] rounded-[32px] p-10 relative z-10 ${
          welcome.show ? 'opacity-0 pointer-events-none' : ''
        }`}
        style={{
          opacity: booted ? 1 : 0,
          transition: 'opacity 1.5s ease 0.5s, box-shadow 0.4s ease, border-color 0.4s ease',
        }}
      >
        {/* Header / Logo */}
        <div className="flex flex-col items-center mb-10">
          <div ref={irisGroupRef}>
            <KronosLogo
              irisOffset={irisOffset}
              isTyping={isTyping}
              isPasswordFocused={activeField === 'password'}
              shutterState={shutterState}
              pupilRadius={pupilRadius}
              booted={booted}
            />
          </div>

          {/* KRONOS Text */}
          <h1
            className="flex justify-center gap-[4px] mb-1"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.9)',
              opacity: booted ? 1 : 0,
              transform: booted ? 'translateY(0)' : 'translateY(15px)',
              transition: 'opacity 1.5s cubic-bezier(0.25,1,0.5,1) 1.2s, transform 1.5s cubic-bezier(0.25,1,0.5,1) 1.2s',
            }}
          >
            {kronosLetters.map((letter, i) => (
              <span
                key={i}
                className={pulsingLetters.has(i) ? 'kr-letter-pulse' : ''}
                style={{ transition: 'color 0.3s ease, text-shadow 0.3s ease' }}
              >
                {letter}
              </span>
            ))}
          </h1>

          <p
            className="text-[11px] uppercase tracking-[0.3em] text-gray-500 font-medium text-center mt-1"
            style={{
              opacity: booted ? 1 : 0,
              transform: booted ? 'translateY(0)' : 'translateY(15px)',
              transition: 'opacity 1.5s cubic-bezier(0.25,1,0.5,1) 1.2s, transform 1.5s cubic-bezier(0.25,1,0.5,1) 1.2s',
            }}
          >
            Sistema de Gestión Integral
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="space-y-5"
          style={{
            opacity: booted ? 1 : 0,
            transform: booted ? 'translateY(0)' : 'translateY(15px)',
            transition: 'opacity 1.5s cubic-bezier(0.25,1,0.5,1) 1.2s, transform 1.5s cubic-bezier(0.25,1,0.5,1) 1.2s',
          }}
        >
          <div>
            <label htmlFor="kr-email" className="block text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-[0.15em]">
              Correo Electrónico
            </label>
            <input
              ref={emailRef}
              id="kr-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); handleInput('email') }}
              onFocus={() => handleFocus('email')}
              onBlur={handleBlur}
              placeholder="usuario@empresa.com"
              required
              autoComplete="email"
              className="kr-apple-input w-full px-4 py-3.5 rounded-xl text-sm font-medium"
              style={{ backdropFilter: 'blur(12px)' }}
            />
          </div>

          <div>
            <label htmlFor="kr-pass" className="block text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-[0.15em]">
              Contraseña
            </label>
            <input
              ref={passRef}
              id="kr-pass"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); handleInput('password') }}
              onFocus={() => handleFocus('password')}
              onBlur={handleBlur}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="kr-apple-input w-full px-4 py-3.5 rounded-xl text-sm tracking-widest font-medium"
              style={{ backdropFilter: 'blur(12px)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`kr-btn-pro w-full py-4 rounded-xl font-semibold text-sm tracking-[0.15em] uppercase mt-8 ${
              loading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <span className="relative flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </span>
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-600 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="transition-colors" style={{ color: 'rgba(0,255,213,0.6)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(0,255,213,0.9)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(0,255,213,0.6)')}
          >
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  )
}
