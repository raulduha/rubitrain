'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@rubitrain/db'

interface NavItem {
  href?: string
  label: string
  icon: string
  children?: { href: string; label: string }[]
}

const COACH_NAV: NavItem[] = [
  { href: '/dashboard',                label: 'Dashboard',       icon: '🏠' },
  { href: '/dashboard/clubs',          label: 'Mis Clubes',      icon: '🏟️' },
  {
    label: 'Subir Datos', icon: '📤',
    children: [
      { href: '/dashboard/upload/training', label: 'Rutinas' },
      { href: '/dashboard/upload/matches',  label: 'Partidos' },
    ],
  },
  { href: '/dashboard/billing',        label: 'Suscripción',     icon: '💳' },
]

const PLAYER_NAV: NavItem[] = [
  { href: '/dashboard/player',         label: 'Mi rendimiento',  icon: '📊' },
]

interface Props {
  profile: Tables<'profiles'> | null
}

export default function Sidebar({ profile }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const NAV = pathname.startsWith('/dashboard/player') ? PLAYER_NAV : COACH_NAV
  const [uploadOpen, setUploadOpen] = useState(
    pathname.startsWith('/dashboard/upload')
  )

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-60 bg-[#001e40] flex flex-col h-screen shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#83fc8e] rounded-lg flex items-center justify-center">
            <span className="text-[#001e40] font-bold text-sm">R</span>
          </div>
          <div>
            <span className="text-white font-bold block leading-none">RubiTrain</span>
            <span className="text-white/40 text-xs">CDUC Rugby</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV.map(item => {
          if (item.children) {
            const isActive = item.children.some(c => pathname.startsWith(c.href))
            return (
              <div key={item.label}>
                <button
                  onClick={() => setUploadOpen(o => !o)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive ? 'bg-[#0058bc] text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span>{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="text-xs opacity-60">{uploadOpen ? '▲' : '▼'}</span>
                </button>
                {uploadOpen && (
                  <div className="ml-9 mt-1 space-y-1">
                    {item.children.map(c => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className={`block px-3 py-2 rounded-lg text-sm transition ${
                          pathname === c.href
                            ? 'text-white font-medium'
                            : 'text-white/50 hover:text-white'
                        }`}
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active ? 'bg-[#0058bc] text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-[#0058bc] rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">
              {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{profile?.full_name}</p>
            <p className="text-white/40 text-xs capitalize">{profile?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-white/50 hover:text-white text-xs text-left px-2 py-1.5 hover:bg-white/10 rounded-lg transition"
        >
          ↩ Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
