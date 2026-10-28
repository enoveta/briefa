import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, CalendarDays, Check, ChevronDown, ChevronRight, Globe2, MapPin, Menu, Moon, Play, RefreshCw, Search, SlidersHorizontal, Sun, Tag, WandSparkles, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import briefaLogo from '../../BRIEF Logo.png'
import { livePlatformLinks, sourceGroups, sourcesForCategory, trendingVideoPlatforms } from './data/sources.js'
import './App.css'
import AdminDashboard from './AdminDashboard.jsx'

const categories = ['News', 'Jobs', 'Scholarships', 'Opportunities', 'Events']

// Shared story normalization and similarity helpers used by homepage deduplication.
const normalizeHeadline = (value = '') => String(value)
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/https?:\/\/\S+/g, ' ')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\b(the|a|an|and|or|of|for|to|in|on|at|by|with|from|is|are|was|were|how|what|why|who|new|latest)\b/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const headlineSimilarity = (left = '', right = '') => {
  const a = new Set(normalizeHeadline(left).split(' ').filter(Boolean));
  const b = new Set(normalizeHeadline(right).split(' ').filter(Boolean));
  if (!a.size || !b.size) return false;
  const overlap = [...a].filter((word) => b.has(word)).length;
  const similarity = overlap / (a.size + b.size - overlap);
  const shorter = Math.min(a.size, b.size);
  const containment = shorter ? overlap / shorter : 0;
  return similarity >= 0.72 || (shorter >= 4 && containment >= 0.88);
};
const LocaleContext = createContext({ locale: 'en', setLocale: () => {}, theme: 'light', setTheme: () => {} })
const localeNames = { en: 'en', fr: 'fr-FR', rw: 'rw-RW' }
const interfaceCopy = {
  en: { slogan: 'INDEPENDENT. INFORMED. AFRICAN.', letter: 'The Briefa letter', subscribe: 'Subscribe', about: 'About', saved: 'Saved', search: 'Search Briefa', sources: 'Sources', explore: 'EXPLORE', brand: 'BRIEFA', nav: ['News', 'Jobs', 'Scholarships', 'Opportunities', 'Events'], language: 'Language', dark: 'Switch to dark mode', light: 'Switch to light mode' },
  fr: { slogan: 'INDÉPENDANT. INFORMÉ. AFRICAIN.', letter: 'La lettre Briefa', subscribe: 'S’abonner', about: 'À propos', saved: 'Enregistrés', search: 'Rechercher sur Briefa', sources: 'Sources', explore: 'EXPLORER', brand: 'BRIEFA', nav: ['Actualités', 'Emplois', 'Bourses', 'Opportunités', 'Événements'], language: 'Langue', dark: 'Activer le mode sombre', light: 'Activer le mode clair' },
  rw: { slogan: 'YIGENGA. YIZEWE. NYAFURIKA.', letter: 'Ibaruwa ya Briefa', subscribe: 'Iyandikishe', about: 'Ibyerekeye', saved: 'Byabitswe', search: 'Shakisha kuri Briefa', sources: 'Aho amakuru aturuka', explore: 'SHAKISHA', brand: 'BRIEFA', nav: ['Amakuru', 'Imirimo', 'Buruse', 'Amahirwe', 'Ibirori'], language: 'Ururimi', dark: 'Koresha ibara ryijimye', light: 'Koresha ibara ryerurutse' },
}
const categoryTopics = {
  News: ['Breaking', 'Trending Now', 'Rwanda (Local)', 'Africa', 'World', 'Politics & Governance', 'Business & Economy', 'Finance & Markets', 'Technology & Innovation', 'Startups', 'Science & Research', 'Environment & Climate', 'Agriculture & Food', 'Energy', 'Health & Public Health', 'Education', 'Crime', 'Justice & Public Safety', 'Security & Conflict', 'Sports', 'Entertainment & Culture', 'Travel & Tourism', 'Community & Human Interest'],
  Jobs: ['Remote', 'International Organizations (UN, NGOs)', 'Government & Public Sector', 'Tech & IT', 'Finance & Banking', 'Health & Medical', 'Engineering', 'Education & Research', 'Agriculture', 'Sales & Marketing', 'Media & Communications', 'Internships & Graduate Programs', 'Volunteering', 'Full-time', 'Contract', 'Entry-level'],
  Scholarships: ['Undergraduate', 'Master’s', 'PhD', 'Fully Funded', 'Partially Funded', 'Fellowships', 'Exchange Programs', 'Research Grants', 'For Africans', 'Europe', 'USA & Canada', 'Asia', 'Africa', 'Partially Funded', 'Online Study'],
  Opportunities: ['Business & Investment', 'Startup Funding & Grants', 'Accelerators & Incubators', 'Competitions & Awards', 'Hackathons', 'Tenders & Calls for Proposals', 'Training Courses & Certifications', 'Fellowships', 'Volunteering', 'Youth Grants'],
  Events: ['Upcoming Events', 'Local Announcements', 'International Announcements', 'Government & Institutional Notices', 'Emergency & Public Safety Alerts', 'Public Holidays & Important Dates', 'Elections', 'Exam Results & School Calendars', 'Conferences & Summits', 'Tech Events', 'Sports Events', 'Concerts & Entertainment', 'Commemorations & Anniversaries', 'Online Events', 'Workshops & Training'],
}
const SavedContext = createContext({ saved: [], toggleSaved: () => {} })
const StoriesContext = createContext({ stories: [], sources: [], refreshedAt: null, aiStatus: 'not_configured', imageGenerationAvailable: false, trendingVideos: [], loading: true, error: '', refreshing: false, refresh: () => {}, generateStoryImage: async () => {} })

function useStories() {
  return useContext(StoriesContext)
}

function readSaved() {
  try { return JSON.parse(localStorage.getItem('briefa-saved') || '[]') } catch { return [] }
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Header() {
  const { saved } = useContext(SavedContext)
  const { locale, setLocale, theme, setTheme } = useContext(LocaleContext)
  const copy = interfaceCopy[locale]
  const [now, setNow] = useState(() => new Date())
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])
  const currentDate = new Intl.DateTimeFormat(localeNames[locale], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(now)
  const currentTime = new Intl.DateTimeFormat(localeNames[locale], { hour: '2-digit', minute: '2-digit' }).format(now)
  const submitSearch = (event) => {
    event.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    setSearchOpen(false)
    setMenuOpen(false)
  }

  return (
    <>
      <div className="topline"><span className="utility-slogan">{copy.slogan}</span><time className="utility-clock" dateTime={now.toISOString()}><span>{currentDate}</span><i>·</i><span>{currentTime}</span></time><div className="utility-actions"><a className="utility-letter" href="#newsletter">{copy.letter}</a><label className="language-control"><Globe2 size={12} /><span className="sr-only">{copy.language}</span><select aria-label={copy.language} value={locale} onChange={(event) => setLocale(event.target.value)}><option value="en">EN</option><option value="fr">FR</option><option value="rw">RW</option></select></label><button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? copy.dark : copy.light} title={theme === 'light' ? copy.dark : copy.light}>{theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}</button></div></div>
      <header className="site-header">
        <button className="icon-button menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
        <Link to="/" className="logo-link" aria-label="Briefa home"><img src={briefaLogo} alt="" className="brand-logo" /></Link>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          {categories.map((category, index) => <Link key={category} onClick={() => setMenuOpen(false)} to={`/category/${category.toLowerCase()}`}>{copy.nav[index]}</Link>)}
          <Link className="nav-about" onClick={() => setMenuOpen(false)} to="/about">{copy.about}</Link>
        </nav>
        <div className="header-actions">
          <button className="icon-button search-toggle" aria-label={copy.search} onClick={() => setSearchOpen(!searchOpen)}>{searchOpen ? <X size={18} /> : <Search size={18} />}</button>
          <Link className="live-button" to="/live"><span className="live-dot" aria-hidden="true" /><span>Live</span></Link>
          <Link className="saved-link" to="/saved"><Bookmark size={15} /> <span>{copy.saved}</span>{saved.length > 0 && <b>{saved.length}</b>}</Link>
          <a className="subscribe-button" href="#newsletter">{copy.subscribe} <ArrowUpRight size={14} /></a>
        </div>
      </header>
      <AnimatePresence>
        {searchOpen && <motion.form className="search-panel" onSubmit={submitSearch} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          <Search size={19} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stories, jobs, opportunities..." aria-label="Search stories" /><button type="submit">Search <ArrowRight size={15} /></button>
        </motion.form>}
      </AnimatePresence>
    </>
  )
}

function Footer() {
  return <footer className="site-footer"><div className="footer-main"><div><Link to="/" className="logo-link footer-logo-link" aria-label="Briefa home"><img src={briefaLogo} alt="" className="brand-logo" /></Link><p>Good information moves us forward.</p></div><div className="footer-links"><div><span>EXPLORE</span>{categories.map((category) => <Link key={category} to={`/category/${category.toLowerCase()}`}>{category === 'Events' ? 'Events & Announcements' : category}</Link>)}</div><div><span>BRIEFA</span><Link to="/about">About us</Link><Link to="/sources">Sources</Link><a href="#newsletter">The Briefa letter</a><a href="mailto:hello@briefa.com">Contact</a></div></div></div><div className="footer-bottom"><span>© 2026 Briefa Media. All rights reserved.</span><span>Stories worth your time. Opportunities worth your attention.</span></div></footer>
}

function SaveButton({ story }) {
  const { saved, toggleSaved } = useContext(SavedContext)
  const isSaved = saved.includes(story.id)
  return <button className={`save-button ${isSaved ? 'is-saved' : ''}`} onClick={() => toggleSaved(story.id)} aria-label={isSaved ? 'Remove from saved stories' : 'Save story'} title={isSaved ? 'Remove from saved stories' : 'Save story'}>{isSaved ? <Check size={15} /> : <Bookmark size={15} />}</button>
}

