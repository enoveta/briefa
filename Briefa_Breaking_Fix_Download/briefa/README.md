# Briefa — complete project package

Briefa is an editorial discovery platform for **News, Jobs, Scholarships, Opportunities, and Events**, built around the supplied main overview and brand identity. This package continues the existing React/Vite UI and Node.js feed API; it does not replace the established design with a new one.

## Start here

1. Read `Brief main overview.pdf` for the product scope and page requirements.
2. Read `BRIEFA brand.pdf` for the brand palette and visual rules.
3. Read `Briefa Phase 2 (1).pdf` for the planned sources and Phase 2 integration.
4. Read `HANDOFF_FOR_NEXT_AI.md` and `PHASE2_STATUS.md` before continuing work.
5. Run the frontend using the steps below.

## Run locally

Requirements: Node.js 20.19+ or 22.12+ recommended for the current Vite version, plus npm.

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Open `http://localhost:5173`. The development command starts the Vite frontend and the Node API. The API defaults to `http://127.0.0.1:8787`, and Vite proxies `/api` requests to it.

Useful commands:

```bash
npm run dev       # frontend + API
npm run dev:web   # frontend only
npm run dev:api   # API only
npm run build     # production frontend build
npm run preview   # preview production build
npm run lint      # lint source files
```

## Project structure

```text
Briefa/
├── Brief main overview.pdf       # original product overview
├── BRIEFA brand.pdf              # original brand palette
├── Briefa Phase 2 (1).pdf        # Phase 2 sources and integration plan
├── HANDOFF_FOR_NEXT_AI.md        # continuation instructions for another AI
├── PHASE2_STATUS.md              # implemented vs. remaining work
├── PROJECT_GUIDE.md              # detailed scope and operating notes
└── frontend/
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    ├── server.js                 # RSS API, refresh, enrichment, image/video hooks
    ├── .env.example
    ├── public/
    └── src/
        ├── App.jsx                # existing UI and routing
        ├── App.css                # existing design styles
        ├── index.css
        ├── main.jsx
        ├── assets/
        └── data/sources.js        # approved source directory and video links
```

## Brand and design guardrails

- Keep the current page structure, navigation, layout, card design, typography, interactions, and responsive behavior.
- Brand colors: Briefa Navy `#00225B` and Signal Cyan `#00D7FD`.
- Navy is the core text/navigation/interface color; cyan is for highlights, links, selected states, and live indicators.
- Do not redesign or replace the logo unless explicitly requested.
- Content is metadata-first: headline, short summary, source attribution, publish/updated date, tags, and link to the original source.

## Phase 2 data behavior

The current backend collects RSS/Atom feeds and Google News RSS search results, normalizes entries into Briefa sections, de-duplicates by headline, enriches selected items using optional server-side AI, selects a source image or topic-matched fallback, and refreshes on a 15-minute schedule. The API exposes `/api/stories` and `/api/health`.

The feed registry has been expanded to 65 configured sources/search feeds based on `Briefa Phase 2 (1).pdf`: the original official-source list plus additional Rwanda, Uganda, Kenya, East Africa, topic-specific news, jobs, scholarships, grants, and events searches. Search feeds retain the original publisher/application URL on each item. Headline de-duplication also checks canonical links and cautiously filters near-identical syndicated headlines. This is a discovery layer, not a guarantee that every configured source is reachable at all times.

Feed results are dependent on upstream availability and network access. Search feeds can surface announcements rather than structured job or scholarship records. Do not invent deadline, eligibility, funding amount, event date, salary, location, or application status. If the source does not state a fact, show “Not stated” and link to the official page. Preview/fallback content must not be presented as current sourced content.

## Security

- Never commit `.env`, API keys, private tokens, or user data.
- Keep AI and video-provider API keys on the server only.
- Respect source copyright, robots.txt, API quotas, terms of service, and image licensing.
- Avoid public arbitrary-URL fetch endpoints and validate/sanitize source content.
- For production, add rate limits, persistent storage, monitoring, and an admin authentication model.

## Current limitations

This package is a working source-code base, not a claim that every requirement in the overview has already been production-implemented. In particular, a full database-backed admin dashboard, human review queue, push/email alerts, provider-wide live stream detection, comprehensive structured listing extraction, and automated tests/deployment monitoring remain follow-up work. See `PHASE2_STATUS.md` for a transparent checklist.

## Admin content controls update (October 2026)
- The admin content library supports searching/filtering managed and synced feed items, hiding/showing items, and pinning/unpinning stories.
- Pinning now places a story first in the public story list and adds it to the Breaking topic; unpinning removes that priority.
- Admin content and pin changes trigger a same-browser refresh so the public site reflects changes without waiting for the next scheduled feed refresh.
- Current admin edits are stored in browser localStorage, so this is a project-preview workflow for the same browser/device, not yet a multi-admin/server-wide CMS. For production-wide control, move content status and pins into the API/database.
