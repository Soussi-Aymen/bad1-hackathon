import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from anthropic import Anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

CLAUDE_MODEL = "claude-opus-4-7"
_anthropic_client: Optional[Anthropic] = None


def get_anthropic() -> Anthropic:
    global _anthropic_client
    if _anthropic_client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="ANTHROPIC_API_KEY not configured on the backend.",
            )
        _anthropic_client = Anthropic(api_key=api_key)
    return _anthropic_client

DATA_DIR = Path(__file__).parent / "data"


def load_json(name: str):
    with open(DATA_DIR / name, "r", encoding="utf-8") as f:
        return json.load(f)


app = FastAPI(title="DealBridge Berlin API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# In-memory state for the hackathon demo. Pre-seeded with one answered
# ticket so the lead view has something to show even before the demo starts.
TICKETS: list[dict] = [
    {
        "ticket_id": "tkt_001",
        "deal_id": "routepilot",
        "question": "What percentage of revenue comes from the top 3 customers?",
        "category": "concentration_risk",
        "status": "answered",
        "created_at": "2026-05-28T10:15:00Z",
        "answered_at": "2026-05-29T09:30:00Z",
        "answer": "Top 3 customers represent 42% of MRR. The largest single customer is 18%. We consider this acceptable concentration for this stage, with active pipeline to dilute further.",
    }
]

VOICE_CALLS: list[dict] = []
INTRO_REQUESTS: list[dict] = []


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def assert_routepilot(deal_id: str) -> None:
    if deal_id != "routepilot":
        raise HTTPException(status_code=404, detail="Deal not found")


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/investor")
def get_investor():
    return load_json("investor.json")


@app.get("/api/deals")
def get_deals():
    return load_json("deals.json")


@app.get("/api/deals/{deal_id}")
def get_deal_detail(deal_id: str):
    assert_routepilot(deal_id)
    return load_json("routepilot.json")


class TicketCreate(BaseModel):
    question: str
    category: Optional[str] = "general"


@app.post("/api/deals/{deal_id}/ticket")
def create_ticket(deal_id: str, body: TicketCreate):
    assert_routepilot(deal_id)
    ticket_id = f"tkt_{len(TICKETS) + 1:03d}"
    ticket = {
        "ticket_id": ticket_id,
        "deal_id": deal_id,
        "question": body.question,
        "category": body.category or "general",
        "status": "submitted",
        "created_at": now_iso(),
        "answered_at": None,
        "answer": None,
    }
    TICKETS.append(ticket)
    return {
        "ticket_id": ticket_id,
        "status": "submitted",
        "estimated_response": "24-48 hours",
        "message": "Question submitted to Kreuzberg Seed Partners.",
    }


@app.get("/api/deals/{deal_id}/tickets")
def list_tickets(deal_id: str):
    assert_routepilot(deal_id)
    return {"tickets": [t for t in TICKETS if t["deal_id"] == deal_id]}


class VoiceCallRequest(BaseModel):
    topic: Optional[str] = "operational risk and pilot evidence"


@app.post("/api/deals/{deal_id}/voice-call")
def voice_call(deal_id: str, body: VoiceCallRequest):
    assert_routepilot(deal_id)
    call_id = f"call_{len(VOICE_CALLS) + 1:03d}"
    summary = (
        "The investor asked about rollout complexity, dispatcher adoption, and "
        "repeatability of pilot savings. The Voice AI Agent answered from approved "
        "diligence notes: integration with two TMS platforms is complete, customer "
        "reference calls confirm 15-22% efficiency gains, and the founder-led sales "
        "motion is the main scaling uncertainty. Pilot retention data was flagged as "
        "pending VC clarification."
    )
    call = {
        "call_id": call_id,
        "deal_id": deal_id,
        "topic": body.topic,
        "status": "completed",
        "summary": summary,
        "unresolved_items": [
            "Pilot retention and expansion data",
            "Outbound sales pipeline post VP Sales hire",
        ],
        "created_at": now_iso(),
        "next_actions": ["request_intro", "wait_for_ticket", "ask_follow_up"],
    }
    VOICE_CALLS.append(call)
    return call


@app.post("/api/deals/{deal_id}/intro-request")
def intro_request(deal_id: str):
    assert_routepilot(deal_id)
    intro = {
        "deal_id": deal_id,
        "status": "submitted",
        "created_at": now_iso(),
    }
    INTRO_REQUESTS.append(intro)
    return {
        "status": "submitted",
        "message": "Intro request sent to Kreuzberg Seed Partners.",
        "next_step": "The lead can review your questions, tickets, and call summary before accepting.",
    }


# Questions the investor has asked the text agent in this session.
# Populated by /ask; kept here so the lead view can show it.
ASKED_QUESTIONS: list[dict] = []


SYSTEM_PROMPT_TEMPLATE = """You are the DealBridge deal intelligence agent for RoutePilot AI. \
The lead investor is Kreuzberg Seed Partners. Your job is to help a co-investor evaluate \
this deal by answering questions from the approved diligence packet below.

Hard rules:
1. Answer ONLY from the diligence packet. If something is not in the packet, do not guess.
2. NEVER provide investment advice. Never say "you should invest", "this is a good deal", \
   "I recommend", or anything similar. You present information; the investor decides.
3. NEVER expose raw VC files or pretend to provide full source documents. You summarise \
   approved content only.
4. Identify the section(s) of the packet that support your answer (e.g. "traction", \
   "lead_thesis", "risks", "diligence_status").
5. If the question is outside the packet, suggest a clarification ticket to the lead \
   instead of guessing.

Output format. Respond with a SINGLE JSON object and nothing else. No markdown, no \
backticks, no commentary outside the JSON. The schema is:

{{
  "status": "answered" | "missing_answer",
  "answer": "<plain text answer or the not-covered explanation>",
  "sources": [
    {{ "label": "<short human label>", "section": "<key from the packet>" }}
  ],
  "ticket_suggestion": {{ "question": "<one-line follow-up>", "category": "<short tag>" }} or null,
  "next_actions": ["ask_follow_up" | "start_voice_call" | "create_ticket" | "request_intro" | "decline"]
}}

When status is "answered", sources MUST be non-empty and ticket_suggestion MUST be null.
When status is "missing_answer", sources MUST be empty and ticket_suggestion MUST be set.

APPROVED DILIGENCE PACKET (JSON):
{packet}
"""


def build_system_prompt() -> str:
    packet = load_json("routepilot.json")
    return SYSTEM_PROMPT_TEMPLATE.format(packet=json.dumps(packet, indent=2))


def parse_agent_response(raw: str) -> dict:
    """Parse Claude's JSON response. Fall back to a safe missing_answer shape."""
    text = raw.strip()
    # Defensive: strip markdown fences if Claude wrapped anyway.
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return {
            "status": "missing_answer",
            "answer": "The agent could not produce a structured answer for this question. You can raise it as a ticket to the lead instead.",
            "sources": [],
            "ticket_suggestion": {
                "question": "Please clarify the question the co-investor asked.",
                "category": "general",
            },
            "next_actions": ["create_ticket", "ask_follow_up"],
        }

    status = data.get("status")
    if status not in ("answered", "missing_answer"):
        status = "missing_answer"
    answer = data.get("answer") or "Not covered in the approved diligence packet."
    sources = data.get("sources") or []
    ticket_suggestion = data.get("ticket_suggestion")
    next_actions = data.get("next_actions") or []
    if status == "answered":
        ticket_suggestion = None
        if not next_actions:
            next_actions = ["ask_follow_up", "start_voice_call", "request_intro"]
    else:
        sources = []
        if not ticket_suggestion:
            ticket_suggestion = {
                "question": "Please follow up with the lead on this question.",
                "category": "general",
            }
        if not next_actions:
            next_actions = ["create_ticket", "ask_follow_up", "start_voice_call"]
    return {
        "status": status,
        "answer": answer,
        "sources": sources,
        "ticket_suggestion": ticket_suggestion,
        "next_actions": next_actions,
    }


class AskRequest(BaseModel):
    message: str


@app.post("/api/deals/{deal_id}/ask")
def ask_agent(deal_id: str, body: AskRequest):
    assert_routepilot(deal_id)
    client = get_anthropic()
    system_prompt = build_system_prompt()
    try:
        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=700,
            temperature=0,
            system=system_prompt,
            messages=[{"role": "user", "content": body.message}],
            timeout=30.0,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Claude call failed: {exc}")

    raw_text = "".join(
        block.text for block in message.content if getattr(block, "type", None) == "text"
    )
    result = parse_agent_response(raw_text)
    ASKED_QUESTIONS.append(
        {
            "question": body.message,
            "status": result["status"],
            "asked_at": now_iso(),
        }
    )
    return result


@app.get("/api/lead-view/{deal_id}")
def lead_view(deal_id: str):
    assert_routepilot(deal_id)
    investor = load_json("investor.json")
    deal_tickets = [t for t in TICKETS if t["deal_id"] == deal_id]
    deal_calls = [c for c in VOICE_CALLS if c["deal_id"] == deal_id]
    deal_intros = [i for i in INTRO_REQUESTS if i["deal_id"] == deal_id]
    last_call = deal_calls[-1] if deal_calls else None
    last_intro = deal_intros[-1] if deal_intros else None
    return {
        "deal": {
            "id": "routepilot",
            "name": "RoutePilot AI",
            "lead_investor": "Kreuzberg Seed Partners",
        },
        "investor": {
            "name": investor["name"],
            "company": investor["company"],
            "role": investor["role"],
            "fit_score": 94,
            "strategic_assets": investor["strategic_assets"],
        },
        "questions_asked": ASKED_QUESTIONS,
        "tickets": deal_tickets,
        "voice_call_summary": last_call,
        "intro_request": last_intro,
        "summary_stats": {
            "questions_asked": len(ASKED_QUESTIONS),
            "tickets_open": sum(1 for t in deal_tickets if t["status"] != "answered"),
            "tickets_answered": sum(1 for t in deal_tickets if t["status"] == "answered"),
            "voice_calls": len(deal_calls),
            "intro_requested": last_intro is not None,
        },
    }
