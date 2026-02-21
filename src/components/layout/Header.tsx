'use client'

import { useAppStore } from '@/lib/stores/app-store'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PanelLeft, LogOut, User } from 'lucide-react'
import { NotificationCenter } from '@/components/layout/NotificationCenter'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Header() {
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-[#0d1117]/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-zinc-100">
          KRONOS
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <NotificationCenter />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 text-zinc-400 hover:text-zinc-100">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
                  US
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