const POPULAR_STORAGE_KEY = 'briefa-story-clicks-v1'
function recordStoryClick(storyId) {
  try {
    const now = Date.now()
    const existing = JSON.parse(localStorage.getItem(POPULAR_STORAGE_KEY) || '{}')
    const recent = (Array.isArray(existing[storyId]) ? existing[storyId] : []).filter((stamp) => now - stamp < 48 * 60 * 60 * 1000)
    recent.push(now)
    existing[storyId] = recent
    localStorage.setItem(POPULAR_STORAGE_KEY, JSON.stringify(existing))
  } catch { /* Popularity tracking is optional when storage is unavailable. */ }
}
function storyClickProps(storyId) { return { onClick: () => recordStoryClick(storyId) } }

function publisherInitials(story) { const label = story?.sourceName || story?.author || story?.tag || 'Briefa'; return String(label).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'B' }
function PublisherImage({ story, className = '', loading = 'lazy' }) { const [failed, setFailed] = useState(false); const initials = publisherInitials(story); if (!story?.image || failed) return <span className={`publisher-image-placeholder ${className}`} role="img" aria-label={`${story?.sourceName || story?.author || 'Publisher'} image unavailable`}><strong>{initials}</strong><small>{story?.sourceName || story?.author || 'BRIEFA'}</small></span>; return <img className={className} src={story.image} alt="" loading={loading} onError={() => setFailed(true)} /> }

function StoryCard({ story, variant = 'standard' }) {
  const { imageGenerationAvailable, generateStoryImage } = useStories()
  if (['Jobs', 'Scholarships', 'Opportunities'].includes(story.category)) {
    const organization = story.sourceName || story.author || 'Briefa'
    const mark = organization.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    return <article className={`listing-card listing-card--${story.category.toLowerCase()} ${story.category === 'Jobs' ? 'listing-card--logo-first' : ''}`}>
      
      <div className="listing-card-top"><span className="organization-mark" aria-label={`${organization} logo`}>{mark}</span><span className="listing-kind">{story.tag || story.category.toUpperCase()}</span><SaveButton story={story} /></div>
      <Link className="listing-card-title" to={`/story/${story.id}`} {...storyClickProps(story.id)}>{story.title}</Link>
      <p className="listing-card-summary">{story.summary}</p>
      <div className="listing-card-details"><span><MapPin size={13} />{story.location || story.read || 'See listing'}</span>{story.deadline && <span><CalendarDays size={13} />{story.deadline}</span>}</div>
      <div className="listing-card-bottom"><span className="listing-organization">{organization}</span><Link className="listing-card-cta" to={`/story/${story.id}`} {...storyClickProps(story.id)}>View details <ArrowUpRight size={14} /></Link></div>
    </article>
  }
  const [generatingImage, setGeneratingImage] = useState(false)
  const [imageError, setImageError] = useState('')
  const createImage = async () => {
    setGeneratingImage(true)
    setImageError('')
    try {
      await generateStoryImage(story.id)
    } catch (error) {
      setImageError(error.message)
    } finally {
      setGeneratingImage(false)
    }
  }
  return <article className={`story-card story-${variant}`}>
    <div className="story-visual"><Link to={`/story/${story.id}`} className="story-image-link" {...storyClickProps(story.id)}><PublisherImage story={story} /><span className="image-arrow"><ArrowUpRight size={16} /></span></Link>{imageGenerationAvailable && story.sourceUrl && <button className="story-image-ai" type="button" onClick={createImage} disabled={generatingImage} title={imageError || 'Create an AI cover based on this story'}><WandSparkles size={13} />{generatingImage ? 'Creating' : 'AI cover'}</button>}</div>
    <div className="story-card-copy"><div className="story-card-meta"><Link to={`/category/${story.category.toLowerCase()}`} className="eyebrow">{story.category}</Link><span>{story.read}</span></div><h3><Link to={`/story/${story.id}`} {...storyClickProps(story.id)}>{story.title}</Link></h3><p>{story.summary}</p>{['Jobs', 'Scholarships', 'Opportunities', 'Events'].includes(story.category) && <div className="listing-facts"><span><b>Source</b> {story.sourceName || story.author || 'Publisher'}</span>{story.deadline && <span><b>Deadline stated</b> {story.deadline}</span>}{story.eligibility && <span><b>Eligibility</b> {story.eligibility}</span>}{!story.deadline && <span className="fact-muted">Deadline not stated in the available source</span>}</div>}<div className="story-byline"><span>{story.author}</span><span className="byline-dot">·</span><span>{story.date}</span><SaveButton story={story} /></div>{story.sourceUrl && <a className="listing-source-link" href={story.sourceUrl} target="_blank" rel="noreferrer">Open original source <ArrowUpRight size={13} /></a>}</div>
  </article>
}

function SectionHeading({ eyebrow, title, to, linkLabel = 'View all' }) {
  return <div className="section-heading"><div><span className="eyebrow section-eyebrow">{eyebrow}</span><h2>{title}</h2></div>{to && <Link className="text-link" to={to}>{linkLabel} <ArrowRight size={15} /></Link>}</div>
}

function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const submit = (event) => { event.preventDefault(); if (email.includes('@')) setSubmitted(true) }
  return <section id="newsletter" className="newsletter-section"><div className="newsletter-copy"><span className="eyebrow">A LITTLE CLARITY, DELIVERED</span><h2>The world is a lot.<br /><em>We make it make sense.</em></h2><p>Our best stories and most useful opportunities, in one thoughtful email. Every Thursday.</p></div><form className="newsletter-form" onSubmit={submit}>{submitted ? <div className="success-note"><Check size={18} /> You’re on the list. Look out for Thursday’s Briefa letter.</div> : <><label htmlFor="newsletter-email">Your email address</label><div className="newsletter-input"><input id="newsletter-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /><button type="submit" aria-label="Subscribe"><ArrowRight size={19} /></button></div><span>Thoughtful reads, no noise. Unsubscribe whenever.</span></>}</form></section>
}

function FeaturedStory() {
  const { stories } = useStories()
  const newsStories = stories.filter((story) => story.category === 'News')
  const pinnedIds = (() => { try { return JSON.parse(localStorage.getItem('briefa-breaking-pinned') || '[]') } catch { return [] } })()
  const featured = buildBreakingLineup(newsStories, pinnedIds).slice(0, 5)
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (featured.length < 2) return undefined
    const timer = window.setInterval(() => setActive((current) => (current + 1) % featured.length), 7000)
    return () => window.clearInterval(timer)
  }, [featured.length])
  if (!featured.length) return <section className="feature-section breaking-feature"><div className="feature-copy"><span className="eyebrow">LIVE NEWS</span><h1>Connecting to trusted sources.</h1><p className="feature-summary">The latest reporting will appear here as soon as the feed is ready.</p></div></section>
  const story = featured[active % featured.length]
  const changeSlide = (step) => setActive((current) => (current + step + featured.length) % featured.length)

  return <section className="feature-section breaking-feature" aria-label="Breaking story">
    <AnimatePresence mode="wait"><motion.div key={story.id} className="feature-image" initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} exit={{ opacity: 0.7 }} transition={{ duration: 0.35 }}><Link to={`/story/${story.id}`} aria-label={`Read: ${story.title}`}><PublisherImage story={story} loading="eager" /><span className="feature-image-caption"><Globe2 size={14} /> {story.location}</span></Link></motion.div></AnimatePresence>
    <div className="feature-copy"><div className="feature-kicker"><span className="live-dot" /> BREAKING <span className="kicker-line" /> {String(active + 1).padStart(2, '0')} / {String(featured.length).padStart(2, '0')}</div>
      <AnimatePresence mode="wait"><motion.div key={story.id} className="feature-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
        <Link to={`/category/${story.category.toLowerCase()}`} className="eyebrow">{story.tag}</Link><h1><Link to={`/story/${story.id}`}>{story.title}</Link></h1><p className="feature-summary">{story.summary}</p><div className="feature-byline"><span>By {story.author}</span><span className="byline-dot">·</span><span>{story.read}</span><span className="byline-dot">·</span><span>{story.location}</span></div><Link className="feature-cta" to={`/story/${story.id}`}>Read the story <ArrowRight size={16} /></Link>
      </motion.div></AnimatePresence>
      <div className="feature-controls"><div className="feature-dots">{featured.map((item, index) => <button key={item.id} onClick={() => setActive(index)} className={active === index ? 'is-active' : ''} aria-label={`Show featured story ${index + 1}`} />)}</div><div className="feature-arrows"><button onClick={() => changeSlide(-1)} aria-label="Previous story"><ArrowLeft size={17} /></button><button onClick={() => changeSlide(1)} aria-label="Next story"><ArrowRight size={17} /></button></div></div>
    </div>
  </section>
}

function DailyBriefRail() {
  const { stories } = useStories()
  const briefStories = stories.slice(1, 4)
  return <aside className="daily-brief-rail" aria-label="The Daily Brief">
    <div className="daily-brief-heading"><span className="eyebrow">THE DAILY BRIEF</span><span className="live-dot" /></div>
    <div className="daily-brief-window"><div className="daily-brief-track">
      {briefStories.map((story) => <Link className="daily-brief-card" to={`/story/${story.id}`} key={story.id}>
        <PublisherImage story={story} /><span className="daily-brief-copy"><small>{story.category} · {story.tag}</small><strong>{story.title}</strong><span>{story.read}</span></span><ArrowUpRight size={14} />
      </Link>)}
    </div></div>
    <Link className="daily-brief-more" to="/category/news">All stories <ArrowRight size={14} /></Link>
  </aside>
}

