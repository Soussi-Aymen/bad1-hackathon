// Shared API contract types. Source of truth = backend/ (main.py + data/*.json).
// Keep in sync with the implemented backend; do not rename fields (plan.md §3).

export interface Investor {
  id: string
  name: string
  company: string
  role: string
  sector_expertise: string[]
  ticket_range: { min: number; max: number }
  strategic_assets: string[]
  portfolio_count: number
  portfolio_target: number
}

export interface DealCard {
  id: string
  masked_name: string
  one_liner: string
  sector_tags: string[]
  stage: string
  round_size: number
  allocation_available: number
  lead_investor: string
  dd_completion: number // 0-100
  fit_score: number // 0-100
  fit_reason: string
  days_remaining: number
  pending_tickets: number
}

export interface PortfolioStatus {
  current_positions: number
  recommended_minimum: number
  message: string
}

export interface DealsResponse {
  deals: DealCard[]
  portfolio_status: PortfolioStatus
}

export interface RoundTerms {
  size: number
  valuation_type: string
  allocation_available: number
  lead_investor: string
  dd_completion: number
  days_remaining: number
  min_ticket: number
}

export interface MarketInfo {
  tam: string
  segment: string
  trends: string
}

export type MetricTrend = 'up' | 'down' | 'stable'

export interface Metric {
  label: string
  value: string
  trend: MetricTrend
}

export interface TeamMember {
  role: string
  background: string
  name_masked: boolean
}

export interface FinancialsSnapshot {
  arr: string
  gross_margin: string
  cac_payback: string
  ltv_cac_ratio: string
}

export interface LeadThesis {
  title: string
  content: string
  open_questions_from_lead: string[]
}

export interface FitDimension {
  dimension: string
  score: number
  explanation: string
}

export interface StrategicFit {
  overall_score: number
  dimensions: FitDimension[]
  what_you_contribute: string
}

export type DiligenceStatus = 'verified' | 'pending' | 'flagged'

export interface DiligenceItem {
  item: string
  status: DiligenceStatus
  note?: string
}

export type RiskSeverity = 'high' | 'medium' | 'low'

export interface RiskItem {
  risk: string
  severity: RiskSeverity
  detail: string
  what_resolves_it: string
}

export interface DealDetail {
  id: string
  masked_name: string
  one_liner: string
  stage: string
  sector_tags: string[]
  founded: string
  team_size: number
  location: string
  round: RoundTerms
  overview: string
  market: MarketInfo
  traction: { metrics: Metric[] }
  team: TeamMember[]
  financials_snapshot: FinancialsSnapshot
  lead_thesis: LeadThesis
  strategic_fit: StrategicFit
  diligence_status: DiligenceItem[]
  risks: RiskItem[]
}

// --- Agent Q&A (POST /ask) ---
export interface Source {
  label: string
  section: string
}

export interface TicketSuggestion {
  question: string
  category: string
}

export type AskStatus = 'answered' | 'missing_answer'

// next_actions are short string tags, e.g. "ask_follow_up", "create_ticket",
// "start_voice_call", "request_intro", "decline".
export interface AskResponse {
  status: AskStatus
  answer: string
  sources: Source[]
  ticket_suggestion: TicketSuggestion | null
  next_actions: string[]
}

// --- Tickets ---
// POST /ticket request body
export interface TicketCreate {
  question: string
  category?: string
}

// POST /ticket response
export interface TicketCreateResponse {
  ticket_id: string
  status: string
  estimated_response: string
  message: string
}

// Full ticket record (from /tickets and lead-view)
export interface Ticket {
  ticket_id: string
  deal_id: string
  question: string
  category: string
  status: string
  created_at: string
  answered_at: string | null
  answer: string | null
}

// --- Voice call (POST /voice-call) ---
export interface VoiceCallResponse {
  call_id: string
  deal_id: string
  topic: string
  status: string
  summary: string
  unresolved_items: string[]
  created_at: string
  next_actions: string[]
}

// --- Intro request (POST /intro-request) ---
export interface IntroRequestResponse {
  status: string
  message: string
  next_step: string
}

// --- Lead view (GET /lead-view/routepilot) ---
export interface AskedQuestion {
  question: string
  status: AskStatus
  asked_at: string
}

export interface IntroRecord {
  deal_id: string
  status: string
  created_at: string
}

export interface LeadView {
  deal: { id: string; name: string; lead_investor: string }
  investor: {
    name: string
    company: string
    role: string
    fit_score: number
    strategic_assets: string[]
  }
  questions_asked: AskedQuestion[]
  tickets: Ticket[]
  voice_call_summary: VoiceCallResponse | null
  intro_request: IntroRecord | null
  summary_stats: {
    questions_asked: number
    tickets_open: number
    tickets_answered: number
    voice_calls: number
    intro_requested: boolean
  }
}
