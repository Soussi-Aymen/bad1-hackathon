import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

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
