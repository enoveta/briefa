# Briefa project guide mapped to the main overview

## Product sections

- **News:** headline-first news, brief summaries, source logo/name, publication time, original URL, country/topic tags, breaking/important/developing labels where justified.
- **Jobs:** employer, location/remote status, job type, field, eligibility/qualifications, deadline, official application link, checked date, and open/closing soon/closed status where the source provides evidence.
- **Scholarships:** study level, destination, subject, eligible nationality, funding details, deadline and official source. Never infer that an award is fully funded.
- **Opportunities:** grants, fellowships, training, competitions and volunteering; extract eligibility, benefits, required documents and deadline only from trusted source text.
- **Events:** event name, confirmed date/time, venue or online status, audience, registration link, and upcoming/recent state. Expire past events from upcoming feeds.

## Main overview features

| Requirement | Current codebase status | Next implementation step |
|---|---|---|
| Five section navigation and responsive UI | Existing UI present | Preserve and regression-test |
| Home feed and category browsing | Existing UI present | Check all category routes and empty states |
| RSS/Atom data collection | Backend implemented for configured feeds | Expand approved feeds only after validating them |
| Automatic refresh every 5–15 minutes | 15-minute backend refresh | Add persistence, retry/backoff and monitoring |
| AI summaries/categorization | Optional server-side enrichment hook | Validate output, show AI label, log failures |
| Importance/trend ranking | Basic normalization/dedup exists; full weighted editorial score is incomplete | Add explainable scoring and minimum publish threshold |
| Cross-source story merging | Headline duplicate filtering exists | Cluster similar stories and show source count |
| Structured listing fields and expiry | Not complete for all feeds | Extract only evidenced facts; expire deadlines/events |
| Global and category search/filtering | Existing UI controls | Verify every filter against live API data |
| Bookmarks/share | Existing UI controls | Test persistence and social share URLs |
| Translation widget | UI includes language selection | Integrate a permitted translation provider; preserve original headline |
| Source directory | Source links are configured in `src/data/sources.js` | Admin-manage source configuration and reliability |
| Admin source/category management | Full persistent management is not implemented | Add authenticated admin and review queue |
| Browser push/email digest | Not production-integrated | Add opt-in, consent, provider and unsubscribe handling |
| Live video directory | Official platform discovery links included; YouTube API hook is optional | Use official APIs and show “Live now” only after confirmed live status |
| AI image generation | Optional server-side image generation hook | Prefer publisher image; check rights, cache generated images and label generated imagery |
| SEO, sitemap, PWA | Basic Vite page metadata; full SSR/PWA not complete | Add clean route metadata, sitemap and PWA if required |
| Accessibility/performance | Existing responsive design | Audit keyboard, focus, contrast, alt text and slow-network behavior |

## Scoring recommendation

Use a deterministic baseline score before AI assistance. Suggested signals:
- freshness and age of the item;
- source trust tier;
- number of independent trusted sources covering the same event;
- confirmed official announcement;
- urgency and public impact;
- country, city and topic relevance;
- velocity of mentions/views where a valid metric exists;
- for listings: employer/provider reliability, international relevance, deadline still open, and funding details explicitly confirmed.

AI may propose tags, concise summaries, and a rationale. Clamp scores to a known range, store a reason, and keep editorial safeguards: breaking and important news should not be hidden by personalization; sensitive, conflicting, or low-confidence claims should be held for human review or marked developing.

## Images

1. Use publisher/feed image metadata when present and permitted.
2. Otherwise use topic-matched fallback imagery.
3. For generated cover art, use a prompt grounded in the actual headline/summary and avoid fabricated identifiable people or misleading documentary depictions.
4. Do not claim an image is a 100% match unless an actual reliable matching mechanism supports that claim.
5. Store image origin and attribution/license metadata where required.

## Live video and short-form video

Current platform directory links are useful discovery links, not proof that a live stream exists. To meet the overview's direct-play requirement:
- use official APIs or allowed embed URLs;
- for YouTube, use the YouTube Data API with a server-side key and query live status explicitly;
- for Twitch/Kick and social platforms, use their official/approved APIs or supported embeds;
- store direct watch URL, platform, channel, title, thumbnail, live status, and checked time;
- if no direct live stream is confirmed, label the link as platform discovery rather than “Live now”;
- respect provider permissions, quotas, and terms. TikTok/Instagram public trend collection is restricted and is not universally available.

## Definition of done

- Every published item has an original source URL and source label.
- Live data and preview/demo content are visibly distinguished.
- The top feed is ranked with explainable signals and duplicate coverage.
- Structured listing details are extracted only when confirmed.
- Expired opportunities/events are archived.
- Direct video links are confirmed by provider data before showing live status.
- Admin review, source controls, error monitoring, and tests exist before production deployment.
- Design and brand are retained.


## Phase 2 implementation update — 2026-10-19

### Source integrations added
The server now polls targeted Google News RSS searches for each provider named in `Briefa Phase 2 (1).pdf`, plus Rwanda-focused Igihe and Kigali Today searches. Provider targets cover UN Careers, UN Rwanda Jobs, World Bank Careers, African Union Careers, AfDB, Rwanda Development Board, Rwanda Public Service Recruitment, Impactpool, Chevening, DAAD, Erasmus Mundus, Commonwealth Scholarships, Mastercard Foundation, Study in Japan, EducationUSA, Africa No Filter, YouthConnekt Rwanda, UNECA, UNESCO Youth Grants, Open Opportunities Rwanda, Youth Opportunities, UNHCR Rwanda, UN Rwanda Events, Eventbrite Kigali, Visit Rwanda, Rwanda Convention Bureau, UNESCO Events and World Bank/AU events.

**Important distinction:** Google News RSS is a discovery feed, not a verified structured job/scholarship database. Each result links to its original article/page. A listing should only be presented as open when the linked source confirms it. Deadline details are displayed only when a date is explicitly found in the source text; otherwise the interface says the deadline was not stated. AI prompts explicitly prohibit inventing deadlines, eligibility, funding, salaries, or event dates.

### Category experience
Jobs, Scholarships, Opportunities and Events now show a category-specific official-source panel with direct provider links. Listing cards display provenance, source-supported deadline/eligibility facts when available, and an explicit original-source link. Brand variables use Briefa Navy `#00225B` and Signal Cyan `#00D7FD` while retaining the existing visual layout and component language.

### Refresh and data reliability
The backend attempts refresh every 15 minutes. Live data depends on network access, upstream feed availability and deployment configuration. Source status is visible in the UI. Event date extraction and expiry still require a structured source or reliable parsing of explicit event dates; never infer an event date from an article publication date.


### Expanded category facets
The category topic controls now include additional job types (full-time, contract, entry-level), scholarship funding/destination facets, opportunity types (fellowships, volunteering, youth grants, tenders), and event formats (online events, workshops). Topic assignment is based on the words found in source headlines/descriptions; a facet should not be treated as verified structured metadata.
