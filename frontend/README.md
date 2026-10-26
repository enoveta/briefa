# Briefa

Briefa is a React/Vite editorial frontend backed by a local Node RSS aggregation API. The API pulls current stories from public feeds and search feeds, normalizes them into the five Briefa sections, removes duplicate headlines, and refreshes every 15 minutes.

## Run Locally

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The `dev` command starts Vite and the feed API together. Vite proxies `/api` requests to `http://127.0.0.1:8787`.

## Sources

The initial configured feeds are BBC News Africa, UN News, ReliefWeb, and Google News RSS searches for African jobs, scholarships, opportunities, and events. The Sources page shows the current health of each feed. If a publisher changes or blocks its feed, the API reports it as unavailable and retries on the next refresh.

Every item keeps its original source URL. RSS publisher descriptions are used as summaries by default; the UI explicitly identifies this as publisher-provided text. Preview stories appear only when the feed API cannot be reached.

## Optional AI Summaries

AI enrichment is disabled unless you provide a server-side API key. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`; optionally adjust `OPENAI_MODEL` and `OPENAI_API_URL`. The key is read by the Node API and is never sent to the browser. The API enriches the newest 25 items on each refresh and falls back to publisher descriptions if the provider is unavailable.

## Social Video Sources

The Video Discovery section links to official platform pages. Automated trend collection and embeds are not enabled because TikTok, Instagram, YouTube, Facebook, X, and Snapchat require platform-specific API credentials, approval, or permitted embed access. Add those integrations only after credentials and allowed usage are available.


## Project handoff

Read [`../HANDOFF_FOR_NEXT_AI.md`](../HANDOFF_FOR_NEXT_AI.md) and [`../PHASE2_STATUS.md`](../PHASE2_STATUS.md) before continuing development. Preserve the existing Briefa design and consult the supplied PDFs at the repository root.


## Main project brief and continuation guide

The product requirements and brand reference are included at the repository root. Read `../Brief main overview.pdf`, `../BRIEFA brand.pdf`, `../Briefa Phase 2 (1).pdf`, `../HANDOFF_FOR_NEXT_AI.md`, and `../PHASE2_STATUS.md`. Keep the existing Briefa UI and structure when implementing the next phase.

## Admin content controls update (October 2026)
- The admin content library supports searching/filtering managed and synced feed items, hiding/showing items, and pinning/unpinning stories.
- Pinning now places a story first in the public story list and adds it to the Breaking topic; unpinning removes that priority.
- Admin content and pin changes trigger a same-browser refresh so the public site reflects changes without waiting for the next scheduled feed refresh.
- Current admin edits are stored in browser localStorage, so this is a project-preview workflow for the same browser/device, not yet a multi-admin/server-wide CMS. For production-wide control, move content status and pins into the API/database.

## Admin content library notes

The admin content library includes the live items returned by `/api/stories` after using **Refresh feeds**, plus locally managed listings. Use the category, publication/hidden, and pinned filters to locate items; use the external-link control to preview a listing's source page. Hide/Show and Pin/Unpin are currently stored in this browser's local storage and therefore do not yet provide server-wide moderation across devices or visitors. Do not treat this local-preview dashboard as a production-secure CMS until authenticated server-side content endpoints and shared database persistence are configured.

## Image quality and enhancement

Story images use fixed aspect-ratio containers and `object-fit: cover` to avoid stretching and reduce layout shifts. Admins can replace a managed item's image with a better image URL in the editor. AI image generation for feed stories is an optional server-side capability requiring `OPENAI_API_KEY`; it generates a new image rather than enhancing the existing publisher image, and must be reviewed before use. A dedicated original-vs-enhanced approval workflow and pixel-level enhancement API are not yet implemented in this project version. Never replace a published image without editorial approval.

## Production checklist

- Configure and test `OPENAI_API_KEY` only in the backend environment if AI image generation is required.
- Before public deployment, implement authenticated admin sessions and server-side persistence for hide/show/pin/edit actions; local storage is browser-specific and can be modified by the visitor.
- Configure analytics with a privacy-reviewed server-side analytics service if cross-device visitor reporting is required.
- Run `npm ci`, `npm run lint`, and `npm run build` in `frontend` before deploying.
