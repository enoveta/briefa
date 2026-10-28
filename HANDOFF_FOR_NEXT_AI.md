# BRIEFA — Phase 2 handoff for the next AI/developer

**Purpose:** Continue the existing Briefa project, preserving the existing design and brand. Do not redesign the UI unless explicitly asked. This file is the project handoff/context file intended to be given to another AI or developer.

## Read these first
1. `Brief main overview.pdf` — product requirements and page/category behavior.
2. `BRIEFA brand.pdf` — official palette and visual direction.
3. `Briefa Phase 2 (1).pdf` — real-data integration plan.
4. `frontend/src/App.jsx` and `frontend/src/App.css` — current UI/design and routing.
5. `frontend/server.js` — RSS collection, normalization, ranking/enrichment and API.
6. `frontend/src/data/sources.js` — source directory and direct platform links.
7. `frontend/README.md` and `.env.example` — run instructions and configuration.

## Product identity and design constraints
- Product: **Briefa / Global Trends Hub**.
- Brand palette from the supplied brand PDF: Briefa Navy `#00225B`, Signal Cyan `#00D7FD`. Keep the current logo, layout, typography, spacing, card language, navigation, and responsive behavior. Use these two brand colors as the core identity.
- Five sections: News, Jobs, Scholarships, Opportunities, Events.
- English default; current UI includes language choices and theme support.
- Headline-first editorial product: short summaries, source attribution, and links to original sources. Do not republish full articles or full job descriptions.
- Every content item should link to the original/official source. Do not invent deadlines, eligibility, event dates, salary/funding amounts, or “verified” status.

## Current Phase 2 implementation
- React 19 + Vite frontend; Node HTTP API in `frontend/server.js`.
- `npm run dev` starts API and web frontend together; Vite proxies `/api` to `127.0.0.1:8787`.
- Backend uses `fast-xml-parser` to ingest RSS/Atom feeds and normalizes items into the five sections.
- Configured feeds include BBC News Africa, UN News, Al Jazeera, WHO, Igihe, and Kigali Today, and Google News RSS searches for official/established sources and Africa/Rwanda-related jobs, scholarships, opportunities, and events.
- Backend has duplicate handling, topic/country tagging, source status reporting, scheduled refresh (15 minutes), image selection based on feed metadata and topic-specific fallback images, and optional AI enrichment.
- UI includes category pages, search/filtering, saved items, source directory, refresh/status UI, and video/live platform discovery links. Review current code before changing functionality; preserve existing implementation.
- AI enrichment is optional and server-side. The browser must never receive an API key.
- Live/social video links are discovery/direct platform links. Actual per-channel live detection, guaranteed playable stream URLs, and trend ingestion need official API access and platform-specific permissions. Do not label a general platform landing page as a confirmed live stream.
- Existing RSS/search-feed results are real feed-derived headlines when feeds are available. If feed access fails, the UI can show preview/seed stories. Never present those preview stories as current real news. Keep fallback behavior visibly distinguishable from live sourced content.

## Important honesty / production gaps to work on next
1. **Structured listings:** Google News RSS queries can surface job/scholarship/opportunity/event announcements, but are not a reliable structured database of individual listings. For each listing, extract and show deadline, location, eligibility, funding and event date only when the source clearly supplies them; otherwise say “Not stated” and link to the official source. Prefer official RSS/API/approved feeds and mark the date last checked.
2. **AI ranking:** Use a transparent deterministic score as baseline (freshness, source trust, multi-source corroboration, country/topic relevance, urgency, deadline proximity, duplicate cluster size). Let AI suggest summary/tags and optionally a score rationale, but clamp/validate its output and never let AI alone override breaking/important editorial safeguards. Low-confidence/sensitive items should go to review or be clearly labeled developing.
3. **Image matching:** Prefer the source’s own Open Graph/RSS image where permitted. If unavailable, use keyword/topic-matched fallbacks; avoid claiming an image is “100% related” unless a reliable matching signal exists. Consider image search/provider APIs only with a compliant key and attribution/usage checks. Never scrape arbitrary images without checking rights.
4. **Events:** Distinguish upcoming from recent; calculate countdown only when a confirmed date/time exists. Expire past events.
5. **Lifecycle:** Archive expired jobs/scholarships/opportunities and past events; remove old news from the main feed after 24–48 hours; check broken links periodically.
6. **Admin panel:** The brief calls for managing approved sources/categories and reviewing low-confidence content. Check current implementation and complete any missing admin controls before production.
7. **Translation:** Ensure Google Translate or another permitted translation integration works and always preserve the original headline/source alongside translated text.
8. **Privacy/security:** Validate and sanitize feed data, rate-limit refresh/report endpoints, prevent arbitrary URL fetching through public endpoints, keep keys in `.env`, and add deployment/security notes.
9. **Testing:** Add tests for feed normalization, duplicate detection, ranking, deadline expiration, link validation, and failed feeds. Run `npm run build` and `npm run lint`.

## Environment setup
From the `frontend` directory:
```bash
npm install
cp .env.example .env
npm run dev
```
On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.
The app is expected at `http://localhost:5173`; API defaults to port `8787`.

Optional variables are documented in `frontend/.env.example`. Configure `OPENAI_API_KEY` only on the server for AI enrichment. YouTube API credentials, if used, should also remain server-side. Never commit `.env` or credentials.

## Live video/direct-link requirements
The source directory in `frontend/src/data/sources.js` includes links to YouTube Live, TikTok LIVE, Facebook Watch/Live, Twitch, Kick, and short-video discovery pages. To provide a “click and start watching” experience:
- Store direct video/watch URLs or official channel live URLs, not only platform homepages/search pages.
- For YouTube, use the official YouTube Data API (e.g. search for currently live videos) with a server-side API key and comply with quotas/terms; only show streams returned as currently live.
- For other platforms, use their official APIs or supported embeds and only where access is permitted. Do not fabricate video IDs or infer a stream is live from a creator page.
- Show “Live now” only when the platform/API confirms it. Provide a fallback link to the official channel/platform when a live URL cannot be confirmed.

## Definition of done for the next phase
- Keep visual design and brand intact.
- Feed status clearly differentiates current source data from preview/demo data.
- Search and filters work across all five sections.
- Listing facts have provenance and explicit unknown states rather than guessed data.
- AI scoring is explainable and never suppresses breaking/important updates.
- Duplicate stories are merged and source coverage is shown where available.
- Expired listings/events are hidden or archived correctly.
- Images are relevant, source-provided where possible, and rights-aware.
- Live streams link directly to confirmed playable streams when APIs permit.
- Setup docs, tests, deployment steps, and a changelog are maintained.

## Instruction to the next AI
Continue from the files in this repository. First inspect the PDFs and current source code; then make small, testable changes in place. Preserve the current design. Do not rebuild the project from scratch, fabricate “live” content, claim an API integration works without testing it, or add secrets to the repository. Record what changed and what remains incomplete in `PHASE2_STATUS.md`.


## Update added 2026-10-19
- Added provider-specific RSS discovery queries for the job, scholarship, opportunity and event providers listed in the Phase 2 PDF.
- Added direct official-source panels on each non-news category page.
- Added listing provenance and source-text-only deadline/eligibility display.
- Updated the primary cyan token to the official Signal Cyan `#00D7FD`.
- Do next: implement robust structured adapters/APIs per provider, tests for expiration and date parsing, richer filters (work mode/type/field, study level/destination/funding, opportunity type, event format/date), admin source controls, and real API-backed AI ranking. Do not claim a search-feed result is a verified open listing.
