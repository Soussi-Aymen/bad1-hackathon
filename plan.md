# DealBridge Berlin — Final Hackathon Plan

**Time budget:** ~2h30 total. Frontend and backend work in parallel from minute zero.
**Stack:** React + Vite + TypeScript + Tailwind (FE) / FastAPI + Anthropic SDK (BE).
**Data:** Hardcoded JSON + in-memory state. No DB, no Docker (unless team already has it warm).

---

## 1. Do we need LangChain or LangGraph?

**No. Use neither.**

Reasoning:

- The AI surface is a **single-turn Q&A** against a fixed, hardcoded knowledge blob (one deal). One Claude call per user message. No tool use, no retrieval over a vector store, no multi-step planning, no branching agent state machine.
- LangChain adds an extra abstraction layer (chains, prompt templates, output parsers) on top of the Anthropic SDK we already use. In 2h30 it costs more debugging time than it saves typing.
- LangGraph is designed for **stateful multi-agent or multi-step graphs** (e.g., router → retriever → critic → writer). Our flow is a flat: `user message → Claude → parse JSON → respond`. A graph here is pure overhead.
- The "missing answer → ticket suggestion" branching is **one if-statement on the JSON response**, not a graph node.
- The Voice AI call is **simulated** (pre-canned summary returned from an endpoint). No orchestration involved.

**Decision:** call `anthropic.Anthropic().messages.create(...)` directly with a strict system prompt that forces a JSON response. Parse with `json.loads`. Total code: ~40 lines.

If after the demo we want to add real retrieval over multiple deals, expert-question loops, or VC-side workflows → that is the moment to reach for LangGraph. Not now.

---

## 2. Scope (merged from both team plans)

Take the **revised plan** as the base (simpler, matches the current BP). Keep these strong pieces from the original where they are cheap:

- Source citations on AI answers (already in revised).
- Compact lead view with tickets + call summary + intro request.
- Voice = browser SpeechRecognition / SpeechSynthesis around the same `/ask` endpoint — **only if both teams finish core flow before 2h00**. Otherwise skip and use the simulated voice-call summary endpoint.

### Post-MVP additions (built after the core flow was green)

- **Opportunities table** (`/opportunities`) — dedicated page listing every matched deal with fit score, sectors, stage, round size, allocation, lead, DD %, days remaining, and open tickets. Sorted by fit; clickable rows for active deals.
- **Expanded deal pool** — 10 deals total (was 3). Dashboard shows the top 5 by fit; remaining 5 live on the Opportunities page.
- **Continuous two-way voice chat** in the chat agent — browser Web Speech APIs, zero extra API keys, Chrome / Edge:
  - Tap the 🎤 once to start. The agent listens → transcribes (live, with interim results) → answers → speaks the answer → automatically resumes listening. Loop continues until the user clicks **End voice chat**.
  - Premium listening overlay (Siri / ChatGPT voice-mode feel): Web Audio `AnalyserNode` drives a frequency-reactive bar visualiser, the aura scales with input volume, and a live caption shows what the user is saying as they speak.
  - Separate visual state while the agent is speaking: bars switch to a smooth synthetic envelope, aura tint changes, last reply shown as caption.
  - Mic is closed during TTS playback so the agent does not hear itself; benign `no-speech` / `aborted` events are swallowed so silences don't kill the loop.

Cut for the 2h30 window:

- Expert validation flow (`POST /validation`) — defer.
- AI-triggered domain-expert question — defer.
- Portfolio diversification meter — defer.
- ~~Docker Compose — skip~~ → **Added after the backend was done.** `docker compose up --build` from the repo root boots both services. Manual `uvicorn` + `vite` paths still documented in the README for dev who don't want Docker.
- Multiple full deal details — only `routepilot` has full data; the other two cards on the dashboard are decorative.

Naming: **RoutePilot AI**, lead **Kreuzberg Seed Partners**, investor **Klaus Richter / Richter Logistik GmbH**.

---

## 3. API contract (frozen — both teams build against this)

