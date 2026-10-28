# Briefa homepage news update

## Changes
- The homepage News grid requests eight stories and uses a four-column desktop grid (four cards per row), two columns on medium screens, and one column on narrow mobile screens.
- News selection now removes duplicate IDs, canonical duplicate source URLs, and strongly overlapping headlines. The headline comparison uses normalized word overlap so syndicated reports with slightly different headlines are less likely to repeat.
- The grid fills from non-breaking news first, then uses unique Breaking-tagged stories as a fallback if fewer than eight regular news items are available. The existing lead/breaking feature remains in place.
- Live publisher images now take precedence over locally generated image overrides, so the story image supplied by the source feed is retained whenever present. Generated images are only used when a feed item has no image.

## Notes
- Deduplication is heuristic. It reduces duplicate coverage but cannot guarantee that two differently worded reports describe the same event, or that every genuinely distinct report is retained.
- If a publisher feed provides no image, the story may still have no source image; this change does not invent or substitute a misleading image.
- Dependency installation was attempted with `npm ci --ignore-scripts --no-audit --no-fund` but timed out in this environment, so a production build and browser verification could not be completed here.

## Run locally
From `frontend/`, run `npm ci`, then `npm run dev`. Review the homepage and inspect the story feed to verify that publisher-provided image URLs are present.
