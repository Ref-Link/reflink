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

// License levels (JFA審判ライセンス)
export type LicenseLevel = '1級' | '2級' | '3級' | '4級'

// Age groups (internal DB values)
export type AgeGroup = 'U12' | 'U15' | 'U18' | 'Senior'

// Display labels for age groups (JFA登録種別)
export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  U12: '第4種(U-12)',
  U15: '第3種(U-15)',
  U18: '第2種(U-18)',
  Senior: '第1種(大学・社会人)',
}

// Candidate for assignment (includes trust visibility data)
export interface Candidate {
  id: string
  display_name: string
  license_level: string | null
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
