'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ruc, setRuc] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No se pudo crear el usuario')

      // 2. Create empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .insert({ ruc, razon_social: razonSocial })
        .select()
        .single()

      if (empresaError) throw empresaError

      // 3. Create usuario profile
      const { error: userError } = await supabase.from('usuarios').insert({
        id: authData.user.id,
        empresa_id: empresa.id,
        nombre,
        email,
        rol: 'admin',
      })

      if (userError) throw userError

      toast.success('Cuenta creada exitosamente', {
        description: 'Revisa tu correo para confirmar tu cuenta.',
      })
      router.push('/login')
    } catch (error) {
      toast.error('Error al registrarse', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-[#0a0f1a]">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20">
            <DollarSign className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-zinc-100">Crear Cuenta</h1>
          <p className="mt-1 text-sm text-zinc-500">Registra tu empresa en el sistema</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Nombre completo</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Juan Pérez"
              required
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">RUC de la empresa</Label>
            <Input
              value={ruc}
              onChange={(e) => setRuc(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="20123456789"
              required
              maxLength={11}
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Razón social</Label>
            <Input
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              placeholder="Mi Empresa S.A.C."
              required
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Correo electrónico</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@empresa.com"
              required
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Contraseña</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Crear Cuenta
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
