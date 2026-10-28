# Briefa homepage reliability and Breaking lineup update — October 28, 2026

## Changes
- Removed bundled sample/seed stories from the live homepage and category rendering paths. This also removes the unrelated Unsplash photos previously used as fallback story images. Live stories now use publisher-provided images, or the existing publisher-branded initials placeholder when no original image is available or the image fails.
- Added a 12-second client feed request timeout so a stalled request does not leave the interface waiting indefinitely; previously loaded content is retained if a refresh fails.
- Reduced the API story payload by limiting retained recent stories per category (News 120; Jobs 70; Scholarships, Opportunities, and Events 50 each) to lower client-side filtering/rendering cost.
- Reduced background publisher-page image discovery to at most 12 stories and three concurrent workers per refresh.
- Tightened server-side duplicate headline filtering to catch more syndicated copies.
- Updated Breaking lineup to prioritize, in order, an image-bearing Kigali Today story, an image-bearing Igihe story, BBC, Al Jazeera, then BBC/Al Jazeera; distinct recent stories fill any unavailable slots. Pins occupy the end slots (one pin replaces slot 5; two pins replace slots 4 and 5), and duplicate pinned stories are ignored.
- Changed feed status wording so unavailable feeds are not described as preview mode.

## Verification
- `node --check frontend/server.js`: passed.
- `npm run build`: could not run because frontend dependencies are not installed in this environment (`vite: not found`).
- Live RSS/image availability and browser navigation responsiveness still require runtime verification after `npm ci`.
