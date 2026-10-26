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
    ['health|hospital|clinic|disease|medical|public health', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80'],
    ['climate|environment|energy|flood|drought|wildlife', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80'],
    ['business|economy|market|trade|finance|company', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80'],
    ['protest|demonstrat|march|riot|civil unrest|strike|rally', 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80'],
    ['politic|government|election|president|parliament', 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80'],
    ['education|school|university|student|teacher', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80'],
    ['technology|digital|software|artificial intelligence|innovation', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'],
    ['agricultur|farm|food|harvest', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'],
    ['rwanda|kigali|city|urban', 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80'],
    ['community|people|youth|family', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80'],
    ['water|ocean|marine|coast', 'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?auto=format&fit=crop&w=1200&q=80'],
    ['transport|road|traffic|rail|aviation', 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80'],
  ],
  Jobs: [
    ['health|medical|clinic|nurse|doctor', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80'],
    ['agricultur|food|farm', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'],
    ['technology|software|digital|data|engineering', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'],
    ['climate|environment|energy', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80'],
    ['education|research|university|teacher', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80'],
    ['finance|bank|accounting|investment', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80'],
    ['construction|civil|building|architect', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80'],
    ['ngo|humanitarian|development|community', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'],
  ],
  Scholarships: [
    ['research|science|phd|doctoral|laboratory', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80'],
    ['japan|asia|exchange', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80'],
    ['climate|environment', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80'],
    ['health|medical', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80'],
    ['engineering|technology|computer|digital', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'],
    ['africa|african|rwanda|youth', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1200&q=80'],
  ],
  Opportunities: [
    ['ocean|marine|coast', 'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?auto=format&fit=crop&w=1200&q=80'],
    ['energy|solar|power', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80'],
    ['food|agricultur|farm', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'],
    ['women|founder|startup|business|entrepreneur', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80'],
    ['technology|digital|innovation', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'],
    ['youth|community|training|volunteer', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80'],
    ['education|scholarship|student', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'],
  ],
  Events: [
    ['music|concert|festival|creative|performance', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80'],
    ['kigali|community|rwanda', 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80'],
    ['conference|summit|forum|meeting|panel', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80'],
    ['technology|tech|innovation', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'],
    ['sports|football|tournament', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80'],
    ['education|university|student', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1509824227185-9c5a01ceba0d?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80'],
    ['', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80'],
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
  // Jobs: targeted queries keep listings closer to the official providers in the Phase 2 brief.
  { category: 'Jobs', name: 'UN Careers', url: googleNews('site:careers.un.org job vacancy') },
  { category: 'Jobs', name: 'UN Rwanda Jobs', url: googleNews('site:rwanda.un.org/en/jobs Rwanda vacancy') },
  { category: 'Jobs', name: 'World Bank Careers', url: googleNews('site:worldbank.org/ext/en/careers job vacancy') },
  { category: 'Jobs', name: 'African Union Careers', url: googleNews('site:au.int/en/careers vacancy') },
  { category: 'Jobs', name: 'African Development Bank Careers', url: googleNews('site:afdb.org/en/about-us/careers vacancy') },
  { category: 'Jobs', name: 'Rwanda Development Board', url: googleNews('site:rdb.rw jobs careers vacancy') },
  { category: 'Jobs', name: 'Rwanda Public Service Recruitment', url: googleNews('site:recruitment.mifotra.gov.rw vacancy') },
  { category: 'Jobs', name: 'Impactpool', url: googleNews('site:impactpool.org jobs Africa Rwanda') },
  // Scholarships: one query per provider improves discovery and source attribution.
  { category: 'Scholarships', name: 'Chevening Scholarships', url: googleNews('site:chevening.org/scholarships scholarship application') },
  { category: 'Scholarships', name: 'DAAD Scholarships', url: googleNews('site:daad.de/en/studying-in-germany/scholarships scholarship') },
  { category: 'Scholarships', name: 'Erasmus Mundus', url: googleNews('site:erasmus-plus.ec.europa.eu Erasmus Mundus scholarship') },
  { category: 'Scholarships', name: 'Commonwealth Scholarships', url: googleNews('site:cscuk.fcdo.gov.uk scholarship application') },
  { category: 'Scholarships', name: 'Mastercard Foundation', url: googleNews('site:mastercardfdn.org scholarship education') },
  { category: 'Scholarships', name: 'African Union Scholarships', url: googleNews('site:au.int scholarship fellowship education') },
  { category: 'Scholarships', name: 'Study in Japan', url: googleNews('site:studyinjapan.go.jp/en scholarship') },
  { category: 'Scholarships', name: 'EducationUSA', url: googleNews('site:educationusa.state.gov scholarship funding') },
  // Grants, fellowships, training and calls for proposals.
  { category: 'Opportunities', name: 'ReliefWeb opportunities', url: 'https://reliefweb.int/updates/rss.xml' },
  { category: 'Opportunities', name: 'Africa No Filter Opportunity Hub', url: googleNews('site:opportunity.africanofilter.org grant opportunity') },
  { category: 'Opportunities', name: 'YouthConnekt Rwanda', url: googleNews('site:youthconnekt.rw/opportunities opportunity Rwanda') },
  { category: 'Opportunities', name: 'UNECA Opportunities', url: googleNews('site:uneca.org/about/opportunities fellowship grant') },
  { category: 'Opportunities', name: 'UNESCO Youth Grants', url: googleNews('site:unesco.org/en/youth/global-grant-scheme youth grant') },
  { category: 'Opportunities', name: 'Open Opportunities Rwanda', url: googleNews('site:openopportunities.org/opportunities-country/rwanda opportunity') },
  { category: 'Opportunities', name: 'Youth Opportunities', url: googleNews('site:youthopp.yifoss.org/opportunities grant fellowship') },
  { category: 'Opportunities', name: 'UNHCR Rwanda', url: googleNews('site:help.unhcr.org/rwanda opportunity training') },
  // Events: official calendars and established event providers.
  { category: 'Events', name: 'UN Events in Rwanda', url: googleNews('site:rwanda.un.org/en/events') },
  { category: 'Events', name: 'Eventbrite Kigali', url: googleNews('site:eventbrite.com/d/rwanda--kigali-city/kigali event') },
  { category: 'Events', name: 'Visit Rwanda', url: googleNews('site:visitrwanda.com events Kigali Rwanda') },
  { category: 'Events', name: 'Rwanda Convention Bureau', url: googleNews('site:rcb.rw event conference') },
  { category: 'Events', name: 'UNESCO Events', url: googleNews('site:unesco.org/en/events') },
  { category: 'Events', name: 'World Bank Events', url: googleNews('site:worldbank.org/en/events Africa event') },
  { category: 'Events', name: 'African Union Events', url: googleNews('site:au.int event conference') },

  // Additional live feeds expand coverage across East Africa and core public-interest beats.
  { category: 'News', name: 'UN News Africa', url: 'https://news.un.org/feed/subscribe/en/news/region/africa/feed/rss.xml' },
  { category: 'News', name: 'Rwanda news', url: googleNews('Rwanda news Kigali government economy') },
  { category: 'News', name: 'Uganda news', url: googleNews('Uganda news Kampala government economy') },
  { category: 'News', name: 'Kenya news', url: googleNews('Kenya news Nairobi government economy') },
  { category: 'News', name: 'East Africa business', url: googleNews('East Africa business trade investment economy') },
  { category: 'News', name: 'Africa health', url: googleNews('Africa public health WHO health research') },
  { category: 'News', name: 'Africa technology', url: googleNews('Africa technology digital innovation startups') },
  { category: 'News', name: 'Africa climate and agriculture', url: googleNews('Africa climate change agriculture food security') },
  { category: 'News', name: 'Africa education', url: googleNews('Africa education universities students research') },
  { category: 'News', name: 'Africa development', url: googleNews('site:afdb.org OR site:worldbank.org Africa development project') },

  // More verified-employer discovery feeds. Each result keeps its original application URL.
  { category: 'Jobs', name: 'Rwanda jobs and internships', url: googleNews('Rwanda jobs internship vacancy employer') },
  { category: 'Jobs', name: 'East Africa NGO jobs', url: googleNews('East Africa NGO humanitarian jobs vacancy') },
  { category: 'Jobs', name: 'Africa technology jobs', url: googleNews('Africa software technology data jobs vacancy') },
  { category: 'Jobs', name: 'Africa public health jobs', url: googleNews('Africa public health medical jobs vacancy') },
  { category: 'Jobs', name: 'Africa graduate opportunities', url: googleNews('Africa graduate trainee internship programme 2026 2027') },

  // Broader scholarship and funding discovery; eligibility remains on the source page.
  { category: 'Scholarships', name: 'Africa scholarships', url: googleNews('scholarships for African students applications 2026 2027') },
  { category: 'Scholarships', name: 'Graduate research funding', url: googleNews('PhD masters research funding scholarship Africa 2026 2027') },
  { category: 'Scholarships', name: 'University exchange programmes', url: googleNews('African students international exchange scholarship programme') },
  { category: 'Opportunities', name: 'Africa grants and calls', url: googleNews('Africa open grant call for proposals 2026 2027') },
  { category: 'Opportunities', name: 'Youth entrepreneurship opportunities', url: googleNews('Africa youth entrepreneurship accelerator competition funding') },
  { category: 'Opportunities', name: 'Climate and research fellowships', url: googleNews('Africa climate research fellowship application 2026 2027') },
  { category: 'Opportunities', name: 'Humanitarian opportunities', url: googleNews('Africa humanitarian training fellowship volunteer opportunity') },

  // Upcoming event discovery for Kigali and neighbouring countries.
  { category: 'Events', name: 'Kigali conferences and summits', url: googleNews('Kigali Rwanda conference summit October November 2026') },
  { category: 'Events', name: 'Rwanda culture and community events', url: googleNews('Rwanda Kigali festival culture community event 2026') },
  { category: 'Events', name: 'East Africa technology events', url: googleNews('East Africa technology innovation conference event 2026') },
  { category: 'Events', name: 'Africa webinars and workshops', url: googleNews('Africa online webinar workshop registration 2026') },
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
    ['Full-time', /full[ -]?time|permanent position/i],
    ['Contract', /contract|consultant|consultancy/i],
    ['Entry-level', /entry[ -]?level|junior|early career/i],
    ['Volunteering', /volunteer/i],
    ['Engineering', /engineer|engineering/i],
    ['Agriculture', /agriculture|agronom|farming/i],
    ['Sales & Marketing', /sales|marketing|communications/i],
  ],
  Scholarships: [
    ['Fully Funded', /fully funded|full scholarship|tuition and living/i],
    ['Fellowships', /fellowship|fellows/i],
    ['For Africans', /africa|african/i],
    ['Undergraduate', /undergraduate|bachelor|undergrad/i],
    ['Master’s', /master|postgraduate/i],
    ['PhD', /phd|doctoral|doctorate/i],
    ['Research Grants', /research grant|research funding/i],
    ['Partially Funded', /partial scholarship|partial funding|tuition waiver/i],
    ['Europe', /europe|germany|united kingdom|uk scholarship/i],
    ['USA & Canada', /united states|usa|canada|american university/i],
    ['Asia', /japan|china|asia|korea/i],
  ],
  Opportunities: [
    ['Startup Funding & Grants', /grant|funding|seed fund/i],
    ['Accelerators & Incubators', /accelerator|incubator/i],
    ['Competitions & Awards', /competition|award|challenge|prize/i],
    ['Training Courses & Certifications', /training|course|certification|workshop/i],
    ['Fellowships', /fellowship|fellow/i],
    ['Volunteering', /volunteer/i],
    ['Youth Grants', /youth grant|young people grant/i],
    ['Tenders & Calls for Proposals', /tender|call for proposals|request for proposals/i],
    ['Business & Investment', /business|entrepreneur|investment|startup/i],
  ],
  Events: [
    ['Conferences & Summits', /conference|summit|congress|forum/i],
    ['Tech Events', /technology|tech|digital|innovation/i],
    ['Sports Events', /sport|football|tournament/i],
    ['Concerts & Entertainment', /concert|music|film|festival|entertainment/i],
    ['Upcoming Events', /upcoming|register|registration|will take place/i],
    ['Local Announcements', /rwanda|kigali|uganda|kampala|kenya|nairobi/i],
    ['Online Events', /online event|virtual event|webinar/i],
    ['Workshops & Training', /workshop|training session|masterclass/i],
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

function imageFromMarkup(...values) {
  for (const value of values) {
    const markup = asText(value)
    if (!markup) continue
    const match = markup.match(/<(?:img|source)\b[^>]*(?:src|srcset|data-src)\s*=\s*["']([^"']+)["']/i)
    const candidate = match?.[1]?.split(',')[0]?.trim()?.split(/\s+/)[0]
    if (candidate && /^https?:\/\//i.test(candidate) && !/\.(pdf|mp4|mp3|mov)(?:$|\?)/i.test(candidate)) return candidate
  }
  return ''
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
  const feedImage = imageFromFeed(entry['media:thumbnail'], entry['media:content'], entry.enclosure)
  const embeddedImage = imageFromMarkup(entry['content:encoded'], entry.description, entry.summary, entry.content)
  const imageUrl = feedImage || embeddedImage || fallbackImageFor(feed.category, text, id)
  const imageOrigin = feedImage ? 'feed' : embeddedImage ? 'article_markup' : 'topic_fallback'
  const eventStatus = /past event|recap|concluded|held on|took place/i.test(text) ? 'Recent' : 'Upcoming'
  const summary = description.length > 280 ? `${description.slice(0, 277).trimEnd()}...` : description
  const deadlineMatch = text.match(/(?:deadline|apply by|applications? close(?:s)?|closing date|submit by)\s*[:\-]?\s*((?:\d{1,2}[\s/-]+)?(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s,/-]+\d{1,2}(?:,?\s+\d{4})?|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i)

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
    imageOrigin,
    paragraphs: description ? [description] : [],
    sourceUrl: link,
    sourceName,
    sourceHome,
    summaryProvider: 'publisher',
    ...(deadlineMatch ? { deadline: cleanText(deadlineMatch[1]), deadlineConfidence: 'source_text' } : {}),
    lastCheckedAt: new Date().toISOString(),
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
          { role: 'system', content: 'Summarize each supplied source in one factual sentence. Do not add facts. Never infer a deadline, eligibility, funding amount, salary, event date, or application status; use null when the source does not state it. Categorize only among News, Jobs, Scholarships, Opportunities, Events. Return JSON as {"items":[{"id":"...","summary":"...","category":"...","country":"...","topics":["..."],"deadline":"...","eligibility":"..."}]}. Use null for unsupported facts.' },
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

function imageIdentity(value) {
  if (!value) return ''
  try {
    const parsed = new URL(value)
    // Image CDNs often return the same photo with different crop/size query strings.
    return `${parsed.origin}${parsed.pathname}`.toLowerCase()
  } catch {
    return String(value).split('?')[0].toLowerCase()
  }
}

// Preserve publisher-provided images even when multiple stories use the same CDN image.
// Replacing duplicates with unrelated stock photos was the source of misleading story covers.
function assignDistinctStoryImages(items) {
  return items.map((item) => ({
    ...item,
    image: item.image || fallbackImageFor(item.category, `${item.title} ${item.summary || ''}`, item.id),
    imageOrigin: item.imageOrigin || 'topic_fallback',
  }))
}

function isPublicHttpUrl(value) {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return false
    const host = url.hostname.toLowerCase()
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return false
    if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false
    return true
  } catch {
    return false
  }
}

function imageFromArticleHtml(html, pageUrl) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) || []
  for (const tag of metaTags) {
    const property = (tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1] || '').toLowerCase()
    if (!['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src'].includes(property)) continue
    const raw = tag.match(/content\s*=\s*["']([^"']+)["']/i)?.[1]
    if (!raw) continue
    try {
      const imageUrl = new URL(raw.replace(/&amp;/g, '&'), pageUrl).toString()
      if (isPublicHttpUrl(imageUrl) && !/\.(pdf|mp4|mp3|mov)(?:$|\?)/i.test(imageUrl)) return imageUrl
    } catch {}
  }
  return ''
}

async function enrichMissingImagesWithPublisherMetadata(items) {
  // Keep this bounded: feeds can contain hundreds of items, and some publishers block page requests.
  const candidates = items.filter((item) => item.imageOrigin === 'topic_fallback' && isPublicHttpUrl(item.sourceUrl)).slice(0, 100)
  let cursor = 0
  const worker = async () => {
    while (cursor < candidates.length) {
      const item = candidates[cursor++]
      try {
        const response = await fetch(item.sourceUrl, {
          headers: { 'user-agent': 'Briefa/1.0 (+RSS reader; image metadata only)', accept: 'text/html,application/xhtml+xml' },
          signal: AbortSignal.timeout(7000),
          redirect: 'manual',
        })
        if (!response.ok || !/^text\/html|application\/xhtml\+xml/i.test(response.headers.get('content-type') || '')) continue
        const html = (await response.text()).slice(0, 1_000_000)
        const image = imageFromArticleHtml(html, response.url || item.sourceUrl)
        if (image) {
          item.image = image
          item.imageOrigin = 'publisher_og'
        }
      } catch {
        // Leave the topic-matched fallback in place when the publisher page is unavailable.
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(8, candidates.length) }, worker))
  return items
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
    const seenTitles = new Set()
    const seenLinks = new Set()
    const acceptedTitles = []
    const items = results.flatMap((result) => result.items).filter((item) => {
      const key = item.title.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
      let canonicalLink = item.sourceUrl
      try {
        const parsed = new URL(item.sourceUrl)
        parsed.hash = ''
        for (const parameter of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid']) parsed.searchParams.delete(parameter)
        canonicalLink = parsed.toString().replace(/\/$/, '')
      } catch {}
      if (!key || seenTitles.has(key) || seenLinks.has(canonicalLink)) return false

      // Catch syndication variants with near-identical headlines without collapsing short titles.
      const tokens = key.split(' ').filter((token) => token.length > 2)
      const duplicate = tokens.length >= 7 && acceptedTitles.some((existing) => {
        const prior = existing.split(' ').filter((token) => token.length > 2)
        if (prior.length < 7) return false
        const priorSet = new Set(prior)
        const overlap = tokens.filter((token) => priorSet.has(token)).length
        return overlap / Math.min(tokens.length, prior.length) >= 0.88
      })
      if (duplicate) return false
      seenTitles.add(key)
      seenLinks.add(canonicalLink)
      acceptedTitles.push(key)
      return true
    }).sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))
    cachedItems = assignDistinctStoryImages(await enrichMissingImagesWithPublisherMetadata(await enrichWithAI(items)))
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
