import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal, Optional

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.tools import tool
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

CLAUDE_MODEL = "claude-opus-4-8"
_agent = None


def get_agent() -> ChatAnthropic:
    global _agent
    if _agent is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="ANTHROPIC_API_KEY not configured on the backend.",
            )
        llm = ChatAnthropic(model=CLAUDE_MODEL, api_key=api_key, max_tokens=1024, timeout=30.0)
        _agent = llm.bind_tools(AGENT_TOOLS, tool_choice="any")
    return _agent

DATA_DIR = Path(__file__).parent / "data"


def load_json(name: str):
    with open(DATA_DIR / name, "r", encoding="utf-8") as f:
        return json.load(f)


# ── Agent tools ────────────────────────────────────────────────────────────────

class _Source(BaseModel):
    label: str = Field(description="Short human label for the source")
    section: str = Field(description="Key from the diligence packet (e.g. 'traction', 'risks')")

class _ProvideAnswerInput(BaseModel):
    answer: str = Field(description="Plain-text answer grounded in the diligence packet")
    sources: list[_Source] = Field(description="Packet sections that support the answer")
    next_actions: list[Literal["ask_follow_up", "start_voice_call", "create_ticket", "request_intro", "decline"]] = Field(
        description="Suggested next steps for the investor"
    )

class _EscalateInput(BaseModel):
    explanation: str = Field(description="Why the packet does not cover this question")
    ticket_question: str = Field(description="One-line question to raise as a VC clarification ticket")
    category: str = Field(description="Short tag, e.g. 'concentration_risk', 'sales_pipeline'")


@tool("provide_answer", args_schema=_ProvideAnswerInput)
def provide_answer(answer: str, sources: list[_Source], next_actions: list[str]) -> str:
    """Use when the approved diligence packet contains enough information to answer the investor's question."""
    return "answered"


@tool("escalate_question", args_schema=_EscalateInput)
def escalate_question(explanation: str, ticket_question: str, category: str) -> str:
    """Use when the question cannot be answered from the packet. Surfaces a clarification ticket to the lead investor."""
    return "escalated"


AGENT_TOOLS = [provide_answer, escalate_question]

# Per-deal conversation history (HumanMessage / AIMessage pairs).
CONVERSATIONS: dict[str, list] = {}


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
3. NEVER expose raw VC files. You summarise approved content only.
4. You have memory of the current conversation — you can reference what the investor already asked.
5. For every question, call exactly one tool: `provide_answer` if the packet covers it, \
   `escalate_question` if it does not.

APPROVED DILIGENCE PACKET (JSON):
{packet}
"""


def build_system_prompt() -> str:
    packet = load_json("routepilot.json")
    return SYSTEM_PROMPT_TEMPLATE.format(packet=json.dumps(packet, indent=2))


class AskRequest(BaseModel):
    message: str


@app.post("/api/deals/{deal_id}/ask")
def ask_agent(deal_id: str, body: AskRequest):
    assert_routepilot(deal_id)
    agent = get_agent()
    system_prompt = build_system_prompt()

    history = CONVERSATIONS.setdefault(deal_id, [])
    history.append(HumanMessage(content=body.message))

    try:
        response = agent.invoke([SystemMessage(content=system_prompt)] + history)
    except Exception as exc:
        history.pop()
        raise HTTPException(status_code=502, detail=f"Agent call failed: {exc}")

    tool_calls = getattr(response, "tool_calls", [])
    if not tool_calls:
        history.pop()
        raise HTTPException(status_code=502, detail="Agent returned no tool call.")

    tc = tool_calls[0]
    name, args = tc["name"], tc["args"]

    if name == "provide_answer":
        history.append(AIMessage(content=f"Based on the diligence packet: {args['answer']}"))
        result = {
            "status": "answered",
            "answer": args["answer"],
            "sources": [s if isinstance(s, dict) else s.dict() for s in args.get("sources", [])],
            "ticket_suggestion": None,
            "next_actions": args.get("next_actions", ["ask_follow_up", "start_voice_call", "request_intro"]),
        }
    else:  # escalate_question
        history.append(AIMessage(content=f"Not in the packet. {args.get('explanation', '')} Suggested ticket: {args.get('ticket_question', '')}"))
        result = {
            "status": "missing_answer",
            "answer": args["explanation"],
            "sources": [],
            "ticket_suggestion": {
                "question": args["ticket_question"],
                "category": args.get("category", "general"),
            },
            "next_actions": ["create_ticket", "ask_follow_up", "start_voice_call"],
        }

    ASKED_QUESTIONS.append({"question": body.message, "status": result["status"], "asked_at": now_iso()})
    return result


@app.delete("/api/deals/{deal_id}/conversation")
def reset_conversation(deal_id: str):
    assert_routepilot(deal_id)
    CONVERSATIONS.pop(deal_id, None)
    return {"status": "reset"}


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
