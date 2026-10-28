# Briefa feed and performance update — October 27, 2026

- Removed ReliefWeb from configured feeds and public source listings.
- Added Rwanda-focused Igihe and Kigali Today search feeds for news and jobs.
- The homepage lead carousel prioritizes one recent Igihe item and one Kigali Today item when both are available.
- Removed topic-matched stock-photo fallbacks. Original publisher/feed images are used when available; otherwise, source initials and publisher name appear in a branded placeholder, including after image-load failures.
- Feed API requests return cached content promptly and start stale refreshes in the background. AI summaries and publisher Open Graph image discovery now run asynchronously after feed items are published.
- Reduced publisher metadata enrichment to 30 articles per refresh with shorter per-article timeouts.
- Prevented local publisher lead stories and Breaking stories from being repeated in the homepage News cards.
- Added an in-flight request guard and reduced client polling frequency to avoid overlapping requests and unnecessary work.

## Validation
- `node --check frontend/server.js`: passed.
- `npm run build` could not run because the supplied environment does not have complete installed dependencies (`vite: not found`). Browser testing and live-feed checks remain to be completed after `npm ci`.


## Breaking lineup update (October 27, 2026)

- The News > Breaking topic now builds a five-story curated lineup: Kigali Today with an image, Igihe with an image, BBC, Al Jazeera, and a distinct BBC/Al Jazeera story where available.
- Candidate stories are de-duplicated by ID, URL, headline similarity, and overlapping story text, with recent stories preferred.
- Pinned News stories occupy the final slots rather than displacing the lead stories: one pin replaces slot 5; two pins replace slots 4 and 5. Older pinned stories remain eligible.
- If a preferred publisher has no suitable live story, the lineup fills the available slots with recent distinct news rather than showing fewer stories. Publisher/image availability depends on the live feed response.
