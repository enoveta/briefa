# Rwanda Breaking lineup fix — 28 October 2026

- Fixed Google News RSS source attribution: publisher display names are now read from the source text rather than a serialized object.
- Publisher metadata image lookup prioritizes Kigali Today and Igihe stories before other publishers and follows redirects to the original publisher article, allowing its original Open Graph image to be discovered when available.
- Breaking source matching now considers publisher source home and tag fields as well as source name and URL.
- The frontend performs one lightweight cached-feed refresh after eight seconds so background image enrichment can be reflected in the Breaking carousel without delaying initial page render.
- No unrelated stock/fallback images are introduced. If a publisher does not provide an accessible original image, Briefa keeps its publisher-branded placeholder rather than inventing a photo.

Validation: `node --check frontend/server.js` passed. A full Vite production build was not run because dependencies are not installed in this environment.
