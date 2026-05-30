# DealBridge Berlin — Frontend

React + Vite + TypeScript + Tailwind. Investor-side deal intelligence UI for the
RoutePilot AI deal.

## Run

```bash
pnpm install
pnpm dev            # http://localhost:5173
```

By default the app runs on **mock data** (`src/mocks/`), so it works standalone
with no backend or API key.

## Going live (demo)

Start the backend (FastAPI on `:8000`), then run the frontend against it:

```bash
VITE_USE_MOCKS=false pnpm dev
```

- `VITE_USE_MOCKS=false` — fetch from the real backend instead of mocks.
- `VITE_API_BASE_URL` — backend base URL (defaults to `http://localhost:8000`).

The text agent (`/ask`) needs `ANTHROPIC_API_KEY` configured on the backend; the
other endpoints (deals, tickets, voice-call, intro, lead-view) work without it.

## Layout

- `src/api.ts` — single API layer + `USE_MOCKS` toggle. Shapes mirror the backend.
- `src/types.ts` — API contract types (source of truth: `backend/main.py`).
- `src/pages/` — dashboard, deal room, lead view.
- `src/components/` — investor panel, deal card, agent drawer, voice call, badges.

## Demo flow

Dashboard → RoutePilot deal room → Talk to deal agent (ask answerable + outside
question → create ticket) → Voice Call tab → Request Intro → Lead View.

## Checks

```bash
pnpm build   # tsc + vite production build
pnpm lint    # eslint
```
