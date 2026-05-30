// Single API layer. Flip USE_MOCKS to false once the backend is live.
// All shapes mirror backend/main.py — the source of truth for the contract.
import type {
  AskResponse,
  DealDetail,
  DealsResponse,
  IntroRequestResponse,
  Investor,
  LeadView,
  TicketCreate,
  TicketCreateResponse,
  VoiceCallResponse,
} from './types'

import investorMock from './mocks/investor.json'
import dealsMock from './mocks/deals.json'
import routepilotMock from './mocks/routepilot.json'

export const USE_MOCKS = true
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const DEAL_ID = 'routepilot'

// Small artificial latency so loading states are visible while on mocks.
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

export async function getInvestor(): Promise<Investor> {
  if (USE_MOCKS) {
    await delay(150)
    return investorMock as Investor
  }
  return getJSON<Investor>('/api/investor')
}

export async function getDeals(): Promise<DealsResponse> {
  if (USE_MOCKS) {
    await delay(150)
    return dealsMock as DealsResponse
  }
  return getJSON<DealsResponse>('/api/deals')
}

export async function getDealDetail(): Promise<DealDetail> {
  if (USE_MOCKS) {
    await delay(150)
    return routepilotMock as DealDetail
  }
  return getJSON<DealDetail>(`/api/deals/${DEAL_ID}`)
}

export async function askAgent(message: string): Promise<AskResponse> {
  if (USE_MOCKS) {
    await delay(600)
    return mockAsk(message)
  }
  return postJSON<AskResponse>(`/api/deals/${DEAL_ID}/ask`, { message })
}

export async function createTicket(
  body: TicketCreate,
): Promise<TicketCreateResponse> {
  if (USE_MOCKS) {
    await delay(400)
    return {
      ticket_id: 'tkt_002',
      status: 'submitted',
      estimated_response: '24-48 hours',
      message: 'Question submitted to Kreuzberg Seed Partners.',
    }
  }
  return postJSON<TicketCreateResponse>(`/api/deals/${DEAL_ID}/ticket`, body)
}

export async function startVoiceCall(topic: string): Promise<VoiceCallResponse> {
  if (USE_MOCKS) {
    await delay(800)
    return {
      call_id: 'call_001',
      deal_id: DEAL_ID,
      topic,
      status: 'completed',
      summary:
        'The investor asked about rollout complexity, dispatcher adoption, and repeatability of pilot savings. The Voice AI Agent answered from approved diligence notes: integration with two TMS platforms is complete, customer reference calls confirm 15-22% efficiency gains, and the founder-led sales motion is the main scaling uncertainty. Pilot retention data was flagged as pending VC clarification.',
      unresolved_items: [
        'Pilot retention and expansion data',
        'Outbound sales pipeline post VP Sales hire',
      ],
      created_at: '2026-05-30T12:00:00Z',
      next_actions: ['request_intro', 'wait_for_ticket', 'ask_follow_up'],
    }
  }
  return postJSON<VoiceCallResponse>(`/api/deals/${DEAL_ID}/voice-call`, { topic })
}

export async function requestIntro(): Promise<IntroRequestResponse> {
  if (USE_MOCKS) {
    await delay(400)
    return {
      status: 'submitted',
      message: 'Intro request sent to Kreuzberg Seed Partners.',
      next_step:
        'The lead can review your questions, tickets, and call summary before accepting.',
    }
  }
  return postJSON<IntroRequestResponse>(`/api/deals/${DEAL_ID}/intro-request`, {})
}

export async function getLeadView(): Promise<LeadView> {
  if (USE_MOCKS) {
    await delay(200)
    return {
      deal: { id: DEAL_ID, name: 'RoutePilot AI', lead_investor: 'Kreuzberg Seed Partners' },
      investor: {
        name: investorMock.name,
        company: investorMock.company,
        role: investorMock.role,
        fit_score: 94,
        strategic_assets: investorMock.strategic_assets,
      },
      questions_asked: [],
      tickets: [
        {
          ticket_id: 'tkt_001',
          deal_id: DEAL_ID,
          question: 'What percentage of revenue comes from the top 3 customers?',
          category: 'concentration_risk',
          status: 'answered',
          created_at: '2026-05-28T10:15:00Z',
          answered_at: '2026-05-29T09:30:00Z',
          answer:
            'Top 3 customers represent 42% of MRR. The largest single customer is 18%. We consider this acceptable concentration for this stage, with active pipeline to dilute further.',
        },
      ],
      voice_call_summary: null,
      intro_request: null,
      summary_stats: {
        questions_asked: 0,
        tickets_open: 0,
        tickets_answered: 1,
        voice_calls: 0,
        intro_requested: false,
      },
    }
  }
  return getJSON<LeadView>(`/api/lead-view/${DEAL_ID}`)
}

// --- mock agent logic so the Q&A loop works before the backend is live ---
function mockAsk(message: string): AskResponse {
  const q = message.toLowerCase()
  if (q.includes('invest') && (q.includes('should') || q.includes('worth'))) {
    return {
      status: 'answered',
      answer:
        'I can surface diligence facts but cannot give investment advice or a buy/sell recommendation. From the packet: the round is EUR 2.4M led by Kreuzberg Seed Partners, ARR is EUR 456,000 with 22% MoM growth, and sales scalability is flagged as a high risk. The decision is yours.',
      sources: [
        { label: 'Round terms', section: 'round' },
        { label: 'Traction', section: 'traction' },
        { label: 'Risks', section: 'risks' },
      ],
      ticket_suggestion: null,
      next_actions: ['ask_follow_up', 'start_voice_call'],
    }
  }
  if (q.includes('round') || q.includes('raise') || q.includes('valuation') || q.includes('size')) {
    return {
      status: 'answered',
      answer:
        'RoutePilot is raising a EUR 2.4M Seed round on a post-money SAFE, led by Kreuzberg Seed Partners. EUR 400,000 of allocation is available with a EUR 25,000 minimum ticket, and the round has 12 days remaining.',
      sources: [{ label: 'Round terms', section: 'round' }],
      next_actions: ['ask_follow_up', 'start_voice_call', 'request_intro'],
      ticket_suggestion: null,
    }
  }
  // default: not in the packet → suggest a ticket
  return {
    status: 'missing_answer',
    answer:
      'That detail is not covered in the approved diligence packet I have access to. I will not guess. You can raise a clarification ticket to the lead, Kreuzberg Seed Partners.',
    sources: [],
    ticket_suggestion: {
      question: message,
      category: 'general',
    },
    next_actions: ['create_ticket', 'ask_follow_up', 'start_voice_call'],
  }
}
