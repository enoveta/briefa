# Briefa Phase 2 status — project snapshot

## Package contents
- Existing React/Vite frontend and styling retained.
- Existing Node.js RSS/Atom aggregation API retained.
- Original main overview, brand identity PDF, and Phase 2 source plan included.
- `README.md` and `PROJECT_GUIDE.md` map the main overview to current implementation and remaining tasks.
- `HANDOFF_FOR_NEXT_AI.md` provides continuation instructions.

## Implemented in the supplied source code
- Five-section UI: News, Jobs, Scholarships, Opportunities, Events.
- Existing navigation, responsive layout, category browsing, search/filter controls, bookmarks/share controls, source directory and video discovery UI.
- RSS/Atom source collection and Google News RSS search feeds.
- 15-minute scheduled feed refresh.
- Normalization, basic headline deduplication, topic tags and image fallbacks.
- Optional server-side AI enrichment and image generation hooks.
- Optional YouTube trending-video hook; platform directory links for other video services.

## Partially implemented / requires validation
- Search, filters, bookmarks and share flows need end-to-end testing against live data.
- Feed availability depends on upstream sites and network access.
- Listing records may be article/search-feed results rather than fully structured open vacancies or awards.
- AI summaries and image generation require valid server-side credentials.
- Source directory links are present, but a database-backed source-management admin is not complete.
- Live video discovery links are not the same as confirmed direct live streams.

## Remaining for full production alignment with the overview
- Explainable editorial ranking with trend velocity, source trust, corroboration, urgency, relevance and deadline signals.
- Cross-source story clustering and “Covered by X sources” display.
- Verified extraction of eligibility, funding, location, event dates and deadlines.
- Automated expiry/archiving and broken-link monitoring.
- Human review queue and authenticated admin source/category controls.
- Reliable translation integration, push alerts, email digest and optional preferences.
- Provider-approved direct live-stream APIs/embeds and platform-specific permission checks.
- Full accessibility/performance/SEO/PWA audit, automated tests, database/persistence and deployment monitoring.

## Truthfulness requirements
Do not invent current listings, eligibility, deadlines, funding, salary, event dates, live status, or image relevance. Keep every card linked to the original source. Mark unknown fields as “Not stated”; show source/last-checked status where possible. Breaking and Important items must not be hidden by personalization.


## 2026-10-19 enhancement pass
- Added targeted provider discovery feeds for the providers listed in the Phase 2 brief.
- Added official source cards and source links to category pages.
- Added explicit source provenance and conservative deadline display.
- Applied the exact Signal Cyan brand token.
- Not yet complete: provider-specific structured APIs, comprehensive category-specific filter controls, verified listing status/expiry, admin panel completion, and automated tests. This package should be built and tested before deployment.


## Latest content expansion (2026-10-20)

- Expanded `frontend/server.js` to 65 configured feed/search endpoints, including regional East African news and topic-specific discovery for jobs, scholarships, grants, and events, following the sources listed in `Briefa Phase 2 (1).pdf`.
- Improved duplicate filtering using normalized headlines, canonicalized source links, and cautious near-identical headline matching.
- Each result continues to retain its source URL so users can verify details and apply through the original provider.
- Verification: `node --check frontend/server.js` passed. A full Vite build could not be completed in this environment because dependency installation did not finish, so `node_modules` is not included in the ZIP.


## Image relevance correction (2026-10-20)

- RSS/media thumbnails and image markup supplied by publishers are preserved; duplicate image URLs are no longer replaced with unrelated stock photos.
- When a story has no image in its feed, the API makes a bounded, concurrency-limited request to the article page and checks Open Graph/Twitter image metadata (`og:image`, `twitter:image`).
- If the publisher exposes no usable image, a topic-keyword fallback is used, including a dedicated protest/demonstration match. `imageOrigin` records whether the image came from the feed, embedded article markup, publisher metadata, or a topic fallback.
- Publisher metadata fetching is limited to 100 candidate items per refresh, uses timeouts, restricts protocols to HTTP(S), rejects obvious private/local hostnames, and does not follow redirects.
- Build verification: `node --check frontend/server.js` passes. `npm run build` could not run because dependencies are not installed in this environment; run `npm install` then `npm run build` locally.

## UI update — 2026-10-21
- Refined homepage opportunity sections with distinct layouts for Jobs, Scholarships, and Opportunities using Briefa navy `#00225B` and Signal Cyan `#00D7FD` as core identity colors.
- Jobs homepage cards are now compact, logo/monogram-led cards in two parallel vertical columns, with a prominent tender discovery panel.
- Added `/category/jobs/tenders`, which displays source-matched tender/call-for-proposal items from the current opportunity feed and official provider links. It refreshes with the existing feed lifecycle; it does not fabricate notices when none are available.
- News homepage section now presents up to seven feed items and links to the news page. The news category starts with seven stories and offers a Read More action when additional feed stories exist.
- Added Rwanda/Africa/World news entry points using available source metadata and topic tags. Coverage counts depend on the actual connected feeds; the interface does not invent regional stories to meet a quota.
- Events retain source/feed imagery through existing story-card rendering.
- Build verification remains blocked in this environment because the uploaded `node_modules` is missing Vite/Rolldown's native optional binding. Run `npm ci` in `frontend` in a normal network-enabled development environment, then `npm run build` and `npm run lint`.