function CategoryShowcase({ category, title, description, count }) {
  const { stories, loading } = useStories()
  const categoryStories = stories.filter((story) => story.category === category)
  const slides = category === 'Jobs' ? categoryStories.slice(0, (() => { try { return Math.max(1, Math.min(6, Number(JSON.parse(localStorage.getItem('briefa-admin-settings') || '{}').sliderLimit) || 5)) } catch { return 5 } })()) : categoryStories
  const [active, setActive] = useState(0)
  const story = slides.length ? slides[active % slides.length] : null
  const titleLabel = title === 'Events' ? 'Events & Announcements' : title
  useEffect(() => {
    if (slides.length < 2) return undefined
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 7000)
    return () => window.clearInterval(timer)
  }, [slides.length])

  if (!story) return <section className={`category-intro category-showcase category-showcase--${category.toLowerCase()}`}><div className="showcase-copy"><span className="showcase-badge">{titleLabel.toUpperCase()}</span><p>{loading ? 'Connecting to live sources...' : 'No live items are available in this category yet.'}</p></div></section>
  const isCategoryStory = story.category === category

  if (category === 'News') {
    const featureStory = categoryStories[0] || story
    const railStories = categoryStories.slice(0, 5)
    return <section className="category-intro category-showcase category-showcase--news">
      <div className="news-hero">
        <div className="news-hero-main">
          <div className="news-hero-media">
            <Link to={`/story/${featureStory.id}`}><img src={featureStory.image} alt="" /></Link>
            <button className="news-nav prev" type="button" aria-label="Previous story" onClick={() => setActive((current) => (current - 1 + slides.length) % slides.length)}><ArrowLeft size={17} /></button>
            <button className="news-nav next" type="button" aria-label="Next story" onClick={() => setActive((current) => (current + 1) % slides.length)}><ArrowRight size={17} /></button>
          </div>
          <div className="news-hero-bottom">
            <div className="news-hero-kicker"><span className="live-dot" /> {featureStory.tag}</div>
            <h2><Link to={`/story/${featureStory.id}`}>{featureStory.title}</Link></h2>
            <div className="news-hero-meta"><span>{featureStory.author}</span><span>{featureStory.date}</span></div>
          </div>
        </div>
        <aside className="news-rail" aria-label="Latest news">
          <div className="news-rail-heading"><span className="showcase-badge">Latest</span></div>
          {railStories.map((item) => <Link to={`/story/${item.id}`} key={item.id} className="news-rail-item">
            <img src={item.image} alt="" loading="lazy" />
            <div>
              <span>{item.tag}</span>
              <strong>{item.title}</strong>
            </div>
          </Link>)}
        </aside>
      </div>
    </section>
  }

  if (category === 'Scholarships') {
    const scholarshipStories = categoryStories.slice(0, 5)
    return <section className="category-intro category-showcase category-showcase--scholarships">
      <div className="scholarship-hero">
        <div className="showcase-copy">
          <span className="showcase-badge">{titleLabel.toUpperCase()}</span>
          <p>{description}</p>
          <span className="category-count">{count} DEADLINE-READY OPPORTUNITIES</span>
        </div>
        <div className="scholarship-slider" aria-label="Scholarship highlights">
          <div className="scholarship-track">
            {[...scholarshipStories, ...scholarshipStories].map((item, index) => <Link key={`${item.id}-${index}`} to={`/story/${item.id}`} className="scholarship-card" {...storyClickProps(item.id)}>
              <div className="scholarship-card-copy">
                <span className="scholarship-tag">{item.tag}</span>
                <strong>{item.title}</strong>
                <small>{item.read} · Deadline soon</small>
              </div>
            </Link>)}
          </div>
        </div>
      </div>
    </section>
  }

  if (category === 'Opportunities') {
    const featuredOpportunity = categoryStories[active % categoryStories.length]
    return <section className="category-intro category-showcase category-showcase--opportunities">
      <div className="opportunity-hero">
        <AnimatePresence mode="wait"><motion.div className="opportunity-feature" key={featuredOpportunity.id} initial={{ opacity: 0.65, scale: 1.015 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0.65 }} transition={{ duration: 0.4 }}><Link to={`/story/${featuredOpportunity.id}`} aria-label={`Read: ${featuredOpportunity.title}`}><img src={featuredOpportunity.image} alt="" /></Link></motion.div></AnimatePresence>
        <div className="opportunity-details-panel">
          <AnimatePresence mode="wait"><motion.div className="opportunity-copy-slide" key={featuredOpportunity.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <div className="opportunity-slide-meta"><span>{featuredOpportunity.tag}</span><small>{String(active + 1).padStart(2, '0')} / {String(categoryStories.length).padStart(2, '0')}</small></div>
            <h2><Link to={`/story/${featuredOpportunity.id}`}>{featuredOpportunity.title}</Link></h2>
            <p>{featuredOpportunity.summary}</p>
            <span className="opportunity-deadline"><CalendarDays size={14} /> {featuredOpportunity.date}</span>
            <Link className="opportunity-hero-link" to={`/story/${featuredOpportunity.id}`}>View opportunity <ArrowRight size={15} /></Link>
          </motion.div></AnimatePresence>
          <div className="opportunity-controls"><button type="button" aria-label="Previous opportunity" onClick={() => setActive((current) => (current - 1 + categoryStories.length) % categoryStories.length)}><ArrowLeft size={16} /></button><div>{categoryStories.map((item, index) => <button key={item.id} type="button" className={index === active ? 'is-active' : ''} aria-label={`Show ${item.title}`} aria-pressed={index === active} onClick={() => setActive(index)} />)}</div><button type="button" aria-label="Next opportunity" onClick={() => setActive((current) => (current + 1) % categoryStories.length)}><ArrowRight size={16} /></button></div>
        </div>
      </div>
    </section>
  }

  if (category === 'Events') {
    const eventStories = categoryStories.slice(0, 3)
    return <section className="category-intro category-showcase category-showcase--events">
      <div className="event-hero">
        <div className="event-hero-main">
          <div className="event-hero-card">
            <img src={eventStories[0].image} alt="" />
            <div className="event-card-copy">
              <span>{eventStories[0].tag}</span>
              <strong>{eventStories[0].title}</strong>
            </div>
          </div>
        </div>
        <div className="event-hero-side">
          {eventStories.slice(1).map((item) => <Link key={item.id} to={`/story/${item.id}`} className="event-side-card">
            <img src={item.image} alt="" loading="lazy" />
            <div>
              <span>{item.tag}</span>
              <strong>{item.title}</strong>
            </div>
          </Link>)}
        </div>
      </div>
    </section>
  }

  if (category === 'Jobs') {
    const jobStory = slides[active % slides.length] || story
    return <section className="category-intro category-showcase category-showcase--jobs">
      <div className="jobs-hero">
        <AnimatePresence mode="wait"><motion.div className="jobs-hero-image" key={jobStory.id} initial={{ opacity: 0.55, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0.55 }} transition={{ duration: 0.4 }}><Link to={`/story/${jobStory.id}`} aria-label={`Read: ${jobStory.title}`}><img src={jobStory.image} alt="" /><span className="jobs-hero-shade" /></Link></motion.div></AnimatePresence>
        <AnimatePresence mode="wait"><motion.div className="jobs-hero-copy" key={`${jobStory.id}-copy`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}><span className="jobs-hero-label">Featured role · {jobStory.tag}</span><h2><Link to={`/story/${jobStory.id}`}>{jobStory.title}</Link></h2><p>{jobStory.summary}</p><Link className="jobs-hero-link" to={`/story/${jobStory.id}`}>Explore this role <ArrowRight size={15} /></Link></motion.div></AnimatePresence>
        <AnimatePresence mode="wait"><motion.aside className="jobs-hero-aside" key={`${jobStory.id}-details`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.25 }}><span>ROLE DETAILS</span><strong>{jobStory.read}</strong><i /><span>APPLICATION DEADLINE</span><strong>{jobStory.date.replace('Closes ', '')}</strong><span className="jobs-hero-location"><MapPin size={14} /> {jobStory.location}</span></motion.aside></AnimatePresence>
        <div className="jobs-hero-controls"><button type="button" aria-label="Previous featured job" onClick={() => setActive((current) => (current - 1 + slides.length) % slides.length)}><ArrowLeft size={16} /></button><span className="jobs-hero-count">{String((active % slides.length) + 1).padStart(2, '0')} <i>/</i> {String(slides.length).padStart(2, '0')}</span><button type="button" aria-label="Next featured job" onClick={() => setActive((current) => (current + 1) % slides.length)}><ArrowRight size={16} /></button><Link className="jobs-hero-all" to="/category/jobs">View all jobs <ArrowRight size={14} /></Link></div>
      </div>
    </section>
  }

  return <section className={`category-intro category-showcase category-showcase--${category.toLowerCase()}`}>
    <div className="showcase-copy"><span className="showcase-badge">{titleLabel.toUpperCase()}</span><p>{description}</p><span className="category-count">{count} STORIES & OPPORTUNITIES</span></div>
    <div className="showcase-media">
      <motion.div className="showcase-slide" key={story.id} initial={{ opacity: 0.65 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}><Link to={isCategoryStory ? `/story/${story.id}` : `/category/${category.toLowerCase()}`} aria-label={isCategoryStory ? `Read: ${story.title}` : `Browse ${title}`}><PublisherImage story={story} loading="eager" /><span className="showcase-caption">{isCategoryStory ? story.tag : `${title} · IN FOCUS`}<strong>{isCategoryStory ? story.title : description}</strong></span></Link></motion.div>
      {slides.length > 1 && <div className="showcase-dots" aria-label={`${title} featured stories`}>{slides.map((item, index) => <button key={item.id} aria-label={`Show ${title} image ${index + 1}`} aria-pressed={index === active} className={index === active ? 'is-active' : ''} onClick={() => setActive(index)} />)}</div>}
    </div>
  </section>
}

