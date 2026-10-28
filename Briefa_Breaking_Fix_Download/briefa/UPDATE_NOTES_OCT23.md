# Briefa update notes — October 23, 2026

## Changes in this update
- Admin content library now imports items returned by `/api/stories` into the Website content view when the admin refreshes feeds, so feed items can be reviewed alongside manually managed content.
- Existing content IDs are retained so admin publish/hide status can override a matching live feed item in the public frontend.
- Homepage News preview defaults to eight stories, and Site settings offers an 8-story option.
- Removed the extra editorial promo tile that could leave an uneven/blank-looking slot in the News grid.
- Redesigned the homepage tender promo into a navy/cyan vertical list of Open Tenders, Calls for Proposals, and Supplier Opportunities.

## Why Jobs, Scholarships, Opportunities, or Events may show no live items
These category pages display only stories returned by the backend API whose `category` exactly matches the category page. They do not directly scrape websites from the browser. If the API server is stopped, `/api/stories` fails, all feeds fail/return zero matching items, or a publisher's RSS/search feed changes format, the page may show preview content elsewhere but no live results in that category. The server's configured sources are in `frontend/server.js`.

To diagnose locally:
1. Start both the API and frontend using `npm run dev` from `frontend/`.
2. Open `http://localhost:5173/api/stories` and inspect `items`, `sources`, each source `status`/`error`, and `refreshedAt`.
3. In Admin > Sources & sync, click Refresh feeds and check which sources are unavailable.
4. Confirm returned item categories use exactly `Jobs`, `Scholarships`, `Opportunities`, or `Events`.

## Notes
- Admin content, visibility flags, pins, and settings are currently stored in this browser's `localStorage`; this is a single-browser preview, not shared multi-user production administration.
- The build was attempted but cannot complete in the provided environment because the checked-in `node_modules` is missing the platform-specific Rolldown native binding. Run `npm install` in `frontend/`, then `npm run build`.
