# DealBridge Berlin

Co-investment intelligence platform for strategic co-investors evaluating early-stage rounds led by credible VCs. The investor can browse matched deals, ask a controlled-access AI agent questions against an approved diligence packet, escalate gaps as VC clarification tickets, run a simulated Voice AI call, and request an intro to the lead. Raw VC files are never exposed.

Hackathon MVP — built in a single 2h30 sprint. Full build plan: [`plan.md`](./plan.md).

## Stack

- **Backend:** Python 3.11+, FastAPI, Anthropic SDK (Claude Opus 4.7). Hardcoded JSON + in-memory state. No database.
- **Frontend:** React + Vite + TypeScript + Tailwind. (Built in parallel — see `plan.md` §5.)

## Run the backend locally

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
copy .env.example .env   # then put your ANTHROPIC_API_KEY in .env
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

Server runs on `http://localhost:8000`. Swagger UI at `/docs`. Health check at `/health`.

CORS is open to `http://localhost:5173` (Vite default).

### Environment

`backend/.env` (gitignored):

```
ANTHROPIC_API_KEY=sk-ant-...
```

Without the key, every endpoint works except `POST /api/deals/{id}/ask`, which returns `503`.

## API summary

All deal-scoped endpoints accept `deal_id = "routepilot"`. Any other id returns `404`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/api/investor` | Hardcoded co-investor persona |
| GET | `/api/deals` | List of 2–3 deal cards |
| GET | `/api/deals/{id}` | Full deal detail |
| POST | `/api/deals/{id}/ask` | Text agent Q&A → `answered` or `missing_answer` |
| POST | `/api/deals/{id}/ticket` | Create VC clarification ticket |
| GET | `/api/deals/{id}/tickets` | List tickets for a deal |
| POST | `/api/deals/{id}/voice-call` | Simulated Voice AI call summary |
| POST | `/api/deals/{id}/intro-request` | Submit intro request to lead |
| GET | `/api/lead-view/{id}` | Lead-side aggregate: investor, questions, tickets, call, intro |

### `/ask` response shape

```json
{
  "status": "answered" | "missing_answer",
  "answer": "...",
  "sources": [{ "label": "Round details", "section": "round" }],
  "ticket_suggestion": null | { "question": "...", "category": "..." },
  "next_actions": ["ask_follow_up", "start_voice_call", "create_ticket", "request_intro", "decline"]
}
```

When `status = "answered"`, `sources` is non-empty and `ticket_suggestion` is `null`. When `status = "missing_answer"`, `sources` is empty and `ticket_suggestion` is set. The agent will never give investment advice or expose raw VC files.

## Smoke test

With the server running and a valid key in `.env`:

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\smoke_test.ps1
```

Hits all 9 endpoints in demo order and prints status of each.

## Repository layout

```
.
├── backend/
│   ├── main.py              FastAPI app + all endpoints
│   ├── data/                Hardcoded JSON fixtures
│   ├── requirements.txt
│   ├── smoke_test.ps1
│   └── .env.example
├── frontend/                (built in parallel)
└── plan.md                  Frozen build plan
```

## What is intentionally NOT in this MVP

- No database (hardcoded JSON, in-memory state for the demo session).
- No Docker / docker-compose (saves ~30 min of setup).
- No LangChain / LangGraph (single-turn Q&A against one packet — direct SDK call is simpler).
- No expert-validation flow, portfolio meter, or VC syndication analytics (deferred to post-hackathon).

Reasoning in [`plan.md`](./plan.md) §1 and §2.
