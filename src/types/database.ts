export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          display_name: string
          real_name: string | null
          line_user_id: string | null
          license_level: string | null
          role_type: string[]
          age_groups: string[]
          region: string
          travel_range_km: number | null
          experience_years: number | null
          referred_by: string | null
          phone_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          real_name?: string | null
          line_user_id?: string | null
          license_level?: string | null
          role_type?: string[]
          age_groups?: string[]
          region: string
          travel_range_km?: number | null
          experience_years?: number | null
          referred_by?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          real_name?: string | null
          line_user_id?: string | null
          license_level?: string | null
          role_type?: string[]
          age_groups?: string[]
          region?: string
          travel_range_km?: number | null
          experience_years?: number | null
          referred_by?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      regional_communities: {
        Row: {
          id: string
          name: string
          region: string
          description: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          region: string
          description?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          region?: string
          description?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          id: string
          community_id: string
          user_id: string
          role: 'referee' | 'organizer' | 'manager'
          status: 'pending' | 'approved' | 'rejected'
          approved_by: string | null
          approved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          role: 'referee' | 'organizer' | 'manager'
          status?: 'pending' | 'approved' | 'rejected'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          user_id?: string
          role?: 'referee' | 'organizer' | 'manager'
          status?: 'pending' | 'approved' | 'rejected'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      availabilities: {
        Row: {
          id: string
          user_id: string
          date: string
          start_time: string | null
          end_time: string | null
          age_groups: string[]
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          start_time?: string | null
          end_time?: string | null
          age_groups: string[]
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          start_time?: string | null
          end_time?: string | null
          age_groups?: string[]
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          community_id: string
          created_by: string
          title: string
          match_date: string
          start_time: string
          venue: string
          age_group: string
          referees_needed: number
          assistants_needed: number
          compensation: number | null
          notes: string | null
          status: 'open' | 'filled' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          community_id: string
          created_by: string
          title: string
          match_date: string
          start_time: string
          venue: string
          age_group: string
          referees_needed?: number
          assistants_needed?: number
          compensation?: number | null
          notes?: string | null
          status?: 'open' | 'filled' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          created_by?: string
          title?: string
          match_date?: string
          start_time?: string
          venue?: string
          age_group?: string
          referees_needed?: number
          assistants_needed?: number
          compensation?: number | null
          notes?: string | null
          status?: 'open' | 'filled' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          id: string
          match_id: string
          user_id: string
          role: 'referee' | 'assistant_referee'
          status: 'notified' | 'accepted' | 'declined' | 'confirmed'
          notified_at: string | null
          responded_at: string | null
          confirmed_at: string | null
          reminder_sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          user_id: string
          role: 'referee' | 'assistant_referee'
          status?: 'notified' | 'accepted' | 'declined' | 'confirmed'
          notified_at?: string | null
          responded_at?: string | null
          confirmed_at?: string | null
          reminder_sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          user_id?: string
          role?: 'referee' | 'assistant_referee'
          status?: 'notified' | 'accepted' | 'declined' | 'confirmed'
          notified_at?: string | null
          responded_at?: string | null
          confirmed_at?: string | null
          reminder_sent_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
  }
}

// Convenience row types
export type UserRow = Database['public']['Tables']['users']['Row']
export type CommunityRow = Database['public']['Tables']['regional_communities']['Row']
export type CommunityMemberRow = Database['public']['Tables']['community_members']['Row']
export type AvailabilityRow = Database['public']['Tables']['availabilities']['Row']
export type MatchRow = Database['public']['Tables']['matches']['Row']
export type AssignmentRow = Database['public']['Tables']['assignments']['Row']
