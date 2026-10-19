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