function TrendingStories() {
  const { stories } = useStories()
  const trending = [...stories].map((story) => {
    let clicks = 0
    try {
      const all = JSON.parse(localStorage.getItem(POPULAR_STORAGE_KEY) || '{}')
      clicks = (Array.isArray(all[story.id]) ? all[story.id] : []).filter((stamp) => Date.now() - stamp < 48 * 60 * 60 * 1000).length
    } catch { /* Fall back to feed order. */ }
    return { ...story, recentClicks: clicks }
  }).sort((a, b) => b.recentClicks - a.recentClicks).slice(0, 3)
  return <section className="trending-section">
    <div className="trending-intro">
      <span className="eyebrow">MOST READ IN THE LAST 48 HOURS</span>
      <h2>Popular <span>stories.</span></h2>
      <p>Stories readers have opened most often over the past two days.</p>
      <Link className="trending-all-link" to="/category/news">Explore the latest <ArrowRight size={15} /></Link>
    </div>
    <div className="trending-list">{trending.map((story, index) => <Link to={`/story/${story.id}`} className="trending-item" key={story.id} {...storyClickProps(story.id)}>
      <span className="trending-number">0{index + 1}</span>
      <span className="trending-thumb">{story.image && <PublisherImage story={story} />}</span>
      <span className="trending-item-copy"><span className="eyebrow">{story.category} · {story.tag}</span><strong>{story.title}</strong><small>{story.author || 'Briefa sources'} · {story.date}</small></span>
      <ArrowUpRight size={17} />
    </Link>)}</div>
  </section>
}

function TrendingPhotoRail() {
  const { stories } = useStories()
  const photoStories = stories.slice(0, 3)
  return <aside className="daily-brief-rail trending-photo-rail" aria-label="Trending photos">
    <div className="daily-brief-heading"><span className="eyebrow">TRENDING PHOTOS</span><span className="live-dot" /></div>
    <div className="daily-brief-window"><div className="daily-brief-track">
      {[...photoStories, ...photoStories].map((story, index) => <Link className="daily-brief-card" to={`/story/${story.id}`} key={`${story.id}-${index}`} aria-hidden={index >= photoStories.length} tabIndex={index >= photoStories.length ? -1 : undefined}>
        <PublisherImage story={story} /><span className="daily-brief-copy"><small>{story.category} · {story.tag}</small><strong>{story.title}</strong></span><ArrowUpRight size={14} />
      </Link>)}
    </div></div>
    <Link className="daily-brief-more" to="/category/news">All photos <ArrowRight size={14} /></Link>
  </aside>
}

function getVideoEmbedUrl(rawUrl) {
  if (!rawUrl) return null
  try {
    const url = new URL(rawUrl)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v')
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
      }
      const match = url.pathname.match(/^\/(?:shorts|live|embed)\/([^/?]+)/)
      return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null
    }
    if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
      if (host === 'player.vimeo.com' && url.pathname.startsWith('/video/')) return url.href
      const id = url.pathname.match(/\/(\d+)/)?.[1]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
      const id = url.pathname.match(/\/video\/(\d+)/)?.[1]
      return id ? `https://www.tiktok.com/player/v1/${id}` : null
    }
    return null
  } catch {
    return null
  }
}