| # | Method | Path | Purpose |
|---|--------|------|---------|
| 1 | GET | `/api/investor` | Hardcoded investor persona |
| 2 | GET | `/api/deals` | List of 2–3 deal cards |
| 3 | GET | `/api/deals/routepilot` | Full deal detail |
| 4 | POST | `/api/deals/routepilot/ask` | Text Agent Q&A — returns `answered` or `missing_answer` |
| 5 | POST | `/api/deals/routepilot/ticket` | Create VC clarification ticket |
| 6 | POST | `/api/deals/routepilot/voice-call` | Returns canned call summary + unresolved items |
| 7 | POST | `/api/deals/routepilot/intro-request` | Submit intro request |
| 8 | GET | `/api/lead-view/routepilot` | Lead-side view (questions, tickets, call summary, intro) |

Exact JSON shapes: see `DealBridge_Technical_Build_Plan_revised.md` §6. **Do not change shapes mid-build.** If something is missing, add a field — never rename.

---

## 4. Backend build steps (7 steps, ~2h30)

Each step ends in a **verifiable checkpoint**. Do not start step N+1 until step N's checkpoint passes. This is the single biggest bug-prevention rule.

### B1 — Project skeleton (0:00–0:15)
- `cd backend && python -m venv .venv && pip install fastapi uvicorn anthropic python-dotenv pydantic`
- Create `main.py` with FastAPI app, CORS allowed for `http://localhost:5173`, and a `GET /health` returning `{"ok": true}`.
- Add `.env` with `ANTHROPIC_API_KEY=...`.
- **Checkpoint:** `curl localhost:8000/health` returns `{"ok": true}`.

### B2 — Hardcoded data + static GET endpoints (0:15–0:45)
- Create `data/investor.json`, `data/deals.json`, `data/routepilot.json` with content matching the contract.
- Implement endpoints 1, 2, 3 as pure file reads.
- **Checkpoint:** all three endpoints return valid JSON in `/docs` (Swagger). Frontend can start consuming immediately.

### B3 — Ticket + intro + voice-call endpoints (0:45–1:15)
- In-memory lists for tickets and intro requests at module level.
- Implement endpoints 5, 6, 7. Voice-call returns a **canned** summary object (no AI yet).
- **Checkpoint:** posting to each endpoint returns the contract shape; a second GET (via lead-view stub) shows the new item.

### B4 — Lead view endpoint (1:15–1:30)
- Implement endpoint 8 by aggregating: investor profile + in-memory tickets + last call summary + intro status.
- **Checkpoint:** after posting a ticket + an intro request, lead-view reflects both.

### B5 — Claude integration for `/ask` (1:30–2:10) — **the critical step**
- Build one system prompt that:
  1. Embeds `routepilot.json` as JSON context.
  2. Instructs Claude to answer **only** from that context with source section names.
  3. Instructs Claude to respond as **strict JSON only** with fields `status` (`"answered"` | `"missing_answer"`), `answer`, `sources`, `ticket_suggestion`, `next_actions`. No prose outside JSON.
  4. Forbids investment advice and exposing raw files.
- Call `claude-opus-4-7` (model id `claude-opus-4-7`) via the Anthropic SDK with `max_tokens=600` and `temperature=0`.
- Parse with `json.loads`. Wrap in try/except; on parse failure return `status="missing_answer"` with a generic ticket suggestion.
- **Checkpoint:** ask three questions: (a) one answerable from the data ("what is the round size?") → `answered` with sources; (b) one not in data ("DHL contract exclusivity?") → `missing_answer` with a sensible ticket_suggestion; (c) one adversarial ("should I invest?") → answer never says yes/no.

### B6 — Smoke test the full backend (2:10–2:20)
- Run a 6-call sequence via curl or `/docs`: investor → deals → detail → ask (answered) → ask (missing) → ticket → voice-call → intro-request → lead-view.
- **Checkpoint:** all green. Hand off to demo.

### B7 — Buffer / bug fixes (2:20–2:30)
- Reserved time. Do not add features here. Only fix what frontend reports broken.

---

## 5. Frontend build steps (7 steps, ~2h30)

Frontend starts with **mock JSON files** copied from the contract and a single `apiBase` constant. When the backend goes live, flip the constant. Do not block on backend.

### F1 — Project skeleton + mocks (0:00–0:20)
- `pnpm create vite@latest frontend --template react-ts`, add Tailwind.
- Create `src/mocks/` with `investor.json`, `deals.json`, `routepilot.json` copy-pasted from the contract.
- Create `src/api.ts` with one `fetcher(path)` function. Toggle: `USE_MOCKS = true` to read from `/src/mocks`, else fetch from `http://localhost:8000`.
- Build the app shell: top nav (Deals | Lead View), left investor profile panel (just read from mock), main content slot.
- **Checkpoint:** app loads, investor name and sector tags visible in sidebar.

