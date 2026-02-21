'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import { Skeleton } from '@/components/ui/skeleton'
import { Settings, Building2, User, Monitor } from 'lucide-react'

interface Empresa {
  id: string
  ruc: string
  razon_social: string
  nombre_comercial: string | null
  direccion: string | null
  distrito: string | null
  provincia: string | null
  departamento: string | null
  regimen_tributario: string | null
}

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string | null
}

export default function ConfiguracionPage() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await supabase.auth.getUser()
        const userId = userRes.data.user?.id

        if (!userId) return

        const { data: usr } = await supabase
          .from('usuarios')
          .select('id, nombre, email, rol, empresa_id')
          .eq('id', userId)
          .single()

        if (usr) {
          setUsuario({ id: usr.id, nombre: usr.nombre, email: usr.email, rol: usr.rol })

          const { data: emp } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', usr.empresa_id)
            .single()

          if (emp) setEmpresa(emp as Empresa)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-48 bg-zinc-800/50" />
        <Skeleton className="h-8 w-64 bg-zinc-800/50" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 bg-zinc-800/50 rounded-lg" />
          <Skeleton className="h-64 bg-zinc-800/50 rounded-lg" />
        </div>
      </div>
    )
  }

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex items-start justify-between py-2.5 border-b border-zinc-800/50 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm text-zinc-200 text-right max-w-[60%]">{value || '-'}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      <BreadcrumbNav />

      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <Settings className="h-7 w-7 text-zinc-400" />
          Configuración
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Información de la empresa, perfil de usuario y configuración del sistema
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos de Empresa */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-zinc-200 mb-4">
            <Building2 className="h-5 w-5 text-blue-400" />
            Datos de la Empresa
          </h3>
          {empresa ? (
            <div>
              <InfoRow label="RUC" value={empresa.ruc} />
              <InfoRow label="Razón Social" value={empresa.razon_social} />
              <InfoRow label="Nombre Comercial" value={empresa.nombre_comercial} />
              <InfoRow label="Dirección" value={empresa.direccion} />
              <InfoRow label="Distrito" value={empresa.distrito} />
              <InfoRow label="Provincia" value={empresa.provincia} />
              <InfoRow label="Departamento" value={empresa.departamento} />
              <InfoRow label="Régimen Tributario" value={empresa.regimen_tributario} />
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No se encontraron datos de empresa.</p>
          )}
        </div>

        {/* Mi Perfil */}
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-zinc-200 mb-4">
              <User className="h-5 w-5 text-emerald-400" />
              Mi Perfil
            </h3>
            {usuario ? (
              <div>
                <InfoRow label="Nombre" value={usuario.nombre} />
                <InfoRow label="Email" value={usuario.email} />
                <InfoRow label="Rol" value={usuario.rol} />
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No se encontraron datos de usuario.</p>
            )}
          </div>

          {/* Sistema */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-zinc-200 mb-4">
              <Monitor className="h-5 w-5 text-violet-400" />
              Sistema
            </h3>
            <div>
              <InfoRow label="Versión" value="1.0.0" />
              <InfoRow label="Plataforma" value="ERP Financiero" />
              <InfoRow label="Base de Datos" value="Supabase (PostgreSQL)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
