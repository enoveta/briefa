import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { XMLParser } from 'fast-xml-parser'

const port = Number(process.env.API_PORT || 8787)
const refreshInterval = 15 * 60 * 1000
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
const fallbackImages = {
  News: [
    ['health|hospital|clinic|disease', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80'],
    ['climate|environment|energy|flood|drought', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80'],
    ['business|economy|market|trade|finance', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80'],
    ['politic|government|election|president', 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80'],
  ],
  Jobs: [
    ['health|medical|clinic', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80'],
    ['agricultur|food|farm', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'],
    ['technology|software|digital|data', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'],
    ['climate|environment|energy', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80'],
  ],
  Scholarships: [
    ['research|science|phd|doctoral', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80'],
    ['japan|asia|exchange', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80'],
    ['climate|environment', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80'],
    ['health|medical', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80'],
  ],
  Opportunities: [
    ['ocean|marine|coast', 'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?auto=format&fit=crop&w=1200&q=80'],
    ['energy|solar|power', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80'],
    ['food|agricultur|farm', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'],
    ['women|founder|startup|business', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80'],
  ],
  Events: [
    ['music|concert|festival|creative', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80'],
    ['kigali|community|rwanda', 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80'],
    ['conference|summit|forum|meeting', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80'],
    ['technology|tech|innovation', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1509824227185-9c5a01ceba0d?auto=format&fit=crop&w=1200&q=80'],
  ],
}
const googleNews = (query) => `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en&gl=RW&ceid=RW:en`
const feeds = [
  { category: 'News', name: 'BBC News Africa', url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml' },
  { category: 'News', name: 'UN News', url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml' },
  { category: 'News', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { category: 'News', name: 'ReliefWeb', url: 'https://reliefweb.int/updates/rss.xml' },
  { category: 'News', name: 'World Health Organization', url: 'https://www.who.int/rss-feeds/news-english.xml' },
  { category: 'News', name: 'Reuters Africa', url: googleNews('site:reuters.com/world/africa Africa news') },
  { category: 'News', name: 'Rwanda Government', url: googleNews('site:gov.rw Rwanda government news') },
  { category: 'News', name: 'World Bank News', url: googleNews('site:worldbank.org/en/news Africa development') },
  { category: 'Jobs', name: 'Career portals · Africa', url: googleNews('Africa Rwanda jobs careers vacancies UN World Bank African Union AfDB Impactpool') },
  { category: 'Scholarships', name: 'Scholarship providers · Africa', url: googleNews('Africa scholarship Chevening DAAD Erasmus Commonwealth Mastercard African Union Study in Japan EducationUSA') },
  { category: 'Opportunities', name: 'ReliefWeb opportunities', url: 'https://reliefweb.int/updates/rss.xml' },
  { category: 'Opportunities', name: 'Opportunity providers · Africa', url: googleNews('Africa grants fellowships opportunities UNECA UNESCO Rwanda YouthConnect Africa No Filter') },
  { category: 'Events', name: 'Event calendars · Rwanda & Africa', url: googleNews('Rwanda Kigali events conference summit Eventbrite UN UNESCO World Bank African Union') },
]
const topicRules = {
  News: [
    ['Politics & Governance', /politic|government|election|president|parliament|minister/i],
    ['Business & Economy', /business|econom|market|trade|company|finance/i],
    ['Technology & Innovation', /technology|digital|tech|innovation|artificial intelligence|startup/i],
    ['Health & Public Health', /health|hospital|disease|clinic|medical/i],
    ['Education', /education|school|university|student|teacher/i],
    ['Environment & Climate', /climate|environment|weather|energy|flood|drought/i],
    ['Rwanda (Local)', /rwanda|kigali/i],
    ['Africa', /africa|african|uganda|kenya|nigeria|ghana|tanzania|ethiopia/i],
  ],
  Jobs: [
    ['Remote', /remote|work from home/i],
    ['International Organizations (UN, NGOs)', /united nations|\bun\b|ngo|reliefweb|humanitarian|development/i],
    ['Tech & IT', /software|technology|digital|data|engineering/i],
    ['Health & Medical', /health|medical|clinical|nurse|doctor/i],
    ['Education & Research', /education|research|university|teacher/i],
    ['Finance & Banking', /finance|bank|accounting|investment/i],
    ['Government & Public Sector', /government|public sector|ministry/i],
    ['Internships & Graduate Programs', /intern|graduate|trainee/i],
  ],
  Scholarships: [
    ['Fully Funded', /fully funded|full scholarship|tuition and living/i],
    ['Fellowships', /fellowship|fellows/i],
    ['For Africans', /africa|african/i],
    ['Undergraduate', /undergraduate|bachelor|undergrad/i],
    ['Master’s', /master|postgraduate/i],
    ['PhD', /phd|doctoral|doctorate/i],
    ['Research Grants', /research grant|research funding/i],
  ],
  Opportunities: [
    ['Startup Funding & Grants', /grant|funding|seed fund/i],
    ['Accelerators & Incubators', /accelerator|incubator/i],
    ['Competitions & Awards', /competition|award|challenge|prize/i],
    ['Training Courses & Certifications', /training|course|certification|workshop/i],
    ['Business & Investment', /business|entrepreneur|investment|startup/i],
  ],
  Events: [
    ['Conferences & Summits', /conference|summit|congress|forum/i],
    ['Tech Events', /technology|tech|digital|innovation/i],
    ['Sports Events', /sport|football|tournament/i],
    ['Concerts & Entertainment', /concert|music|film|festival|entertainment/i],
    ['Upcoming Events', /upcoming|register|registration|will take place/i],
    ['Local Announcements', /rwanda|kigali|uganda|kampala|kenya|nairobi/i],
  ],
}
const countries = [
  ['Rwanda', /rwanda|kigali/i], ['Uganda', /uganda|kampala/i], ['Kenya', /kenya|nairobi/i],
  ['Nigeria', /nigeria|lagos|abuja/i], ['Ghana', /ghana|accra/i], ['Tanzania', /tanzania|dar es salaam/i],
  ['South Africa', /south africa|johannesburg|cape town/i],
]

let cachedItems = []
let refreshedAt = null
let sourceStatuses = []
let refreshInProgress
let aiStatus = process.env.OPENAI_API_KEY ? 'ready' : 'not_configured'
let trendingVideos = []
let trendingVideosUpdatedAt = 0
let youtubeStatus = process.env.YOUTUBE_API_KEY ? 'ready' : 'not_configured'
const generatedImageDirectory = join(fileURLToPath(new URL('.', import.meta.url)), 'public', 'generated')

function asText(value) {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object') return String(value['#text'] || value['#cdata'] || '')
  return ''
}

function cleanText(value) {
  return asText(value)
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/\s+/g, ' ')
    .trim()
}

function firstValue(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.map(firstValue).find(Boolean)
      if (found) return found
    } else if (value && typeof value === 'object' && value['@_href']) {
      return value['@_href']
    } else {
      const text = cleanText(value)
      if (text) return text
    }
  }
  return ''
}

function imageFromFeed(...values) {
  for (const value of values) {
    const candidates = Array.isArray(value) ? value : [value]
    for (const candidate of candidates) {
      const url = typeof candidate === 'string'
        ? candidate
        : candidate?.['@_url'] || candidate?.['@_href'] || candidate?.['@_src'] || ''
      const type = candidate?.['@_type'] || ''
      if (!/^https?:\/\//i.test(url) || (type && !type.startsWith('image/'))) continue
      if (/\.(pdf|mp4|mp3|mov)(?:$|\?)/i.test(url)) continue
      return url
    }
  }
  return ''
}

function getEntries(xml) {
  const document = parser.parse(xml)
  const rssItems = document.rss?.channel?.item
  const atomEntries = document.feed?.entry
  const entries = rssItems ?? atomEntries ?? []
  return Array.isArray(entries) ? entries : [entries]
}

function countryFor(text) {
  const match = countries
    .map(([country, pattern]) => ({ country, index: pattern.exec(text)?.index ?? -1 }))
    .filter((item) => item.index >= 0)
    .sort((left, right) => left.index - right.index)[0]
  return match?.country || (/africa|african/i.test(text) ? 'Africa' : 'Global')
}

function topicsFor(category, text) {
  const topics = (topicRules[category] || []).filter(([, pattern]) => pattern.test(text)).map(([topic]) => topic)
  return topics.length ? topics : [category === 'News' ? 'Africa' : categoryTopicsFallback(category)]
}

function categoryTopicsFallback(category) {
  return ({ Jobs: 'Remote', Scholarships: 'For Africans', Opportunities: 'Business & Investment', Events: 'Upcoming Events' })[category] || 'Africa'
}

function fallbackImageFor(category, text, id) {
  const choices = fallbackImages[category] || fallbackImages.News
  const matching = choices.find(([keywords]) => keywords && new RegExp(keywords, 'i').test(text))
  const index = Number.parseInt(id.slice(0, 8), 16) % choices.length
  return (matching || choices[index] || choices[choices.length - 1])[1]
}

function normalizeEntry(entry, feed) {
  const title = cleanText(entry.title)
  const link = firstValue(entry.link, entry.guid)
  if (!title || !/^https?:\/\//i.test(link)) return null
  const description = cleanText(firstValue(entry['content:encoded'], entry.description, entry.summary, entry.content))
  const rawDate = firstValue(entry.pubDate, entry.published, entry.updated, entry['dc:date'])
  const parsedDate = rawDate ? new Date(rawDate) : new Date()
  const publishedAt = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString()
  const sourceName = firstValue(entry.source, entry.author, feed.name) || feed.name
  const sourceHome = entry.source?.['@_url'] || new URL(link).origin
  const text = `${title} ${description}`
  const country = countryFor(text)
  const id = createHash('sha256').update(link).digest('hex').slice(0, 18)
  const imageUrl = imageFromFeed(entry['media:thumbnail'], entry['media:content'], entry.enclosure) || fallbackImageFor(feed.category, text, id)
  const eventStatus = /past event|recap|concluded|held on|took place/i.test(text) ? 'Recent' : 'Upcoming'
  const summary = description.length > 280 ? `${description.slice(0, 277).trimEnd()}...` : description

  return {
    id,
    category: feed.category,
    tag: sourceName.toUpperCase(),
    topics: topicsFor(feed.category, text),
    title,
    summary: summary || 'Open the original source for the full report and details.',
    author: sourceName,
    date: new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(parsedDate),
    publishedAt,
    read: sourceName,
    location: country === 'Global' ? 'Africa & the world' : country,
    country,
    image: imageUrl,
    paragraphs: description ? [description] : [],
    sourceUrl: link,
    sourceName,
    sourceHome,
    summaryProvider: 'publisher',
    ...(feed.category === 'Events' ? { eventStatus, region: country === 'Global' || country === 'Africa' ? 'International' : 'Local' } : {}),
  }
}

async function enrichWithAI(items) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || !items.length) {
    aiStatus = 'not_configured'
    return items
  }

  try {
    const batch = items.slice(0, 25)
    const response = await fetch(process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Summarize each supplied source in one factual sentence. Do not add facts. Categorize only among News, Jobs, Scholarships, Opportunities, Events. Return JSON as {"items":[{"id":"...","summary":"...","category":"...","country":"...","topics":["..."],"deadline":"...","eligibility":"..."}]}. Use null for unsupported facts.' },
          { role: 'user', content: JSON.stringify(batch.map(({ id, title, summary, category, country }) => ({ id, title, sourceText: summary, category, country }))) },
        ],
      }),
    })
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`)
    const result = await response.json()
    const content = JSON.parse(result.choices?.[0]?.message?.content || '{}')
    const byId = new Map((Array.isArray(content.items) ? content.items : []).map((item) => [item.id, item]))
    aiStatus = 'ready'
    return items.map((item) => {
      const enriched = byId.get(item.id)
      if (!enriched || typeof enriched.summary !== 'string') return item
      const category = ['News', 'Jobs', 'Scholarships', 'Opportunities', 'Events'].includes(enriched.category) ? enriched.category : item.category
      return {
        ...item,
        category,
        summary: cleanText(enriched.summary).slice(0, 360) || item.summary,
        country: typeof enriched.country === 'string' ? enriched.country : item.country,
        topics: Array.isArray(enriched.topics) ? enriched.topics.filter((topic) => typeof topic === 'string').slice(0, 5) : item.topics,
        deadline: typeof enriched.deadline === 'string' ? cleanText(enriched.deadline) : null,
        eligibility: typeof enriched.eligibility === 'string' ? cleanText(enriched.eligibility) : null,
        summaryProvider: 'ai',
      }
    })
  } catch (error) {
    aiStatus = 'unavailable'
    console.error('AI enrichment failed:', error.message)
    return items
  }
}

function durationSeconds(duration = '') {
  const [, hours = '0', minutes = '0', seconds = '0'] = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) || []
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
}

async function refreshTrendingVideos(force = false) {
  if (!process.env.YOUTUBE_API_KEY) {
    youtubeStatus = 'not_configured'
    return trendingVideos
  }
  if (!force && trendingVideosUpdatedAt && Date.now() - trendingVideosUpdatedAt < refreshInterval) return trendingVideos
  try {
    const url = new URL('https://youtube.googleapis.com/youtube/v3/videos')
    url.search = new URLSearchParams({ part: 'snippet,contentDetails,statistics', chart: 'mostPopular', regionCode: 'RW', maxResults: '50', key: process.env.YOUTUBE_API_KEY }).toString()
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!response.ok) throw new Error(`YouTube API returned ${response.status}`)
    const result = await response.json()
    trendingVideos = (result.items || []).filter((item) => durationSeconds(item.contentDetails?.duration) <= 180).slice(0, 12).map((item) => {
      const id = item.id
      return {
        id,
        title: cleanText(item.snippet?.title) || 'YouTube trending video',
        channelTitle: cleanText(item.snippet?.channelTitle) || 'YouTube',
        viewCount: item.statistics?.viewCount || '0',
        url: `https://www.youtube.com/watch?v=${id}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${id}`,
      }
    })
    trendingVideosUpdatedAt = Date.now()
    youtubeStatus = trendingVideos.length ? 'connected' : 'no_videos'
  } catch (error) {
    youtubeStatus = 'unavailable'
    console.error('YouTube video refresh failed:', error.message)
  }
  return trendingVideos
}

async function generateStoryImage(story) {
  const fileName = `${story.id}.png`
  const filePath = join(generatedImageDirectory, fileName)
  try {
    await readFile(filePath)
    return `/generated/${fileName}`
  } catch {
    const response = await fetch(process.env.OPENAI_IMAGE_API_URL || 'https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
      signal: AbortSignal.timeout(90000),
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
        prompt: `Create a photojournalistic editorial cover photograph for this story. Show a realistic, respectful, contextually relevant scene in Africa when appropriate. No text, logos, watermarks, graphic harm, or invented identifiable people. Story: ${story.title}. Context: ${story.summary.slice(0, 500)}`,
        size: '1024x1024',
        quality: 'low',
      }),
    })
    if (!response.ok) throw new Error(`Image provider returned ${response.status}`)
    const result = await response.json()
    const imageBase64 = result.data?.[0]?.b64_json
    if (!imageBase64) throw new Error('Image provider returned no image data')
    await mkdir(generatedImageDirectory, { recursive: true })
    await writeFile(filePath, Buffer.from(imageBase64, 'base64'))
    return `/generated/${fileName}`
  }
}

async function fetchFeed(feed) {
  const response = await fetch(feed.url, {
    headers: { 'user-agent': 'Briefa/1.0 (+https://briefa.com; public RSS reader)', accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`Feed returned ${response.status}`)
  const xml = await response.text()
  return getEntries(xml).map((entry) => normalizeEntry(entry, feed)).filter(Boolean).slice(0, 30)
}

async function refreshFeeds(force = false) {
  if (!force && refreshedAt && Date.now() - refreshedAt < refreshInterval) return cachedItems
  if (refreshInProgress) return refreshInProgress
  refreshInProgress = (async () => {
    const results = await Promise.all(feeds.map(async (feed) => {
      try {
        const items = await fetchFeed(feed)
        return { feed: feed.name, url: feed.url, items, status: 'ok' }
      } catch (error) {
        return { feed: feed.name, url: feed.url, items: [], status: 'error', error: error.message }
      }
    }))
    const seen = new Set()
    const items = results.flatMap((result) => result.items).filter((item) => {
      const key = item.title.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))
    cachedItems = await enrichWithAI(items)
    sourceStatuses = results.map(({ feed, url, status, error }) => ({ name: feed, url, status, ...(error ? { error } : {}) }))
    refreshedAt = Date.now()
    return cachedItems
  })()
  try {
    return await refreshInProgress
  } finally {
    refreshInProgress = undefined
  }
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-allow-headers': 'content-type' })
    response.end()
    return
  }
  const url = new URL(request.url, 'http://localhost')
  const imageRequest = url.pathname.match(/^\/api\/stories\/([a-f\d]{18})\/image$/i)
  if (request.method === 'POST' && imageRequest) {
    if (!process.env.OPENAI_API_KEY) {
      response.writeHead(503, { 'content-type': 'application/json; charset=utf-8' })
      response.end(JSON.stringify({ error: 'Configure OPENAI_API_KEY to generate AI story images.' }))
      return
    }
    try {
      await refreshFeeds()
      const story = cachedItems.find((item) => item.id === imageRequest[1])
      if (!story) {
        response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' })
        response.end(JSON.stringify({ error: 'Story not found in the current feed.' }))
        return
      }
      const image = await generateStoryImage(story)
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' })
      response.end(JSON.stringify({ image }))
    } catch (error) {
      response.writeHead(502, { 'content-type': 'application/json; charset=utf-8' })
      response.end(JSON.stringify({ error: error.message }))
    }
    return
  }
  if (request.method !== 'GET' || !['/api/stories', '/api/health'].includes(url.pathname)) {
    response.writeHead(404, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  try {
    await refreshFeeds(url.searchParams.get('refresh') === 'true')
    if (url.pathname === '/api/stories') await refreshTrendingVideos()
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': '*' })
    response.end(JSON.stringify({
      items: cachedItems,
      refreshedAt: refreshedAt ? new Date(refreshedAt).toISOString() : null,
      sources: sourceStatuses,
      aiStatus,
      imageGenerationAvailable: Boolean(process.env.OPENAI_API_KEY),
      trendingVideos,
      youtubeStatus,
      categories: ['News', 'Jobs', 'Scholarships', 'Opportunities', 'Events'],
      ...(url.pathname === '/api/health' ? { ok: sourceStatuses.some((source) => source.status === 'ok') } : {}),
    }))
  } catch (error) {
    response.writeHead(502, { 'content-type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify({ error: 'Unable to refresh sources', detail: error.message, items: cachedItems }))
  }
})

server.listen(port, '127.0.0.1', () => console.log(`Briefa feed API listening on http://127.0.0.1:${port}`))
refreshFeeds(true).catch((error) => console.error('Initial feed refresh failed:', error.message))
setInterval(() => refreshFeeds(true).catch((error) => console.error('Scheduled feed refresh failed:', error.message)), refreshInterval).unref()