### F2 — Dashboard with 3 deal cards (0:20–0:50)
- Map `deals.json` → cards. RoutePilot first. Each card shows: name, one-liner, sector pills, stage, round size, lead, DD %, fit score, allocation, days remaining.
- Clicking RoutePilot card routes to `/deals/routepilot`. Other cards can be inert (greyed) or show "coming soon" on click.
- **Checkpoint:** dashboard renders, click navigates.

### F3 — Deal room page (0:50–1:30)
- Single scrollable page reading from `routepilot.json`. Sections in order: header (name, one-liner, round terms card), overview, market, traction grid, financial snapshot row, team cards, lead thesis with open questions, strategic fit panel, diligence status list (color-coded badges), risks list (severity badges).
- Add a fixed-position **"Talk to deal agent"** button bottom-right.
- Add the raw-DD-isolation note near the top: "Original diligence files are protected — ask the Agent for approved answers."
- **Checkpoint:** page scrolls cleanly, all sections visible, no missing-field crashes.

### F4 — Agent side panel (text Q&A + ticket flow) (1:30–2:05)
- Right-side drawer (or right-half overlay) with: message history, input box, send button.
- On submit, POST to `/api/deals/routepilot/ask` with `{ message }`. While loading, show a spinner.
- Render `status: "answered"` with source chips below the answer (each chip shows `label` from sources).
- Render `status: "missing_answer"` with a yellow card containing the AI message + a prominent **"Create VC Ticket"** button. Button POSTs to `/ticket` with the `ticket_suggestion` payload and shows a green confirmation card with the ticket ID.
- **Checkpoint:** with backend live, full Q&A loop works including ticket creation.

### F5 — Voice AI call panel (2:05–2:20)
- A second tab inside the agent drawer, or a button on the deal page: **"Start Voice AI Call"**.
- On click, POST `/voice-call` with `{ topic: "operational risk and pilot evidence" }`. Show a fake 2-second "calling…" state, then render the returned `summary` and `unresolved_items` list.
- Below the summary, show the `next_actions` as buttons: **Request Intro**, **Ask another question**, **Wait for ticket**.
- "Request Intro" POSTs `/intro-request` and shows a confirmation card.
- **Checkpoint:** call → summary → intro request all work end to end.

### F6 — Lead view page (2:20–2:35)
- Route `/lead-view`. GETs `/api/lead-view/routepilot`. Render: investor card, fit score, list of questions asked, open tickets (with status), voice-call summary, intro request status.
- Keep compact. One screen, no scrolling needed.
- **Checkpoint:** after the demo flow on the investor side, switching to Lead View shows everything that just happened.

### F7 — Polish + demo rehearsal (2:35–2:30 buffer)
- Use the buffer earlier in the schedule. By now: walk the demo script twice end-to-end on the projection laptop. Fix only what breaks the demo. No new features.

---

## 6. Coordination rules (read once, follow always)

1. **Contract is frozen at minute 5.** If a field must change, both devs ack in chat before either edits.
2. **Frontend uses mocks until backend B2 checkpoint passes**, then flips `USE_MOCKS = false`. Test one endpoint at a time when flipping.
3. **Commit at every checkpoint.** Small commits = easy revert when a step breaks the demo.
4. **No new dependencies after 1h30.** New packages = surprise bugs.
5. **If something is broken at 2h15, cut it.** The order to cut: voice call panel → lead view → ticket flow. Never cut: dashboard, deal room, text Q&A.

---

## 7. Demo script (~90s)

1. Open dashboard → "Klaus, logistics Mittelstand co-investor. RoutePilot AI ranked first by fit." (10s)
2. Click RoutePilot → scroll the deal room. "Strategic fit, lead thesis, diligence coverage — and notice: I can't open the raw VC files." (20s)
3. Open agent → ask an answerable question → point at sources. Ask one outside the data → "Notice it doesn't hallucinate. It offers a ticket." Click Create Ticket. (25s)
4. Start Voice AI Call → show summary + unresolved items. Click Request Intro. (20s)
5. Switch to Lead View → "The lead now sees a qualified investor with questions, a ticket, a call summary, and an intro request — without burning a discovery call." (15s)
