export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          role: 'physical_trainer' | 'coach' | 'player'
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_url?: string | null
          role: 'physical_trainer' | 'coach' | 'player'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string | null
          role?: 'physical_trainer' | 'coach' | 'player'
          phone?: string | null
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          sport: string
          logo_url: string | null
          country: string | null
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          sport?: string
          logo_url?: string | null
          country?: string | null
          owner_id: string
          created_at?: string
        }
        Update: {
          name?: string
          sport?: string
          logo_url?: string | null
          country?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          organization_id: string
          name: string
          category: string | null
          season: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          category?: string | null
          season?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          category?: string | null
          season?: string | null
          is_active?: boolean
        }
      }
      team_memberships: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: 'coach' | 'player'
          jersey_number: number | null
          position: string | null
          position_group: 'forward' | 'back' | null
          weight_kg: number | null
          height_cm: number | null
          birth_date: string | null
          is_active: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role: 'coach' | 'player'
          jersey_number?: number | null
          position?: string | null
          position_group?: 'forward' | 'back' | null
          weight_kg?: number | null
          height_cm?: number | null
          birth_date?: string | null
          is_active?: boolean
          joined_at?: string
        }
        Update: {
          role?: 'coach' | 'player'
          jersey_number?: number | null
          position?: string | null
          position_group?: 'forward' | 'back' | null
          weight_kg?: number | null
          height_cm?: number | null
          birth_date?: string | null
          is_active?: boolean
        }
      }
      invitations: {
        Row: {
          id: string
          team_id: string
          invited_by: string | null
          email: string
          role: 'coach' | 'player'
          token: string
          status: 'pending' | 'accepted' | 'rejected' | 'expired'
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          invited_by?: string | null
          email: string
          role: 'coach' | 'player'
          token?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'expired'
          expires_at?: string
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'rejected' | 'expired'
        }
      }
      training_sessions: {
        Row: {
          id: string
          team_id: string
          created_by: string | null
          title: string
          session_date: string
          session_time: string | null
          duration_minutes: number | null
          session_type: 'strength' | 'speed' | 'technical' | 'recovery' | 'match_prep' | null
          notes: string | null
          status: 'planned' | 'completed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          created_by?: string | null
          title: string
          session_date: string
          session_time?: string | null
          duration_minutes?: number | null
          session_type?: 'strength' | 'speed' | 'technical' | 'recovery' | 'match_prep' | null
          notes?: string | null
          status?: 'planned' | 'completed' | 'cancelled'
          created_at?: string
        }
        Update: {
          title?: string
          session_date?: string
          session_time?: string | null
          duration_minutes?: number | null
          session_type?: 'strength' | 'speed' | 'technical' | 'recovery' | 'match_prep' | null
          notes?: string | null
          status?: 'planned' | 'completed' | 'cancelled'
        }
      }
      performance_logs: {
        Row: {
          id: string
          player_id: string | null
          team_id: string | null
          session_id: string | null
          log_date: string
          squat_kg: number | null
          deadlift_kg: number | null
          bench_kg: number | null
          power_clean_kg: number | null
          custom_metric_name: string | null
          custom_metric_value: number | null
          tonnage_kg: number | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          player_id?: string | null
          team_id?: string | null
          session_id?: string | null
          log_date: string
          squat_kg?: number | null
          deadlift_kg?: number | null
          bench_kg?: number | null
          power_clean_kg?: number | null
          custom_metric_name?: string | null
          custom_metric_value?: number | null
          tonnage_kg?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          squat_kg?: number | null
          deadlift_kg?: number | null
          bench_kg?: number | null
          power_clean_kg?: number | null
          tonnage_kg?: number | null
          notes?: string | null
        }
      }
      match_metrics: {
        Row: {
          id: string
          player_id: string | null
          team_id: string | null
          match_date: string
          opponent: string | null
          max_speed_kmh: number | null
          total_distance_m: number | null
          sprint_count: number | null
          hsr_distance_m: number | null
          status: 'optimal' | 'fatigue' | 'alert'
          raw_data: Json | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          player_id?: string | null
          team_id?: string | null
          match_date: string
          opponent?: string | null
          max_speed_kmh?: number | null
          total_distance_m?: number | null
          sprint_count?: number | null
          hsr_distance_m?: number | null
          status?: 'optimal' | 'fatigue' | 'alert'
          raw_data?: Json | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          max_speed_kmh?: number | null
          total_distance_m?: number | null
          sprint_count?: number | null
          hsr_distance_m?: number | null
          status?: 'optimal' | 'fatigue' | 'alert'
        }
      }
      physical_status: {
        Row: {
          id: string
          player_id: string | null
          team_id: string | null
          reported_by: string | null
          status_date: string
          status: 'fit' | 'limited' | 'injured' | 'recovering'
          injury_description: string | null
          body_area: string | null
          expected_return: string | null
          is_current: boolean
          created_at: string
        }
        Insert: {
          id?: string
          player_id?: string | null
          team_id?: string | null
          reported_by?: string | null
          status_date?: string
          status: 'fit' | 'limited' | 'injured' | 'recovering'
          injury_description?: string | null
          body_area?: string | null
          expected_return?: string | null
          is_current?: boolean
          created_at?: string
        }
        Update: {
          status?: 'fit' | 'limited' | 'injured' | 'recovering'
          injury_description?: string | null
          body_area?: string | null
          expected_return?: string | null
          is_current?: boolean
        }
      }
      subscriptions: {
        Row: {
          id: string
          payer_id: string
          organization_id: string | null
          billing_type: 'personal' | 'organization'
          payment_provider: 'mercadopago' | 'webpay' | null
          mp_preapproval_id: string | null
          mp_customer_id: string | null
          webpay_token: string | null
          plan: 'free' | 'pro' | 'club'
          status: 'active' | 'past_due' | 'cancelled' | 'trialing'
          active_players_count: number
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          payer_id: string
          organization_id?: string | null
          billing_type?: 'personal' | 'organization'
          payment_provider?: 'mercadopago' | 'webpay' | null
          mp_preapproval_id?: string | null
          mp_customer_id?: string | null
          webpay_token?: string | null
          plan?: 'free' | 'pro' | 'club'
          status?: 'active' | 'past_due' | 'cancelled' | 'trialing'
          active_players_count?: number
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          organization_id?: string | null
          billing_type?: 'personal' | 'organization'
          payment_provider?: 'mercadopago' | 'webpay' | null
          mp_preapproval_id?: string | null
          plan?: 'free' | 'pro' | 'club'
          status?: 'active' | 'past_due' | 'cancelled' | 'trialing'
          active_players_count?: number
          current_period_end?: string | null
          updated_at?: string
        }
      }
    }
    Functions: {
      get_effective_plan: {
        Args: { p_user_id: string }
        Returns: string
      }
      accept_invitation: {
        Args: { p_token: string; p_user_id: string }
        Returns: Json
      }
      count_active_players: {
        Args: { p_org_id: string }
        Returns: number
      }
      refresh_player_count: {
        Args: { p_org_id: string }
        Returns: undefined
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
