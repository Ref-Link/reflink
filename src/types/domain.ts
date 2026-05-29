// Assignment status lifecycle
export type AssignmentStatus = 'notified' | 'accepted' | 'declined' | 'confirmed'

// Community member roles
export type CommunityMemberRole = 'referee' | 'organizer' | 'manager'

// Community member status
export type CommunityMemberStatus = 'pending' | 'approved' | 'rejected'

// Match status
export type MatchStatus = 'open' | 'filled' | 'cancelled'

// Referee roles within a match
export type RefereeRole = 'referee' | 'assistant_referee'

// License levels
export type LicenseLevel = 'S級' | '1級' | '2級' | '3級' | '4級'

// Age groups
export type AgeGroup = 'U12' | 'U15' | 'U18' | 'Senior'

// Candidate for assignment (includes trust visibility data)
export interface Candidate {
  id: string
  display_name: string
  license_level: string
  role_type: string[]
  age_groups: string[]
  region: string
  travel_range_km: number | null
  total_assignments: number
  last_active_date: string | null
  referred_by: string | null
}

// LINE webhook postback data
export type LinePostbackAction = 'accept' | 'decline'

export interface LinePostbackData {
  action: LinePostbackAction
  assignmentId: string
}