function TrendingVideoSection() {
  const { trendingVideos } = useStories()
  const [active, setActive] = useState(0)
  const [videoInput, setVideoInput] = useState('')
  const [customVideo, setCustomVideo] = useState(null)
  const [inputError, setInputError] = useState('')

  useEffect(() => {
    if (customVideo || trendingVideos.length < 2) return undefined
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % trendingVideos.length)
    }, 10000)
    return () => window.clearInterval(timer)
  }, [trendingVideos.length, customVideo])

  const video = trendingVideos.length ? trendingVideos[active % trendingVideos.length] : null
  const embedUrl = customVideo || getVideoEmbedUrl(video?.embedUrl) || getVideoEmbedUrl(video?.url)

  function loadVideo(event) {
    event.preventDefault()
    const embed = getVideoEmbedUrl(videoInput.trim())
    if (!embed) {
      setInputError('This link cannot be embedded directly. Try a YouTube, Vimeo, or TikTok video URL.')
      return
    }
    setCustomVideo(embed)
    setInputError('')
  }

  function selectTrendingVideo(index) {
    setActive(index)
    setCustomVideo(null)
    setInputError('')
  }

  return (
    <section className="video-highlights">
      <div className="video-main">
        <div className="video-heading">
          <div>
            <span className="eyebrow">VIDEO DISCOVERY</span>
            <h2>{customVideo ? 'NOW PLAYING' : video ? 'TRENDING VIDEOS' : 'WATCH INSIDE BRIEFA'}</h2>
          </div>
          <span className="video-demo-note">
            {customVideo ? 'YOUR VIDEO' : video ? `${String(active + 1).padStart(2, '0')} / ${String(trendingVideos.length).padStart(2, '0')}` : 'PASTE A VIDEO LINK'}
          </span>
        </div>

        <form className="video-url-form" onSubmit={loadVideo}>
          <label htmlFor="briefa-video-url">Play a video directly inside Briefa</label>
          <div className="video-url-controls">
            <input
              id="briefa-video-url"
              type="url"
              value={videoInput}
              onChange={(event) => setVideoInput(event.target.value)}
              placeholder="Paste a YouTube, Vimeo, or TikTok video URL"
              required
            />
            <button type="submit">Play video</button>
          </div>
          {inputError && <p className="video-input-error" role="alert">{inputError}</p>}
        </form>

        {embedUrl ? (
          <div className="video-feature">
            <div className="video-player-frame">
              <iframe
                key={embedUrl}
                src={embedUrl}
                title={customVideo ? 'Selected video' : video?.title || 'Trending video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <div className="video-feature-copy">
              <span>
                {customVideo ? 'Your selected video' : `${video?.channelTitle || 'Trending video'}${video?.viewCount ? ` · ${Number(video.viewCount).toLocaleString()} views` : ''}`}
              </span>
              <strong>{customVideo ? 'Now playing' : video?.title || 'Trending video'}</strong>
              {!customVideo && video?.url && (
                <a href={video.url} target="_blank" rel="noreferrer">
                  Open original video <ArrowUpRight size={14} />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="video-empty-state">
            <Play size={28} />
            <h3>No embeddable video available yet</h3>
            <p>Paste a supported video URL above, or configure the existing trending-video feed.</p>
          </div>
        )}

        {!customVideo && trendingVideos.length > 1 && (
          <div className="video-feature-controls">
            <button type="button" aria-label="Previous video" onClick={() => selectTrendingVideo((active - 1 + trendingVideos.length) % trendingVideos.length)}>
              <ArrowLeft size={16} />
            </button>
            <button type="button" aria-label="Next video" onClick={() => selectTrendingVideo((active + 1) % trendingVideos.length)}>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {customVideo && (
          <button className="video-reset-button" type="button" onClick={() => {
            setCustomVideo(null)
            setVideoInput('')
            setInputError('')
          }}>
            Return to trending videos
          </button>
        )}
        <p className="video-access-note">
          Video playback depends on the source platform allowing embedding. Some videos may only play on their original site.
        </p>
      </div>
      <TrendingPhotoRail />
    </section>
  )
}

function CategorySources({ category }) {
  const sources = sourcesForCategory(category)
  return <nav className="category-source-list" aria-label={`${category} source platforms`}><span>OFFICIAL SOURCES</span>{sources.map((source) => <a href={source.url} key={source.name} target="_blank" rel="noreferrer" title={source.description}>{source.name}<ArrowUpRight size={12} /></a>)}</nav>
}

function CategoryPreview({ category, hideSources = false }) {
  const { stories } = useStories()
  const sectionName = category === 'Events' ? 'Events & Announcements' : category
  const sectionLimit = (() => { if (category === 'News') return 8; try { const config = JSON.parse(localStorage.getItem('briefa-admin-settings') || '{}'); return category === 'Jobs' ? Number(config.homepageJobs) || 4 : category === 'Scholarships' ? Number(config.homepageScholarships) || 3 : 3 } catch { return category === 'Jobs' ? 4 : category === 'Scholarships' ? 3 : 3 } })()
  // Keep homepage sections distinct: the lead/breaking rail owns Breaking stories,
  // while the News grid fills from the remaining unique stories.
  const categoryItems = category === 'News'
    ? stories.filter((story) => story.category === category)
    : stories.filter((story) => story.category === category)
  const uniqueCategoryItems = categoryItems.filter((story, index, all) => all.findIndex((item) => item.id === story.id) === index)
  // Deduplicate syndicated copies while preserving the first publisher's image.
  // Tracking parameters are ignored; meaningful article parameters are retained.
  const canonicalUrl = (value = '') => {
    try {
      const url = new URL(value)
      url.hash = ''
      ;['utm_source','utm_medium','utm_campaign','utm_term','utm_content','fbclid','gclid','ref'].forEach((key) => url.searchParams.delete(key))
      url.searchParams.sort()
      return `${url.origin}${url.pathname.replace(/\/$/, '')}${url.search}`
    } catch { return value.toLowerCase().split('#')[0].replace(/\/$/, '') }
  }
  const contentTokens = (story) => new Set(normalizeHeadline(`${story.title || ''} ${story.summary || ''} ${(story.paragraphs || []).join(' ')}`).split(' ').filter(Boolean))
  const contentSimilarity = (left, right) => {
    const a = contentTokens(left); const b = contentTokens(right)
    if (Math.min(a.size, b.size) < 12) return false
    const overlap = [...a].filter((word) => b.has(word)).length
    return overlap / (a.size + b.size - overlap) >= 0.78
  }
  const sameCoverage = (left, right) => {
    if (left.id === right.id) return true
    if (left.sourceUrl && right.sourceUrl && canonicalUrl(left.sourceUrl) === canonicalUrl(right.sourceUrl)) return true
    return headlineSimilarity(left.title, right.title) || contentSimilarity(left, right)
  }
  const uniqueCoverageItems = uniqueCategoryItems.filter((story, index, all) =>
    all.findIndex((other) => sameCoverage(other, story)) === index
  )
  let sectionStories
  if (category === 'News') {
    const regular = uniqueCoverageItems.filter((story) => { const publisher = `${story.sourceName || ''} ${story.sourceUrl || ''} ${story.author || ''}`.toLowerCase(); return !story.topics?.includes('Breaking') && !/igihe|kigali[ .-]?today|kigalitoday/.test(publisher) })
    const breakingFallback = []
    // Fill the requested eight-card grid when fewer than eight non-breaking stories exist.
    sectionStories = regular.slice(0, sectionLimit)
  } else {
    sectionStories = uniqueCoverageItems.slice(0, sectionLimit)
  }
  const topics = categoryTopics[category].slice(0, 5)
  return <section className={`category-preview preview-${category.toLowerCase()}`}>
    <SectionHeading eyebrow={category === 'Jobs' ? 'CAREER MOVES, WITHOUT THE NOISE' : category === 'Scholarships' ? 'FUND YOUR NEXT CHAPTER' : category === 'Opportunities' ? 'WAYS TO BUILD WHAT COMES NEXT' : category === 'News' ? 'THE STORIES SHAPING OUR WORLD' : 'WHAT’S HAPPENING NEXT'} title={sectionName} to={`/category/${category.toLowerCase()}`} linkLabel={category === 'News' ? 'Read more' : `Explore all ${sectionName}`} />
    {category === 'Scholarships' && <Link className={`home-opportunity-feature home-opportunity-feature--${category.toLowerCase()}`} to={sectionStories[0] ? `/story/${sectionStories[0].id}` : `/category/${category.toLowerCase()}`}>
      <div className="home-opportunity-feature-copy"><span className="home-opportunity-kicker">{category === 'Jobs' ? 'YOUR NEXT MOVE' : 'YOUR NEXT CHAPTER'}</span><h3>{category === 'Jobs' ? <>Find work that<br/><em>moves you forward.</em></> : <>Make your ambition<br/><em>more affordable.</em></>}</h3><p>{category === 'Jobs' ? 'Thoughtful picks from employers and organizations worth knowing.' : 'Scholarships and funding opportunities to help you go further.'}</p><span className="home-opportunity-action">{category === 'Jobs' ? 'Explore featured role' : 'Explore featured scholarship'} <ArrowRight size={15} /></span></div>
      {category === 'Jobs' && sectionStories[0]?.image && <div className="home-opportunity-feature-image"><img src={sectionStories[0].image} alt="" loading="lazy" /><span>FEATURED ROLE</span></div>}
      <span className="home-opportunity-feature-glow" aria-hidden="true" />
    </Link>}
    {category !== 'Jobs' && category !== 'News' && <nav className="preview-topics" aria-label={`${sectionName} topics`}><span>EXPLORE</span>{topics.map((topic) => <Link key={topic} to={`/category/${category.toLowerCase()}?topic=${encodeURIComponent(topic)}`}>{topic}</Link>)}</nav>}
    {category === 'Jobs' ? <div className="home-jobs-layout">
      <aside className="home-jobs-intro"><span className="home-opportunity-kicker">YOUR NEXT MOVE</span><h3>Build a future<br/><em>that moves you.</em></h3><p>Explore selected roles from organizations worth knowing.</p><Link className="home-opportunity-action" to="/category/jobs">Explore all jobs <ArrowRight size={15} /></Link><span className="home-jobs-icon" aria-hidden="true">↗</span></aside>
      <div className="home-jobs-list">{sectionStories.slice(0, sectionLimit).map((story) => <StoryCard key={story.id} story={story} />)}<Link className="home-jobs-more" to="/category/jobs">Browse the full job board <ArrowRight size={15} /></Link></div>
    </div> : <div className="story-grid preview-story-grid">{sectionStories.map((story) => <StoryCard key={story.id} story={story} />)}</div>}
    {category === 'Jobs' && <section className="tenders-promo tenders-promo--editorial"><div className="tenders-promo-heading"><span className="eyebrow">PROCUREMENT DESK · FOR BUSINESSES & SUPPLIERS</span><h3>Find your next tender.</h3><p>Procurement notices and calls for proposals, gathered in one place.</p></div><div className="tenders-promo-list"><Link to="/category/jobs/tenders"><span className="tender-list-index">01</span><span><strong>Open tenders</strong><small>Browse current procurement notices</small></span><ArrowRight size={17}/></Link><Link to="/category/jobs/tenders?type=proposals"><span className="tender-list-index">02</span><span><strong>Calls for proposals</strong><small>Find requests for ideas and services</small></span><ArrowRight size={17}/></Link><Link to="/category/jobs/tenders?type=suppliers"><span className="tender-list-index">03</span><span><strong>Supplier opportunities</strong><small>Explore opportunities for your organization</small></span><ArrowRight size={17}/></Link></div></section>}
    {category === 'News' && <div className="news-read-more"><Link className="read-more-button" to="/category/news">Read more stories <ArrowRight size={16} /></Link></div>}
    {!hideSources && <CategorySources category={category} />}
  </section>
}

function HomePage() {
  const { refreshedAt } = useStories()
  const edition = refreshedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(refreshedAt)) : 'Waiting for live sources'
  return <main className="page-shell home-page">
    <div className="edition-line"><span>YOUR WINDOW TO WHAT MATTERS</span><span className="edition-rule" /><span>LIVE EDITION &nbsp;·&nbsp; {edition.toUpperCase()}</span></div>
    <div className="home-lead-grid"><FeaturedStory /><DailyBriefRail /></div>
    <TrendingStories />
    <CategoryPreview category="News" hideSources />
    <TrendingVideoSection />
    {categories.filter((category) => category !== 'News').map((category) => <CategoryPreview key={category} category={category} hideSources />)}
    <section className="sources-promo"><div><span className="eyebrow">CLEAR PROVENANCE</span><h2>Good reporting starts with good sources.</h2><p>Explore the publishers, institutions, and opportunity boards we look to.</p></div><Link className="text-link" to="/sources">Browse our sources <ArrowRight size={15} /></Link></section>
    <Newsletter />
  </main>
}

function CategorySourcePanel({ category }) {
  const group = sourceGroups.find((item) => {
    if (category === 'Jobs') return item.name === 'Jobs & careers'
    if (category === 'Scholarships') return item.name === 'Scholarships'
    if (category === 'Opportunities') return item.name === 'Opportunities, grants & fellowships'
    if (category === 'Events') return item.name === 'Events'
    return item.name === 'News & current affairs'
  })
  if (!group) return null
  return <section className={`category-source-panel category-source-panel--${category.toLowerCase()}`}>
    <div className="category-source-heading"><span className="eyebrow">GO STRAIGHT TO THE PROVIDER</span><h2>Official sources<span className="title-period">.</span></h2><p>Browse the original provider portals. Briefa links out to the source and does not replace its application or registration process.</p></div>
    <div className="category-source-grid">{group.sources.map((source) => <a key={source.name} href={source.url} target="_blank" rel="noreferrer" className="category-source-card"><span className="category-source-mark">{source.name.slice(0, 1)}</span><span className="category-source-copy"><strong>{source.name}</strong><small>{source.description}</small></span><ArrowUpRight size={16} /></a>)}</div>
  </section>
}


function TendersPage() {
  const { stories } = useStories()
  const tenders = stories.filter((story) => story.category === 'Opportunities' && (story.topics || []).some((topic) => /tender|proposal|procurement/i.test(topic + ' ' + story.title + ' ' + story.tag)))
  return <main className="page-shell category-page tenders-page"><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><Link to="/category/jobs">Jobs</Link><ChevronRight size={13} /><span>Tenders</span></div><section className="tenders-hero"><div><span className="eyebrow">BRIEFA PROCUREMENT DESK</span><h1>Tenders<span className="title-period">.</span></h1><p>Calls for proposals, procurement notices, and supplier opportunities from available sources. Always confirm requirements and deadlines with the issuing organization.</p><span className="category-count">{tenders.length} SOURCE-MATCHED NOTICES</span></div><div className="tenders-hero-mark"><span>OPEN</span><strong>Calls<br/>for work.</strong><small>Source-led. Updated with the feed.</small></div></section><CategorySources category="Opportunities" />{tenders.length ? <section className="category-results tender-results"><SectionHeading eyebrow="FROM AVAILABLE SOURCES" title="Latest tenders & calls" /><div className="story-grid">{tenders.map((story) => <StoryCard key={story.id} story={story} />)}</div></section> : <div className="coming-soon"><span className="eyebrow">NO MATCHING NOTICES IN THE CURRENT FEED</span><p>There are no source-matched tender notices available right now. Browse the official provider links above and check back as the feed refreshes.</p><Link className="text-link" to="/category/opportunities">Explore all opportunities <ArrowRight size={15} /></Link></div>}<Newsletter /></main>
}

function isPublisherStory(story, publisher) {
  const source = `${story.sourceName || ''} ${story.sourceHome || ''} ${story.sourceUrl || ''} ${story.author || ''} ${story.tag || ''}`.toLowerCase()
  if (publisher === 'kigali') return /kigali[ .-]?today|kigalitoday|kigali\.today|ktpress/.test(source)
  if (publisher === 'igihe') return /igihe/.test(source)
  if (publisher === 'bbc') return /bbc/.test(source) || /bbc\.co\.uk|bbc\.com/.test(source)
  if (publisher === 'aljazeera') return /al.?jazeera/.test(source) || /aljazeera\.com/.test(source)
  return false
}

function storiesAreDistinct(left, right) {
  if (!left || !right) return false
  if (left.id === right.id) return false
  if (left.sourceUrl && right.sourceUrl && left.sourceUrl.split('?')[0] === right.sourceUrl.split('?')[0]) return false
  if (headlineSimilarity(left.title, right.title)) return false
  const words = (story) => new Set(normalizeHeadline(`${story.title || ''} ${story.summary || ''}`).split(' ').filter((word) => word.length > 3))
  const a = words(left); const b = words(right)
  if (Math.min(a.size, b.size) >= 10) {
    const overlap = [...a].filter((word) => b.has(word)).length
    if (overlap / (a.size + b.size - overlap) >= 0.55) return false
  }
  return true
}

function buildBreakingLineup(allStories, pinnedIds) {
  const news = allStories.filter((story) => story.category === 'News' && story.title)
  const byRecent = (a, b) => (Date.parse(b.publishedAt || b.date || '') || 0) - (Date.parse(a.publishedAt || a.date || '') || 0)
  const pinnedLookup = new Map(news.map((story) => [story.id, story]))
  const pinnedUnique = []
  for (const id of [...new Set(Array.isArray(pinnedIds) ? pinnedIds : [])]) {
    const story = pinnedLookup.get(id)
    if (!story || pinnedUnique.some((existing) => !storiesAreDistinct(existing, story))) continue
    pinnedUnique.push(story)
    if (pinnedUnique.length === 5) break
  }
  const pinnedSet = new Set(pinnedUnique.map((story) => story.id))
  const seenIds = new Set()
  const unique = news.filter((story) => {
    if (pinnedSet.has(story.id) || seenIds.has(story.id)) return false
    seenIds.add(story.id)
    return Boolean(story.sourceUrl || story.sourceName)
  }).sort(byRecent)
  const lineup = []
  const add = (story) => {
    if (!story || lineup.length >= 5 - pinnedUnique.length) return
    if (lineup.some((item) => !storiesAreDistinct(item, story))) return
    lineup.push(story)
  }
  // Strict source order for the unpinned lead slots: Rwanda x2, BBC, Al Jazeera, then either international source.
  const slots = [
    unique.filter((story) => isPublisherStory(story, 'kigali') && Boolean(story.image)),
    unique.filter((story) => isPublisherStory(story, 'igihe') && Boolean(story.image)),
    unique.filter((story) => isPublisherStory(story, 'bbc')),
    unique.filter((story) => isPublisherStory(story, 'aljazeera')),
    unique.filter((story) => isPublisherStory(story, 'bbc') || isPublisherStory(story, 'aljazeera')),
  ]
  for (const candidates of slots) {
    if (lineup.length >= 5 - pinnedUnique.length) break
    add(candidates.find((candidate) => !lineup.some((item) => !storiesAreDistinct(item, candidate))))
  }
  // Fill any missing slots with the most recent distinct stories; never repeat the same story twice.
  for (const story of unique) {
    if (lineup.length >= 5 - pinnedUnique.length) break
    add(story)
  }
  // Pinned stories replace slots from the end: one pin is slot 5; two pins are slots 4 and 5.
  return [...lineup, ...pinnedUnique.slice(-5).reverse()].slice(0, 5)
}

function CategoryPage() {
  const { category } = useParams()
  const { stories } = useStories()
  const title = categories.find((item) => item.toLowerCase() === category?.toLowerCase()) || 'News'
  const [searchParams, setSearchParams] = useSearchParams()
  const [openFilter, setOpenFilter] = useState('')
  const [showAllNews, setShowAllNews] = useState(false)
  const [listingPage, setListingPage] = useState(0)
  const selectedTopic = searchParams.get('topic') || 'All'
  const selectedRegion = searchParams.get('region') || 'All'
  const selectedStatus = searchParams.get('status') || 'All'
  const selectedCountry = searchParams.get('country') || 'All'
  const selectedDate = searchParams.get('date') || 'All'
  const dateWindows = { '24h': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000, '30d': 30 * 24 * 60 * 60 * 1000 }
  const [now] = useState(() => Date.now())
  const titleLabel = title === 'Events' ? 'Events & Announcements' : title
  const pinnedBreakingIds = (() => { try { return JSON.parse(localStorage.getItem('briefa-breaking-pinned') || '[]') } catch { return [] } })()
  const filteredBase = stories.filter((story) => story.category === title && (selectedTopic === 'All' || story.topics?.includes(selectedTopic)) && (selectedCountry === 'All' || story.country === selectedCountry) && (!dateWindows[selectedDate] || now - Date.parse(story.publishedAt) <= dateWindows[selectedDate]) && (title !== 'Events' || selectedRegion === 'All' || story.region === selectedRegion) && (title !== 'News' || selectedRegion === 'All' || (selectedRegion === 'Africa' ? (story.country && story.country !== 'Global' && story.country !== 'Rwanda') || story.topics?.includes('Africa') : selectedRegion === 'World' ? story.country === 'Global' || story.topics?.includes('World') : true)) && (title !== 'Events' || selectedStatus === 'All' || story.eventStatus === selectedStatus))
  const filtered = title === 'News' && selectedTopic === 'Breaking' ? buildBreakingLineup(stories, pinnedBreakingIds) : filteredBase
  const updateFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams)
    if (value === 'All') nextParams.delete(key)
    else nextParams.set(key, value)
    setSearchParams(nextParams)
  }
  const selectClass = (key, value) => (searchParams.get(key) || 'All') === value ? 'is-active' : ''
  return <main className="page-shell category-page"><CategoryShowcase category={title} title={titleLabel} description={categoryDescriptions[title]} count={filtered.length} /><FeedFilters country={selectedCountry} date={selectedDate} onChange={updateFilter} />
    {title === 'Events' ? <div className="event-filters" aria-label="Filter events">
      <span className="event-filter-caption"><SlidersHorizontal size={14} /> FILTER</span>
      {[{ id: 'status', label: 'When', icon: CalendarDays, options: ['All', 'Upcoming', 'Recent'] }, { id: 'region', label: 'Location', icon: MapPin, options: ['All', 'Local', 'International'] }, { id: 'topic', label: 'Topic', icon: Tag, options: ['All', ...categoryTopics.Events] }].map((filter) => {
        const selected = searchParams.get(filter.id) || 'All'
        const expanded = openFilter === filter.id
        const FilterIcon = filter.icon
        return <div className="event-filter" key={filter.id}>
          <button className={`event-filter-trigger ${selected !== 'All' ? 'is-active' : ''}`} aria-label={`${filter.label}: ${selected}`} aria-expanded={expanded} aria-controls={`event-filter-${filter.id}`} onClick={() => setOpenFilter(expanded ? '' : filter.id)}><FilterIcon size={14} /><span>{filter.label}</span><strong>{selected}</strong><ChevronDown size={14} /></button>
          {expanded && <div className="event-filter-menu" id={`event-filter-${filter.id}`}>
            {filter.options.map((option) => <button className={selectClass(filter.id, option)} key={option} onClick={() => { updateFilter(filter.id, option); setOpenFilter('') }}>{option}</button>)}
          </div>}
        </div>
      })}
    </div> : <nav className="topic-filter" aria-label={`${titleLabel} subcategories`}><span className="topic-filter-label">BROWSE BY TOPIC</span><button className={selectClass('topic', 'All')} onClick={() => updateFilter('topic', 'All')}>All</button>{categoryTopics[title].map((topic) => <button key={topic} className={selectClass('topic', topic)} onClick={() => updateFilter('topic', topic)}>{topic}</button>)}</nav>}
    {title === 'News' && <TrendingVideoSection />}
    {title === 'Jobs' && <nav className="jobs-subnav"><span>JOB BOARD</span><Link to="/category/jobs">All jobs</Link><Link to="/category/jobs/tenders">Tenders & calls for proposals <ArrowUpRight size={14} /></Link></nav>}{filtered.length ? title === 'Events' ? ['Upcoming', 'Recent'].map((status) => { const eventStories = filtered.filter((story) => story.eventStatus === status); return eventStories.length ? <section className="event-results" key={status}><SectionHeading eyebrow={status === 'Upcoming' ? 'MARK YOUR CALENDAR' : 'JUST HAPPENED'} title={status} /><div className="story-grid">{eventStories.map((story) => <StoryCard key={story.id} story={story} />)}</div></section> : null }) : <><div className="category-featured"><StoryCard story={filtered[title === 'Jobs' ? listingPage * 5 : 0]} variant="category-lead" /></div>{filtered.length > 1 && <div className="category-results"><SectionHeading eyebrow={`THE LATEST IN ${title.toUpperCase()}`} title={title === 'News' ? 'Latest stories' : 'Worth your attention'} /><div className="story-grid">{(title === 'News' && !showAllNews ? filtered.slice(1, 7) : title === 'News' ? filtered.slice(1) : title === 'Jobs' ? filtered.slice(listingPage * 5 + 1, (listingPage + 1) * 5) : filtered.slice(1 + listingPage * 6, 1 + (listingPage + 1) * 6)).map((story) => <StoryCard key={story.id} story={story} />)}</div>{title === 'News' && filtered.length > 7 && !showAllNews && <div className="news-read-more"><button className="read-more-button" onClick={() => setShowAllNews(true)}>Read more stories <ArrowRight size={16} /></button></div>}{title !== 'News' && (title === 'Jobs' ? filtered.length > 5 : filtered.length > 7) && <nav className="listing-pagination" aria-label="Listings pages"><button type="button" disabled={listingPage === 0} onClick={() => { setListingPage((page) => Math.max(0, page - 1)); document.querySelector('.category-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}><ArrowLeft size={14} /> Previous</button><span>Page {listingPage + 1} of {Math.ceil((filtered.length - (title === 'Jobs' ? 0 : 1)) / (title === 'Jobs' ? 5 : 6))}</span><button type="button" disabled={title === 'Jobs' ? (listingPage + 1) * 5 >= filtered.length : (listingPage + 1) * 6 >= filtered.length - 1} onClick={() => { setListingPage((page) => page + 1); document.querySelector('.category-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>Next <ArrowRight size={14} /></button></nav>}{title === 'News' && showAllNews && <p className="feed-pagination-note">You’re viewing all {filtered.length} stories currently available in the feed.</p>}</div>}</> : <div className="coming-soon topic-empty"><span className="eyebrow">NO LIVE ITEMS MATCH THESE FILTERS</span><p>Try another country, date range, or topic.</p><button className="text-link" onClick={() => { updateFilter('topic', 'All'); updateFilter('country', 'All'); updateFilter('date', 'All') }}>Clear filters <ArrowRight size={15} /></button></div>}
    <CategorySourcePanel category={title} /><Newsletter /></main>
}

function FeedStatus() {
  const { sources, refreshedAt, aiStatus, loading, error, refreshing, refresh } = useStories()
  const healthySources = sources.filter((source) => source.status === 'ok').length
  const updated = refreshedAt ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(refreshedAt)) : null
  return <div className="feed-status" role="status"><span className={`feed-status-dot ${error ? 'has-error' : ''}`} /><span className="feed-status-copy"><strong>{loading ? 'Connecting to sources' : error ? 'Sources unavailable' : 'Live sources'}</strong><small>{error || (sources.length ? `${healthySources}/${sources.length} sources · updated ${updated || 'just now'}` : 'Waiting for source status')}</small></span><span className="feed-ai-status">{aiStatus === 'ready' ? 'AI summaries on' : 'Publisher summaries'}</span><button type="button" onClick={refresh} disabled={refreshing} aria-label="Refresh stories" title="Refresh stories"><RefreshCw size={15} className={refreshing ? 'is-spinning' : ''} /></button></div>
}

function FeedFilters({ country, date, onChange }) {
  return <div className="feed-filters"><label><MapPin size={14} /><span>Country</span><select value={country} onChange={(event) => onChange('country', event.target.value)}><option value="All">All countries</option>{['Rwanda', 'Uganda', 'Kenya', 'Nigeria', 'Ghana', 'Tanzania', 'South Africa', 'Africa', 'Global'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label><CalendarDays size={14} /><span>Date</span><select value={date} onChange={(event) => onChange('date', event.target.value)}><option value="All">Any time</option><option value="24h">Past 24 hours</option><option value="7d">Past 7 days</option><option value="30d">Past 30 days</option></select></label></div>
}

const categoryDescriptions = {
  News: 'The context behind the headlines, from across Africa and the world.',
  Jobs: 'Good work, with a clear path to the original opportunity.',
  Scholarships: 'Room to learn, grow, and take your next step.',
  Opportunities: 'Funding, fellowships, and open doors worth finding.',
  Events: 'Local and international gatherings, notices, and dates worth knowing.',
}

function SearchPage() {
  const { stories } = useStories()
  const [params] = useSearchParams()
  const query = params.get('q') || ''
  const matches = stories.filter((story) => `${story.title} ${story.summary} ${story.category} ${story.tag} ${story.sourceName || ''} ${story.country || ''} ${story.topics?.join(' ') || ''}`.toLowerCase().includes(query.toLowerCase()))
  return <main className="page-shell category-page"><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><span>Search</span></div><section className="category-intro search-intro"><span className="eyebrow">SEARCH BRIEFA</span><h1>Results<span className="title-period">.</span></h1><p>Showing matches for <strong>“{query}”</strong></p><span className="category-count">{matches.length} {matches.length === 1 ? 'RESULT' : 'RESULTS'}</span></section>{matches.length ? <div className="story-grid search-results">{matches.map((story) => <StoryCard key={story.id} story={story} />)}</div> : <div className="coming-soon"><span className="eyebrow">NO MATCHES YET</span><p>Try another phrase, or browse our latest <Link to="/category/news">stories</Link> and <Link to="/category/opportunities">opportunities</Link>.</p></div>}</main>
}

function StoryPage() {
  const { stories, loading } = useStories()
  const { id } = useParams()
  const story = stories.find((item) => item.id === id)
  if (!story && loading) return <main className="page-shell not-found"><span className="eyebrow">CONNECTING TO SOURCES</span><h1>Loading this story.</h1></main>
  if (!story) return <main className="page-shell not-found"><span className="eyebrow">404 · STORY NOT FOUND</span><h1>That page has moved.</h1><Link className="text-link" to="/">Back to the Briefa front page <ArrowRight size={15} /></Link></main>
  const related = stories.filter((item) => item.category === story.category && item.id !== story.id).slice(0, 2)
  return <main className="page-shell article-page"><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><Link to={`/category/${story.category.toLowerCase()}`}>{story.category}</Link><ChevronRight size={13} /><span>Story</span></div><article><header className="article-header"><Link className="eyebrow" to={`/category/${story.category.toLowerCase()}`}>{story.tag}</Link><h1>{story.title}</h1><p className="article-deck">{story.summary}</p><div className="article-meta"><div className="author-avatar">{story.author.split(' ').map((word) => word[0]).join('').slice(0, 2)}</div><span>By <strong>{story.author}</strong><small>{story.date} <i>·</i> {story.read}</small></span><SaveButton story={story} /></div></header><figure className="article-figure"><PublisherImage story={story} loading="eager" /><figcaption>{story.location} <span>{story.sourceName || 'Briefa preview'}</span></figcaption></figure><div className="article-body"><aside className="article-aside"><span className="eyebrow">IN THIS STORY</span><a href="#article-start">The bigger picture</a><a href="#article-source">Source information <ArrowUpRight size={13} /></a></aside><div className="article-copy" id="article-start">{story.paragraphs.map((paragraph, index) => <p key={paragraph} className={index === 0 ? 'article-lede' : ''}>{paragraph}</p>)}<div className="source-note" id="article-source"><div className="source-note-icon"><Globe2 size={19} /></div><div className="source-note-copy"><span className="eyebrow">VERIFY AT THE SOURCE</span><strong>{story.sourceName || 'Original publisher'}</strong><p>Read the full report and confirm the details directly with the publisher.</p></div>{story.sourceUrl ? <a className="source-action" href={story.sourceUrl} target="_blank" rel="noreferrer">Visit source <ArrowUpRight size={16} /></a> : <span className="source-action is-disabled">Source unavailable</span>}</div></div></div></article>{related.length > 0 && <section className="related-section"><SectionHeading eyebrow="KEEP EXPLORING" title="More worth your time" /><div className="story-grid">{related.map((item) => <StoryCard key={item.id} story={item} />)}</div></section>}</main>
}

function SavedPage() {
  const { stories } = useStories()
  const { saved } = useContext(SavedContext)
  const savedStories = stories.filter((story) => saved.includes(story.id))
  return <main className="page-shell category-page saved-page"><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><span>Saved stories</span></div><section className="category-intro"><span className="eyebrow">YOUR READING LIST</span><h1>Saved<span className="title-period">.</span></h1><p>Stories worth coming back to, all in one place.</p><span className="category-count">{savedStories.length} SAVED {savedStories.length === 1 ? 'STORY' : 'STORIES'}</span></section>{savedStories.length ? <div className="story-grid">{savedStories.map((story) => <StoryCard key={story.id} story={story} />)}</div> : <div className="coming-soon empty-saved"><Bookmark size={22} /><span className="eyebrow">A LITTLE SPACE FOR LATER</span><p>Your reading list is waiting. Save a story that catches your eye and it’ll be here next time.</p><Link className="text-link" to="/category/news">Explore the latest <ArrowRight size={15} /></Link></div>}</main>
}

function AboutPage() {
  return <main className="page-shell about-page"><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><span>About Briefa</span></div><section className="about-hero"><span className="eyebrow">A NOTE FROM BRIEFA</span><h1>Good information<br />moves us <em>forward.</em></h1><p>We make it easier to stay informed, find what’s next, and see the bigger picture.</p><span className="about-big-mark">B.</span></section><section className="about-details"><div><span className="eyebrow">OUR POINT OF VIEW</span><h2>Curious about the world.<br />Grounded in the continent.</h2></div><div><p>Briefa is an independent editorial platform connecting the stories that matter with opportunities that move people forward.</p><p>We believe useful information should be clear, considered, and connected to its source. That means thoughtful context over noise, original links over copies, and a wide lens on the people shaping what comes next.</p><Link className="text-link" to="/category/news">Explore what we cover <ArrowRight size={15} /></Link></div></section><Newsletter /></main>
}

function SourcesPage() {
  const { sources, refreshedAt } = useStories()
  const updated = refreshedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(refreshedAt)) : 'Awaiting first sync'
  const allSourceGroups = [...sourceGroups, { name: 'Live platforms', sources: livePlatformLinks }, { name: 'Trending short videos', sources: trendingVideoPlatforms.map((platform) => ({ ...platform, description: `${platform.label} on ${platform.name}.` })) }]
  return <main className="page-shell sources-page"><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><span>Sources</span></div><section className="category-intro"><span className="eyebrow">HOW WE STAY INFORMED</span><h1>Sources<span className="title-period">.</span></h1><p>Publishers, institutions, and opportunity boards to explore at the original source.</p></section><section className="source-group"><SectionHeading eyebrow={`LAST SYNC · ${updated.toUpperCase()}`} title="Connected feeds" /><div className="source-grid">{sources.map((source) => <article className="source-item" key={source.name}><span className="source-item-top"><span className={`source-health ${source.status === 'ok' ? 'is-connected' : 'is-disconnected'}`}><span />{source.status === 'ok' ? 'Connected' : 'Unavailable'}</span><ArrowUpRight size={17} /></span><strong>{source.name}</strong><p>{source.status === 'ok' ? 'Live items are collected and linked to their original publisher.' : source.error || 'This source will be retried on the next sync.'}</p><span className="source-url">{source.status === 'ok' ? 'RSS/API feed' : 'Retrying automatically'}</span></article>)}</div></section><p className="sources-note">We use public RSS feeds and search feeds where direct APIs require credentials. Every live story links to its original source. Some publishers and social platforms require separate access approval before automatic collection is available.</p>{allSourceGroups.map((group) => <section className="source-group" key={group.name}><SectionHeading eyebrow="PUBLISHERS & INSTITUTIONS" title={group.name} /><div className="source-grid">{group.sources.map((source) => <a href={source.url} className="source-item" key={source.name} target="_blank" rel="noreferrer"><span className="source-item-top"><span className="source-mark">{source.name.slice(0, 1)}</span><ArrowUpRight size={17} /></span><strong>{source.name}</strong><p>{source.description}</p><span className="source-url">{new URL(source.url).hostname}</span></a>)}</div></section>)}</main>
}

function LivePage() {
  const { sources, refreshedAt } = useStories()
  const activeSources = sources.filter((source) => source.status === 'ok').length
  const updated = refreshedAt ? new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date(refreshedAt)) : 'pending'
  return <main className="page-shell live-page"><section className="live-hero"><div className="live-hero-copy"><span className="live-pill"><span className="live-dot" aria-hidden="true" /> Live now</span><h1>Fresh reporting, moving in real time.</h1><p>Developing stories, quick updates, and trusted sources for what matters now.</p><Link className="text-link" to="/">Back to homepage <ArrowRight size={15} /></Link></div><div className="live-hero-panel"><div className="live-hero-stat"><strong>{String(sources.length).padStart(2, '0')}</strong><span>configured feeds</span></div><div className="live-hero-stat"><strong>{String(activeSources).padStart(2, '0')}</strong><span>connected now</span></div><div className="live-hero-stat"><strong>15m</strong><span>refresh interval</span></div></div></section><section className="source-group"><SectionHeading eyebrow="DIRECT LIVE LINKS FROM PHASE TWO" title="Watch live at the source" /><div className="live-grid">{livePlatformLinks.map((item) => <a key={item.name} href={item.url} className="live-card" target="_blank" rel="noreferrer"><span className="live-card-top"><span className="live-pill"><span className="live-dot" aria-hidden="true" />PLATFORM</span><ArrowUpRight size={16} /></span><strong>{item.name}</strong><p>{item.description}</p></a>)}</div></section><section className="source-group"><SectionHeading eyebrow="LIVE RSS/API HEALTH" title={`Connected feeds · ${activeSources}/${sources.length}`} /><div className="live-grid">{sources.map((item) => <a key={item.name} href={item.url} className="live-card" target="_blank" rel="noreferrer"><span className="live-card-top"><span className={`live-pill ${item.status === 'ok' ? '' : 'is-offline'}`}><span className="live-dot" aria-hidden="true" />{item.status === 'ok' ? 'CONNECTED' : 'RETRYING'}</span><ArrowUpRight size={16} /></span><strong>{item.name}</strong><p>{item.status === 'ok' ? `Feed connected. Last checked ${updated}.` : item.error || 'This source will be retried on the next sync.'}</p></a>)}</div></section></main>
}

function AppFrame({ theme }) {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  // Privacy-conscious basic analytics: aggregate page views and device class without collecting personal identifiers.
  useEffect(() => {
    if (isAdmin) return
    try {
      const key = 'briefa-analytics-events'
      const events = JSON.parse(localStorage.getItem(key) || '[]')
      const ua = navigator.userAgent || ''
      const device = /tablet|ipad/i.test(ua) ? 'Tablet' : /mobile|android|iphone/i.test(ua) ? 'Mobile' : 'Desktop'
      events.push({ path: location.pathname, title: document.title || location.pathname, device, at: new Date().toISOString() })
      localStorage.setItem(key, JSON.stringify(events.slice(-10000)))
    } catch { /* analytics must never interrupt navigation */ }
  }, [location.pathname, isAdmin])

  return (
    <div className="site-wrap" data-theme={theme}>
      {!isAdmin && <Header />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/jobs/tenders" element={<TendersPage />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/story/:id" element={<StoryPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
      {!isAdmin && <Footer />}
    </div>
  )
}

function App() {
  const [saved, setSaved] = useState(readSaved)
  const [feed, setFeed] = useState({ stories: [], sources: [], refreshedAt: null, aiStatus: 'not_configured', imageGenerationAvailable: false, trendingVideos: [] })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [feedError, setFeedError] = useState('')
  const requestInFlight = useRef(false)
  const feedStoriesRef = useRef([])
  const [locale, setLocale] = useState(() => localStorage.getItem('briefa-locale') || 'en')
  const [theme, setTheme] = useState(() => localStorage.getItem('briefa-theme') || 'light')
  const [settingsVersion, setSettingsVersion] = useState(0)
  useEffect(() => { const onSettingsUpdate = () => setSettingsVersion((value) => value + 1); window.addEventListener('briefa-settings-updated', onSettingsUpdate); return () => window.removeEventListener('briefa-settings-updated', onSettingsUpdate) }, [])
  const loadStories = useCallback(async (force = false) => {
    if (requestInFlight.current) return
    requestInFlight.current = true
    if (force) setRefreshing(true)
    try {
      const response = await fetch(`/api/stories${force ? '?refresh=true' : ''}`, { cache: 'no-store', signal: AbortSignal.timeout(12000) })
      if (!response.ok) throw new Error(`Feed API returned ${response.status}`)
      const result = await response.json()
      const liveItems = (Array.isArray(result.items) ? result.items : []).map((item) => ({ ...item, image: item.image || '' }))
      let managedItems = []
      let allManagedItems = []
      try {
        allManagedItems = JSON.parse(localStorage.getItem('briefa-admin-listings') || '[]').filter((item) => item && item.id)
        managedItems = allManagedItems
          .filter((item) => item.published && item.title && item.summary)
          .map((item) => ({
            ...item,
            category: item.category === 'Tenders' ? 'Jobs' : item.category,
            tag: item.category === 'Tenders' ? (item.tag || 'Tender') : (item.tag || item.category),
            sourceName: item.organization || 'Briefa',
            author: item.organization || 'Briefa',
            sourceUrl: item.sourceUrl || '',
            date: item.date || new Date(item.createdAt || Date.now()).toISOString().slice(0, 10),
            read: item.location || 'See listing',
            image: item.image || '',
            location: item.location || 'See listing',
          }))
      } catch {}
      const managedIds = new Set(allManagedItems.map((item) => item.id))
      const apiItems = liveItems
      const items = [...managedItems, ...apiItems.filter((item) => !managedIds.has(item.id))]
      const sources = Array.isArray(result.sources) ? result.sources : []
      if (!items.length && sources.length && sources.every((source) => source.status !== 'ok')) throw new Error('Live sources are currently unavailable')
      feedStoriesRef.current = items
      setFeed({ stories: items, sources, refreshedAt: result.refreshedAt, aiStatus: result.aiStatus || 'not_configured', imageGenerationAvailable: Boolean(result.imageGenerationAvailable), trendingVideos: Array.isArray(result.trendingVideos) ? result.trendingVideos : [] })
      setFeedError('')
    } catch {
      setFeed((current) => ({ ...current, stories: current.stories }))
      setFeedError('Live sources are temporarily unavailable. Previously loaded stories remain available while sources reconnect.')
    } finally {
      setLoading(false)
      setRefreshing(false)
      requestInFlight.current = false
    }
  }, [])
  const forceRefresh = useCallback(() => loadStories(true), [loadStories])
  useEffect(() => {
    const refreshAfterAdminChange = () => loadStories()
    window.addEventListener('briefa-admin-content-updated', refreshAfterAdminChange)
    window.addEventListener('briefa-breaking-updated', refreshAfterAdminChange)
    return () => {
      window.removeEventListener('briefa-admin-content-updated', refreshAfterAdminChange)
      window.removeEventListener('briefa-breaking-updated', refreshAfterAdminChange)
    }
  }, [loadStories])
  const generateStoryImage = useCallback(async (id) => {
    const response = await fetch(`/api/stories/${id}/image`, { method: 'POST' })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Could not generate a story image.')
    let generatedImages = {}
    try { generatedImages = JSON.parse(localStorage.getItem('briefa-generated-images') || '{}') } catch {}
    generatedImages[id] = result.image
    localStorage.setItem('briefa-generated-images', JSON.stringify(generatedImages))
    setFeed((current) => ({ ...current, stories: current.stories.map((story) => story.id === id ? { ...story, image: result.image } : story) }))
    return result.image
  }, [])
  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadStories(), 0)
    // Publisher image metadata is enriched in the background; re-read the cached feed once so
    // the two Rwanda publisher slides can appear without making the initial homepage load wait.
    const imageEnrichmentRefresh = window.setTimeout(() => { if (document.visibilityState === 'visible') loadStories(false) }, 8000)
    // Keep the public feed fresh automatically, regardless of local admin preferences.
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') loadStories(false) }, 10 * 60 * 1000)
    return () => {
      window.clearTimeout(initialLoad)
      window.clearTimeout(imageEnrichmentRefresh)
      window.clearInterval(timer)
    }
  }, [loadStories, settingsVersion])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('briefa-theme', theme)
  }, [theme])
  useEffect(() => {
    document.documentElement.lang = localeNames[locale]
    localStorage.setItem('briefa-locale', locale)
  }, [locale])
  const toggleSaved = (id) => setSaved((current) => {
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    localStorage.setItem('briefa-saved', JSON.stringify(next))
    return next
  })
  const managedStories = (() => { try { return JSON.parse(localStorage.getItem('briefa-admin-listings') || '[]') } catch { return [] } })()
  const pinnedBreaking = (() => { try { return JSON.parse(localStorage.getItem('briefa-breaking-pinned') || '[]') } catch { return [] } })()
  const managedPublicStories = managedStories.filter((item) => item.published).map((item) => ({ ...item, id: item.id, category: item.category === 'Tenders' ? 'Opportunities' : item.category, author: item.organization || 'Briefa', date: item.date || item.createdAt || '', read: item.location || 'See listing', location: item.location || '', image: item.image || '', paragraphs: [item.summary || ''], topics: [...(item.topics || []), ...(pinnedBreaking.includes(item.id) ? ['Breaking'] : []), ...(item.featured ? ['Featured'] : [])], sourceUrl: item.sourceUrl || '' }))
  const liveStoriesWithPins = feed.stories.map((story) => pinnedBreaking.includes(story.id) ? { ...story, topics: [...new Set([...(story.topics || []), 'Breaking'])] } : story)
  const allPublicStories = [...managedPublicStories, ...liveStoriesWithPins]
  const pinnedStories = allPublicStories.filter((story) => pinnedBreaking.includes(story.id))
  const regularStories = allPublicStories.filter((story) => !pinnedBreaking.includes(story.id))
  const storyContext = { ...feed, stories: [...pinnedStories, ...regularStories], loading, error: feedError, refreshing, refresh: forceRefresh, generateStoryImage }
  return <StoriesContext.Provider value={storyContext}><LocaleContext.Provider value={{ locale, setLocale, theme, setTheme }}><SavedContext.Provider value={{ saved, toggleSaved }}><BrowserRouter><ScrollToTop /><AppFrame theme={theme} /></BrowserRouter></SavedContext.Provider></LocaleContext.Provider></StoriesContext.Provider>
}

export default App
