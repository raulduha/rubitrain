'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TeamOption {
  id: string
  name: string
  category: string | null
  orgName: string
}

export function useUserTeams() {
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('teams')
        .select('id, name, category, organizations(name)')
        .eq('is_active', true) as {
          data: { id: string; name: string; category: string | null; organizations: { name: string } }[] | null
        }

      setTeams((data ?? []).map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        orgName: t.organizations?.name ?? '',
      })))
      setLoading(false)
    }
    load()
  }, [])

  return { teams, loading }
}
