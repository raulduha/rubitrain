'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface TeamOption {
  id: string
  name: string
  category: string | null
}

export interface ClubOption {
  id: string
  name: string
  teams: TeamOption[]
}

export function useUserClubs() {
  const [clubs, setClubs] = useState<ClubOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('organizations')
        .select('id, name, teams(id, name, category, is_active)')
        .eq('owner_id', user.id)
        .order('name') as {
          data: { id: string; name: string; teams: (TeamOption & { is_active: boolean })[] }[] | null
        }

      setClubs(
        (data ?? []).map(org => ({
          id: org.id,
          name: org.name,
          teams: (org.teams ?? [])
            .filter(t => t.is_active)
            .map(({ id, name, category }) => ({ id, name, category })),
        }))
      )
      setLoading(false)
    }
    load()
  }, [])

  return { clubs, loading }
}
