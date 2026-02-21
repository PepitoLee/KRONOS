'use client'

import { useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { WelcomeModal } from '@/components/onboarding/WelcomeModal'
import { ProgressChecklist } from '@/components/onboarding/ProgressChecklist'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/stores/app-store'
import { registerServiceWorker } from '@/lib/utils/register-sw'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { setEmpresaId, setUserId, setUserRol } = useAppStore()
  const supabase = createClient()

  useEffect(() => {
    registerServiceWorker()
  }, [])

  useEffect(() => {
    async function loadUserContext() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id, rol')
        .eq('id', user.id)
        .single()

      if (usuario) {
        setEmpresaId(usuario.empresa_id)
        setUserRol(usuario.rol)
      }
    }

    loadUserContext()
  }, [supabase, setEmpresaId, setUserId, setUserRol])

  return (
    <div className="dark min-h-screen bg-[#0a0f1a]">
      <Sidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <Header />
        <main className="p-6">{children}</main>
      </div>
      <WelcomeModal />
      <ProgressChecklist />
    </div>
  )
}
