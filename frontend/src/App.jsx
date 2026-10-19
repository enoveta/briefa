import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, CalendarDays, Check, ChevronDown, ChevronRight, Globe2, MapPin, Menu, Moon, Play, RefreshCw, Search, SlidersHorizontal, Sun, Tag, WandSparkles, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import briefaLogo from '../../BRIEF Logo.png'
import { livePlatformLinks, sourceGroups, sourcesForCategory, trendingVideoPlatforms } from './data/sources.js'
import './App.css'

const categories = ['News', 'Jobs', 'Scholarships', 'Opportunities', 'Events']
const LocaleContext = createContext({ locale: 'en', setLocale: () => {}, theme: 'light', setTheme: () => {} })
const localeNames = { en: 'en', fr: 'fr-FR', rw: 'rw-RW' }
const interfaceCopy = {
  en: { slogan: 'INDEPENDENT. INFORMED. AFRICAN.', letter: 'The Briefa letter', subscribe: 'Subscribe', about: 'About', saved: 'Saved', search: 'Search Briefa', sources: 'Sources', explore: 'EXPLORE', brand: 'BRIEFA', nav: ['News', 'Jobs', 'Scholarships', 'Opportunities', 'Events'], language: 'Language', dark: 'Switch to dark mode', light: 'Switch to light mode' },
  fr: { slogan: 'INDÉPENDANT. INFORMÉ. AFRICAIN.', letter: 'La lettre Briefa', subscribe: 'S’abonner', about: 'À propos', saved: 'Enregistrés', search: 'Rechercher sur Briefa', sources: 'Sources', explore: 'EXPLORER', brand: 'BRIEFA', nav: ['Actualités', 'Emplois', 'Bourses', 'Opportunités', 'Événements'], language: 'Langue', dark: 'Activer le mode sombre', light: 'Activer le mode clair' },
  rw: { slogan: 'YIGENGA. YIZEWE. NYAFURIKA.', letter: 'Ibaruwa ya Briefa', subscribe: 'Iyandikishe', about: 'Ibyerekeye', saved: 'Byabitswe', search: 'Shakisha kuri Briefa', sources: 'Aho amakuru aturuka', explore: 'SHAKISHA', brand: 'BRIEFA', nav: ['Amakuru', 'Imirimo', 'Buruse', 'Amahirwe', 'Ibirori'], language: 'Ururimi', dark: 'Koresha ibara ryijimye', light: 'Koresha ibara ryerurutse' },
}
const categoryTopics = {
  News: ['Breaking', 'Trending Now', 'Rwanda (Local)', 'Africa', 'World', 'Politics & Governance', 'Business & Economy', 'Finance & Markets', 'Technology & Innovation', 'Startups', 'Science & Research', 'Environment & Climate', 'Agriculture & Food', 'Energy', 'Health & Public Health', 'Education', 'Crime', 'Justice & Public Safety', 'Security & Conflict', 'Sports', 'Entertainment & Culture', 'Travel & Tourism', 'Community & Human Interest'],
  Jobs: ['Remote', 'International Organizations (UN, NGOs)', 'Government & Public Sector', 'Tech & IT', 'Finance & Banking', 'Health & Medical', 'Engineering', 'Education & Research', 'Agriculture', 'Sales & Marketing', 'Media & Communications', 'Internships & Graduate Programs', 'Volunteering'],
  Scholarships: ['Undergraduate', 'Master’s', 'PhD', 'Fully Funded', 'Partially Funded', 'Fellowships', 'Exchange Programs', 'Research Grants', 'For Africans', 'Europe', 'USA & Canada', 'Asia', 'Africa'],
  Opportunities: ['Business & Investment', 'Startup Funding & Grants', 'Accelerators & Incubators', 'Competitions & Awards', 'Hackathons', 'Tenders & Calls for Proposals', 'Training Courses & Certifications'],
  Events: ['Upcoming Events', 'Local Announcements', 'International Announcements', 'Government & Institutional Notices', 'Emergency & Public Safety Alerts', 'Public Holidays & Important Dates', 'Elections', 'Exam Results & School Calendars', 'Conferences & Summits', 'Tech Events', 'Sports Events', 'Concerts & Entertainment', 'Commemorations & Anniversaries'],
}
const SavedContext = createContext({ saved: [], toggleSaved: () => {} })
const StoriesContext = createContext({ stories: [], sources: [], refreshedAt: null, aiStatus: 'not_configured', imageGenerationAvailable: false, trendingVideos: [], loading: true, error: '', refreshing: false, refresh: () => {}, generateStoryImage: async () => {} })

function useStories() {
  return useContext(StoriesContext)
}

const seedStories = [
  {
    id: 'africa-climate', category: 'News', tag: 'CLIMATE & ENERGY', topics: ['Breaking', 'Trending Now', 'Africa', 'Energy', 'Environment & Climate'],
    title: 'Africa’s next energy chapter is being written in its cities',
    summary: 'A new generation of local power projects is changing the way communities think about access, resilience, and who gets to build the future.',
    author: 'Nia Okafor', date: 'October 14, 2026', read: '6 min read', location: 'Kigali, Rwanda',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1800&q=85',
    paragraphs: [
      'Across the continent, a quieter energy transition is taking shape one neighborhood at a time. From community solar to new city-backed microgrids, local teams are finding practical ways to make reliable power part of daily life.',
      'The projects are modest compared with the region’s largest infrastructure plans, but their importance is hard to overstate. Reliable power means longer clinic hours, safer public spaces, and more room for small businesses to grow.',
      'What comes next will depend on whether public institutions can keep pace with the people already doing the work. The strongest examples put local ownership, transparent financing, and long-term maintenance at the center.'
    ],
  },
  {
    id: 'rwanda-innovation', category: 'News', tag: 'RWANDA', topics: ['Trending Now', 'Rwanda (Local)', 'Technology & Innovation', 'Startups', 'Business & Economy'],
    title: 'Kigali’s innovation district opens its doors to a new wave of founders',
    summary: 'The city’s latest hub brings research teams, early-stage companies, and public services under one roof.',
    author: 'Patrick Mutesi', date: 'October 13, 2026', read: '4 min read', location: 'Kigali, Rwanda',
    image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['A new shared workspace for early-stage companies has opened in Kigali, bringing founders closer to research partners and public services.', 'The district will host open programming for builders, investors, and students through the end of the year. Organizers say the goal is to make collaboration easier and more accessible.', 'Its first cohort includes teams working in climate data, digital finance, and logistics.'],
  },
  {
    id: 'health-data', category: 'News', tag: 'AFRICA', topics: ['Africa', 'World', 'Health & Public Health', 'Science & Research'],
    title: 'What better health data means for the clinics that need it most',
    summary: 'Regional health teams are building more connected systems, with frontline staff helping shape the tools.',
    author: 'Amara Diallo', date: 'October 12, 2026', read: '5 min read', location: 'Nairobi, Kenya',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['Health teams are connecting local records to make supplies and staffing easier to plan.', 'The work puts frontline workers in the room early, helping ensure a new system solves the problems they actually face.', 'Several pilots are expected to share results before the end of the year.'],
  },
  {
    id: 'climate-fellowship', category: 'Scholarships', tag: 'FULLY FUNDED', topics: ['Fully Funded', 'Fellowships', 'For Africans', 'Research Grants'],
    title: 'The 2027 climate leadership fellowship is now accepting applications',
    summary: 'Early-career leaders can apply for a year of training, mentorship, and project support across Africa.',
    author: 'Briefa Opportunities Desk', date: 'October 14, 2026', read: '3 min read', location: 'Africa-wide',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['The fellowship invites early-career leaders working on climate resilience to apply for its 2027 cohort.', 'Selected fellows receive mentorship, training, and project support over a 12-month program. Applicants should be based in an African country and demonstrate experience working with local communities.', 'Applications close November 28, 2026. Visit the original program page to review eligibility and submit your application.'],
  },
  {
    id: 'un-programme', category: 'Jobs', tag: 'UNITED NATIONS', topics: ['International Organizations (UN, NGOs)', 'Education & Research'],
    title: 'Programme Officer, Youth Innovation',
    summary: 'Help build programmes that connect young entrepreneurs with the resources to scale their ideas.',
    author: 'UNDP', date: 'Closes November 02, 2026', read: 'Kigali · Hybrid', location: 'Kigali, Rwanda',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['The United Nations Development Programme is seeking a Programme Officer to support youth-led innovation initiatives in Rwanda.', 'The position works across public and private partners to design practical programs, track outcomes, and help local founders access mentorship and finance.', 'Applications close November 2, 2026. Review the full requirements and apply through the original listing.'],
  },
  {
    id: 'regional-climate-analyst', category: 'Jobs', tag: 'CLIMATE & RESEARCH', topics: ['Remote', 'Environment & Climate', 'Science & Research'],
    title: 'Regional Climate Data Analyst',
    summary: 'Turn climate research into clear insights that help communities and policy teams plan for resilience.',
    author: 'Briefa Demo Listings', date: 'Closes November 18, 2026', read: 'Nairobi · Hybrid', location: 'Nairobi, Kenya',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['This sample role supports regional teams translating climate research into practical planning tools.', 'The analyst will work with researchers, local partners, and public institutions to build useful datasets and communicate findings.', 'This is demo listing content for the Briefa preview. Confirm details with the original employer before applying.'],
  },
  {
    id: 'digital-health-coordinator', category: 'Jobs', tag: 'PUBLIC HEALTH', topics: ['Health & Medical', 'International Organizations (UN, NGOs)'],
    title: 'Digital Health Programme Coordinator',
    summary: 'Help health teams introduce practical digital tools and strengthen services across partner clinics.',
    author: 'Briefa Demo Listings', date: 'Closes November 24, 2026', read: 'Kampala · Full-time', location: 'Kampala, Uganda',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['This sample position coordinates pilot projects that help clinics use digital tools in day-to-day care.', 'The role brings together clinical staff, technology teams, and community partners to support implementation and training.', 'This is demo listing content for the Briefa preview. Confirm details with the original employer before applying.'],
  },
  {
    id: 'fintech-product-designer', category: 'Jobs', tag: 'TECHNOLOGY', topics: ['Tech & IT', 'Startups', 'Finance & Banking'],
    title: 'Product Designer, Small Business Finance',
    summary: 'Design accessible financial tools around the real working lives of independent businesses.',
    author: 'Briefa Demo Listings', date: 'Closes December 01, 2026', read: 'Lagos · Hybrid', location: 'Lagos, Nigeria',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['This sample design role focuses on digital services for small businesses and independent retailers.', 'The designer will collaborate with research, product, and engineering teams to make everyday financial tasks simpler.', 'This is demo listing content for the Briefa preview. Confirm details with the original employer before applying.'],
  },
  {
    id: 'agriculture-partnerships-lead', category: 'Jobs', tag: 'FOOD SYSTEMS', topics: ['Agriculture', 'Government & Public Sector'],
    title: 'Agriculture Partnerships Lead',
    summary: 'Build partnerships that connect local producers with training, tools, and stronger markets.',
    author: 'Briefa Demo Listings', date: 'Closes December 08, 2026', read: 'Kigali · Full-time', location: 'Kigali, Rwanda',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['This sample role develops partnerships for farmer-focused training and market access programmes.', 'The lead will coordinate with cooperatives, public agencies, and private sector teams across the region.', 'This is demo listing content for the Briefa preview. Confirm details with the original employer before applying.'],
  },
  {
    id: 'ocean-grant', category: 'Opportunities', tag: 'GRANT · $25,000', topics: ['Startup Funding & Grants', 'Tenders & Calls for Proposals', 'Business & Investment'],
    title: 'Small grants, meaningful change: applications open for ocean innovators',
    summary: 'A new fund is backing community-led ideas for healthier coastlines and stronger blue economies.',
    author: 'Briefa Opportunities Desk', date: 'October 11, 2026', read: '4 min read', location: 'East Africa',
    image: 'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['A new regional fund will award small grants to community-led projects that protect marine ecosystems and livelihoods.', 'Applicants can request up to $25,000 for practical, locally driven work. A short concept note is the first step in the application process.', 'The deadline is November 18, 2026. Read the full call and requirements on the fund’s website.'],
  },
  {
    id: 'women-founders-accelerator', category: 'Opportunities', tag: 'ACCELERATOR', topics: ['Accelerators & Incubators', 'Business & Investment'],
    title: 'Applications open for the Women Founders Growth Lab',
    summary: 'A hands-on programme pairs early-stage founders with mentors, market access, and investor readiness support.',
    author: 'Briefa Demo Listings', date: 'Closes November 20, 2026', read: 'Virtual · Africa-wide', location: 'Africa-wide',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['This sample accelerator programme supports women-led businesses preparing for their next stage of growth.', 'Participants receive practical workshops, mentor sessions, and introductions to regional business networks.', 'This is demo opportunity content for the Briefa preview. Check the organiser’s original page for eligibility and dates.'],
  },
  {
    id: 'clean-energy-challenge', category: 'Opportunities', tag: 'CHALLENGE · ENERGY', topics: ['Competitions & Awards', 'Business & Investment'],
    title: 'Clean energy innovators invited to a regional challenge',
    summary: 'Teams can pitch solutions that make reliable, affordable energy easier to access in growing cities.',
    author: 'Briefa Demo Listings', date: 'Closes November 27, 2026', read: 'Kigali · In person', location: 'Kigali, Rwanda',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['This sample challenge invites founders and researchers to present practical clean energy ideas.', 'Selected teams will receive feedback from technical mentors and meet potential implementation partners.', 'This is demo opportunity content for the Briefa preview. Check the organiser’s original page for eligibility and dates.'],
  },
  {
    id: 'digital-skills-fellowship', category: 'Opportunities', tag: 'FELLOWSHIP', topics: ['Training Courses & Certifications', 'Technology & Innovation'],
    title: 'Digital public services fellowship seeks its next cohort',
    summary: 'Join a cross-disciplinary cohort learning to build more inclusive and useful digital services.',
    author: 'Briefa Demo Listings', date: 'Closes December 04, 2026', read: 'Hybrid · East Africa', location: 'East Africa',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['This sample fellowship brings together people working on accessible public interest technology.', 'The cohort combines guided learning, peer exchange, and a small project developed with a local partner.', 'This is demo opportunity content for the Briefa preview. Check the organiser’s original page for eligibility and dates.'],
  },
  {
    id: 'community-food-innovation', category: 'Opportunities', tag: 'INNOVATION GRANT', topics: ['Startup Funding & Grants', 'Agriculture & Food'],
    title: 'Community food innovators can apply for seed support',
    summary: 'Small teams are invited to test ideas that improve local food systems and support producers.',
    author: 'Briefa Demo Listings', date: 'Closes December 12, 2026', read: 'Grant · Up to $10,000', location: 'Africa-wide',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['This sample grant supports early experiments that make local food systems more resilient.', 'Applicants may request seed funding for pilots developed with producer groups or community organisations.', 'This is demo opportunity content for the Briefa preview. Check the organiser’s original page for eligibility and dates.'],
  },
  {
    id: 'creative-summit', category: 'Events', tag: 'SUMMIT · NAIROBI', topics: ['Upcoming Events', 'International Announcements', 'Conferences & Summits', 'Concerts & Entertainment'], region: 'International', eventStatus: 'Upcoming',
    title: 'The people shaping Africa’s creative economy meet in Nairobi this month',
    summary: 'A two-day gathering will bring together artists, policymakers, and the businesses building new markets.',
    author: 'Briefa Culture Desk', date: 'October 10, 2026', read: 'October 28–29', location: 'Nairobi, Kenya',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['The Africa Creative Economy Summit returns to Nairobi this month with two days of talks, workshops, and exhibitions.', 'This year’s program brings artists and cultural leaders together with policymakers and business owners, with a focus on sustainable creative work.', 'The summit takes place October 28–29. Registration and the full schedule are available on the organizer’s website.'],
  },
  {
    id: 'women-founders', category: 'News', tag: 'BUSINESS', topics: ['Trending Now', 'Business & Economy', 'Finance & Markets', 'Technology & Innovation'],
    title: 'Meet the founders rethinking how small businesses get paid',
    summary: 'Across three markets, fintech teams are building around the daily realities of independent retailers.',
    author: 'Esther Mwangi', date: 'October 09, 2026', read: '7 min read', location: 'Lagos, Nigeria',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['Independent retailers have long had to make fragmented payment tools work for their businesses. A new group of founders is building products around how shops actually operate.', 'Their approach starts with listening: teams are working with retailers to understand cash flow, stock management, and the time pressures of running a small business.', 'The result is a new conversation about financial products designed to support, rather than complicate, everyday commerce.'],
  },
  {
    id: 'kigali-community-forum', category: 'Events', tag: 'COMMUNITY · KIGALI', topics: ['Local Announcements', 'Upcoming Events', 'Government & Institutional Notices'], region: 'Local', eventStatus: 'Upcoming',
    title: 'Kigali community forum puts public spaces on the agenda',
    summary: 'Residents, planners, and local organizations will meet for an open conversation about the city’s shared spaces.',
    author: 'Briefa Community Desk', date: 'October 22, 2026', read: 'Free · Registration open', location: 'Kigali, Rwanda',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['Kigali residents are invited to an open forum on the future of public spaces, bringing community groups, urban planners, and local officials together.', 'The evening will include short presentations and small-group discussions. Registration is free, with places available while capacity lasts.', 'The forum takes place October 22, 2026. This is sample event content for the Briefa website preview.'],
  },
  {
    id: 'kigali-culture-week', category: 'Events', tag: 'RECENT · KIGALI', topics: ['Local Announcements', 'Commemorations & Anniversaries', 'Concerts & Entertainment'], region: 'Local', eventStatus: 'Recent',
    title: 'A week of Kigali’s independent creative scene',
    summary: 'Artists, small venues, and cultural groups opened their doors for a citywide programme of performances and workshops.',
    author: 'Briefa Culture Desk', date: 'October 08, 2026', read: 'Past event · Kigali', location: 'Kigali, Rwanda',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['Independent artists and venues across Kigali hosted a week of performances, workshops, and open studios.', 'The programme connected local creatives with audiences and highlighted spaces making room for new work.', 'This recap is sample event content for the Briefa website preview.'],
  },
]

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

function StoryCard({ story, variant = 'standard' }) {
  const { imageGenerationAvailable, generateStoryImage } = useStories()
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
    <div className="story-visual"><Link to={`/story/${story.id}`} className="story-image-link"><img src={story.image} alt="" loading="lazy" /><span className="image-arrow"><ArrowUpRight size={16} /></span></Link>{imageGenerationAvailable && story.sourceUrl && <button className="story-image-ai" type="button" onClick={createImage} disabled={generatingImage} title={imageError || 'Create an AI cover based on this story'}><WandSparkles size={13} />{generatingImage ? 'Creating' : 'AI cover'}</button>}</div>
    <div className="story-card-copy"><div className="story-card-meta"><Link to={`/category/${story.category.toLowerCase()}`} className="eyebrow">{story.category}</Link><span>{story.read}</span></div><h3><Link to={`/story/${story.id}`}>{story.title}</Link></h3><p>{story.summary}</p><div className="story-byline"><span>{story.author}</span><span className="byline-dot">·</span><span>{story.date}</span><SaveButton story={story} /></div></div>
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
  const featured = stories.filter((story) => story.category === 'News').slice(0, 3)
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
    <AnimatePresence mode="wait"><motion.div key={story.id} className="feature-image" initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} exit={{ opacity: 0.7 }} transition={{ duration: 0.35 }}><Link to={`/story/${story.id}`} aria-label={`Read: ${story.title}`}><img src={story.image} alt="" /><span className="feature-image-caption"><Globe2 size={14} /> {story.location}</span></Link></motion.div></AnimatePresence>
    <div className="feature-copy"><div className="feature-kicker"><span className="live-dot" /> BREAKING <span className="kicker-line" /> {String(active + 1).padStart(2, '0')} / 03</div>
      <AnimatePresence mode="wait"><motion.div key={story.id} className="feature-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
        <Link to={`/category/${story.category.toLowerCase()}`} className="eyebrow">{story.tag}</Link><h1><Link to={`/story/${story.id}`}>{story.title}</Link></h1><p className="feature-summary">{story.summary}</p><div className="feature-byline"><span>By {story.author}</span><span className="byline-dot">·</span><span>{story.read}</span><span className="byline-dot">·</span><span>{story.location}</span></div><Link className="feature-cta" to={`/story/${story.id}`}>Read the story <ArrowRight size={16} /></Link>
      </motion.div></AnimatePresence>
      <div className="feature-controls"><div className="feature-dots">{featured.map((item, index) => <button key={item.id} onClick={() => setActive(index)} className={active === index ? 'is-active' : ''} aria-label={`Show featured story ${index + 1}`} />)}</div><div className="feature-arrows"><button onClick={() => changeSlide(-1)} aria-label="Previous story"><ArrowLeft size={17} /></button><button onClick={() => changeSlide(1)} aria-label="Next story"><ArrowRight size={17} /></button></div></div>
    </div>
  </section>
}

function DailyBriefRail() {
  const { stories } = useStories()
  const briefStories = stories.slice(1, 6)
  return <aside className="daily-brief-rail" aria-label="The Daily Brief">
    <div className="daily-brief-heading"><span className="eyebrow">THE DAILY BRIEF</span><span className="live-dot" /></div>
    <div className="daily-brief-window"><div className="daily-brief-track">
      {[...briefStories, ...briefStories].map((story, index) => <Link className="daily-brief-card" to={`/story/${story.id}`} key={`${story.id}-${index}`} aria-hidden={index >= briefStories.length} tabIndex={index >= briefStories.length ? -1 : undefined}>
        <img src={story.image} alt="" loading="lazy" /><span className="daily-brief-copy"><small>{story.category} · {story.tag}</small><strong>{story.title}</strong><span>{story.read}</span></span><ArrowUpRight size={14} />
      </Link>)}
    </div></div>
    <Link className="daily-brief-more" to="/category/news">All stories <ArrowRight size={14} /></Link>
  </aside>
}

function CategoryShowcase({ category, title, description, count }) {
  const { stories, loading } = useStories()
  const categoryStories = stories.filter((story) => story.category === category)
  const slides = categoryStories
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
            {[...scholarshipStories, ...scholarshipStories].map((item, index) => <Link key={`${item.id}-${index}`} to={`/story/${item.id}`} className="scholarship-card">
              <img src={item.image} alt="" loading="lazy" />
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
    const jobStory = categoryStories[active % categoryStories.length] || story
    return <section className="category-intro category-showcase category-showcase--jobs">
      <div className="jobs-hero">
        <AnimatePresence mode="wait"><motion.div className="jobs-hero-image" key={jobStory.id} initial={{ opacity: 0.55, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0.55 }} transition={{ duration: 0.4 }}><Link to={`/story/${jobStory.id}`} aria-label={`Read: ${jobStory.title}`}><img src={jobStory.image} alt="" /><span className="jobs-hero-shade" /></Link></motion.div></AnimatePresence>
        <AnimatePresence mode="wait"><motion.div className="jobs-hero-copy" key={`${jobStory.id}-copy`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}><span className="jobs-hero-label">Featured role · {jobStory.tag}</span><h2><Link to={`/story/${jobStory.id}`}>{jobStory.title}</Link></h2><p>{jobStory.summary}</p><Link className="jobs-hero-link" to={`/story/${jobStory.id}`}>Explore this role <ArrowRight size={15} /></Link></motion.div></AnimatePresence>
        <AnimatePresence mode="wait"><motion.aside className="jobs-hero-aside" key={`${jobStory.id}-details`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.25 }}><span>ROLE DETAILS</span><strong>{jobStory.read}</strong><i /><span>APPLICATION DEADLINE</span><strong>{jobStory.date.replace('Closes ', '')}</strong><span className="jobs-hero-location"><MapPin size={14} /> {jobStory.location}</span></motion.aside></AnimatePresence>
        <div className="jobs-hero-controls"><button type="button" aria-label="Previous job" onClick={() => setActive((current) => (current - 1 + slides.length) % slides.length)}><ArrowLeft size={16} /></button><div>{categoryStories.map((item, index) => <button key={item.id} type="button" className={index === active ? 'is-active' : ''} aria-label={`Show ${item.title}`} aria-pressed={index === active} onClick={() => setActive(index)} />)}</div><button type="button" aria-label="Next job" onClick={() => setActive((current) => (current + 1) % slides.length)}><ArrowRight size={16} /></button></div>
      </div>
    </section>
  }

  return <section className={`category-intro category-showcase category-showcase--${category.toLowerCase()}`}>
    <div className="showcase-copy"><span className="showcase-badge">{titleLabel.toUpperCase()}</span><p>{description}</p><span className="category-count">{count} STORIES & OPPORTUNITIES</span></div>
    <div className="showcase-media">
      <motion.div className="showcase-slide" key={story.id} initial={{ opacity: 0.65 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}><Link to={isCategoryStory ? `/story/${story.id}` : `/category/${category.toLowerCase()}`} aria-label={isCategoryStory ? `Read: ${story.title}` : `Browse ${title}`}><img src={story.image} alt="" /><span className="showcase-caption">{isCategoryStory ? story.tag : `${title} · IN FOCUS`}<strong>{isCategoryStory ? story.title : description}</strong></span></Link></motion.div>
      {slides.length > 1 && <div className="showcase-dots" aria-label={`${title} featured stories`}>{slides.map((item, index) => <button key={item.id} aria-label={`Show ${title} image ${index + 1}`} aria-pressed={index === active} className={index === active ? 'is-active' : ''} onClick={() => setActive(index)} />)}</div>}
    </div>
  </section>
}

function TrendingStories() {
  const { stories } = useStories()
  return <section className="trending-section"><SectionHeading eyebrow="THE LATEST FROM OUR SOURCES" title="In focus" to="/category/news" /><div className="trending-list">{stories.slice(0, 3).map((story, index) => <Link to={`/story/${story.id}`} className="trending-item" key={story.id}><span className="trending-number">0{index + 1}</span><span><span className="eyebrow">{story.category} · {story.tag}</span><strong>{story.title}</strong></span><ArrowUpRight size={17} /></Link>)}</div></section>
}

function TrendingPhotoRail() {
  const { stories } = useStories()
  const photoStories = stories.slice(0, 3)
  return <aside className="daily-brief-rail trending-photo-rail" aria-label="Trending photos">
    <div className="daily-brief-heading"><span className="eyebrow">TRENDING PHOTOS</span><span className="live-dot" /></div>
    <div className="daily-brief-window"><div className="daily-brief-track">
      {[...photoStories, ...photoStories].map((story, index) => <Link className="daily-brief-card" to={`/story/${story.id}`} key={`${story.id}-${index}`} aria-hidden={index >= photoStories.length} tabIndex={index >= photoStories.length ? -1 : undefined}>
        <img src={story.image} alt="" loading="lazy" /><span className="daily-brief-copy"><small>{story.category} · {story.tag}</small><strong>{story.title}</strong></span><ArrowUpRight size={14} />
      </Link>)}
    </div></div>
    <Link className="daily-brief-more" to="/category/news">All photos <ArrowRight size={14} /></Link>
  </aside>
}

function TrendingVideoSection() {
  const { trendingVideos } = useStories()
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (trendingVideos.length < 2) return undefined
    const timer = window.setInterval(() => setActive((current) => (current + 1) % trendingVideos.length), 10000)
    return () => window.clearInterval(timer)
  }, [trendingVideos.length])
  const video = trendingVideos.length ? trendingVideos[active % trendingVideos.length] : null
  return <section className="video-highlights"><div className="video-main"><div className="video-heading"><div><span className="eyebrow">FROM THE PLATFORMS YOU NAMED</span><h2>{video ? 'TRENDING SHORTS' : 'VIDEO DISCOVERY'}</h2></div><span className="video-demo-note">{video ? `${String(active + 1).padStart(2, '0')} / ${String(trendingVideos.length).padStart(2, '0')}` : 'LIVE PLATFORM REEL'}</span></div>{video ? <div className="video-feature"><iframe src={video.embedUrl} title={video.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" /><div className="video-feature-copy"><span>{video.channelTitle} · {Number(video.viewCount).toLocaleString()} views</span><strong>{video.title}</strong><a href={video.url} target="_blank" rel="noreferrer">Watch on YouTube <ArrowUpRight size={14} /></a></div><div className="video-feature-controls"><button type="button" aria-label="Previous video" onClick={() => setActive((current) => (current - 1 + trendingVideos.length) % trendingVideos.length)}><ArrowLeft size={16} /></button><button type="button" aria-label="Next video" onClick={() => setActive((current) => (current + 1) % trendingVideos.length)}><ArrowRight size={16} /></button></div></div> : <div className="video-platform-viewport"><div className="video-platform-track">{[...trendingVideoPlatforms, ...trendingVideoPlatforms].map((platform, index) => <a className="video-platform-card" href={platform.url} key={`${platform.name}-${index}`} target="_blank" rel="noreferrer" aria-hidden={index >= trendingVideoPlatforms.length}><span>{platform.name}</span><strong>{platform.label}</strong><Play size={18} /></a>)}</div></div>}<p className="video-access-note">{video ? 'Live YouTube Shorts · rotating automatically' : 'Platform reel · connect a YouTube API key to play live Shorts here'}</p></div><TrendingPhotoRail /></section>
}

function CategorySources({ category }) {
  const sources = sourcesForCategory(category)
  return <nav className="category-source-list" aria-label={`${category} source platforms`}><span>OFFICIAL SOURCES</span>{sources.map((source) => <a href={source.url} key={source.name} target="_blank" rel="noreferrer" title={source.description}>{source.name}<ArrowUpRight size={12} /></a>)}</nav>
}

function CategoryPreview({ category }) {
  const { stories } = useStories()
  const sectionName = category === 'Events' ? 'Events & Announcements' : category
  const sectionStories = stories.filter((story) => story.category === category).slice(0, 3)
  const topics = categoryTopics[category].slice(0, 5)
  return <section className={`category-preview preview-${category.toLowerCase()}`}><SectionHeading eyebrow={`THE LATEST IN ${sectionName.toUpperCase()}`} title={sectionName} to={`/category/${category.toLowerCase()}`} linkLabel={`All ${sectionName}`} /><nav className="preview-topics" aria-label={`${sectionName} topics`}><span>EXPLORE</span>{topics.map((topic) => <Link key={topic} to={`/category/${category.toLowerCase()}?topic=${encodeURIComponent(topic)}`}>{topic}</Link>)}</nav><div className="story-grid preview-story-grid">{sectionStories.map((story) => <StoryCard key={story.id} story={story} />)}</div><CategorySources category={category} /></section>
}

function HomePage() {
  const { refreshedAt } = useStories()
  const edition = refreshedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(refreshedAt)) : 'Waiting for live sources'
  return <main className="page-shell home-page">
    <FeedStatus />
    <div className="edition-line"><span>YOUR WINDOW TO WHAT MATTERS</span><span className="edition-rule" /><span>LIVE EDITION &nbsp;·&nbsp; {edition.toUpperCase()}</span></div>
    <div className="home-lead-grid"><FeaturedStory /><DailyBriefRail /></div>
    <TrendingStories />
    <CategoryPreview category="News" />
    <TrendingVideoSection />
    {categories.filter((category) => category !== 'News').map((category) => <CategoryPreview key={category} category={category} />)}
    <section className="sources-promo"><div><span className="eyebrow">CLEAR PROVENANCE</span><h2>Good reporting starts with good sources.</h2><p>Explore the publishers, institutions, and opportunity boards we look to.</p></div><Link className="text-link" to="/sources">Browse our sources <ArrowRight size={15} /></Link></section>
    <Newsletter />
  </main>
}

function CategoryPage() {
  const { category } = useParams()
  const { stories } = useStories()
  const title = categories.find((item) => item.toLowerCase() === category?.toLowerCase()) || 'News'
  const [searchParams, setSearchParams] = useSearchParams()
  const [openFilter, setOpenFilter] = useState('')
  const selectedTopic = searchParams.get('topic') || 'All'
  const selectedRegion = searchParams.get('region') || 'All'
  const selectedStatus = searchParams.get('status') || 'All'
  const selectedCountry = searchParams.get('country') || 'All'
  const selectedDate = searchParams.get('date') || 'All'
  const dateWindows = { '24h': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000, '30d': 30 * 24 * 60 * 60 * 1000 }
  const [now] = useState(() => Date.now())
  const titleLabel = title === 'Events' ? 'Events & Announcements' : title
  const filtered = stories.filter((story) => story.category === title && (selectedTopic === 'All' || story.topics?.includes(selectedTopic)) && (selectedCountry === 'All' || story.country === selectedCountry) && (!dateWindows[selectedDate] || now - Date.parse(story.publishedAt) <= dateWindows[selectedDate]) && (title !== 'Events' || selectedRegion === 'All' || story.region === selectedRegion) && (title !== 'Events' || selectedStatus === 'All' || story.eventStatus === selectedStatus))
  const updateFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams)
    if (value === 'All') nextParams.delete(key)
    else nextParams.set(key, value)
    setSearchParams(nextParams)
  }
  const selectClass = (key, value) => (searchParams.get(key) || 'All') === value ? 'is-active' : ''
  return <main className="page-shell category-page"><FeedStatus /><CategoryShowcase category={title} title={titleLabel} description={categoryDescriptions[title]} count={filtered.length} /><FeedFilters country={selectedCountry} date={selectedDate} onChange={updateFilter} />
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
    {filtered.length ? title === 'Events' ? ['Upcoming', 'Recent'].map((status) => { const eventStories = filtered.filter((story) => story.eventStatus === status); return eventStories.length ? <section className="event-results" key={status}><SectionHeading eyebrow={status === 'Upcoming' ? 'MARK YOUR CALENDAR' : 'JUST HAPPENED'} title={status} /><div className="story-grid">{eventStories.map((story) => <StoryCard key={story.id} story={story} />)}</div></section> : null }) : <><div className="category-featured"><StoryCard story={filtered[0]} variant="category-lead" /></div>{filtered.length > 1 && <div className="category-results"><SectionHeading eyebrow={`THE LATEST IN ${title.toUpperCase()}`} title="Worth your attention" /><div className="story-grid">{filtered.slice(1).map((story) => <StoryCard key={story.id} story={story} />)}</div></div>}</> : <div className="coming-soon topic-empty"><span className="eyebrow">NO LIVE ITEMS MATCH THESE FILTERS</span><p>Try another country, date range, or topic.</p><button className="text-link" onClick={() => { updateFilter('topic', 'All'); updateFilter('country', 'All'); updateFilter('date', 'All') }}>Clear filters <ArrowRight size={15} /></button></div>}
    <CategorySources category={title} /><Newsletter /></main>
}

function FeedStatus() {
  const { sources, refreshedAt, aiStatus, loading, error, refreshing, refresh } = useStories()
  const healthySources = sources.filter((source) => source.status === 'ok').length
  const updated = refreshedAt ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(refreshedAt)) : null
  return <div className="feed-status" role="status"><span className={`feed-status-dot ${error ? 'has-error' : ''}`} /><span className="feed-status-copy"><strong>{loading ? 'Connecting to sources' : error ? 'Preview mode' : 'Live sources'}</strong><small>{error || (sources.length ? `${healthySources}/${sources.length} sources · updated ${updated || 'just now'}` : 'Waiting for source status')}</small></span><span className="feed-ai-status">{aiStatus === 'ready' ? 'AI summaries on' : 'Publisher summaries'}</span><button type="button" onClick={refresh} disabled={refreshing} aria-label="Refresh stories" title="Refresh stories"><RefreshCw size={15} className={refreshing ? 'is-spinning' : ''} /></button></div>
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
  return <main className="page-shell category-page"><FeedStatus /><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><span>Search</span></div><section className="category-intro search-intro"><span className="eyebrow">SEARCH BRIEFA</span><h1>Results<span className="title-period">.</span></h1><p>Showing matches for <strong>“{query}”</strong></p><span className="category-count">{matches.length} {matches.length === 1 ? 'RESULT' : 'RESULTS'}</span></section>{matches.length ? <div className="story-grid search-results">{matches.map((story) => <StoryCard key={story.id} story={story} />)}</div> : <div className="coming-soon"><span className="eyebrow">NO MATCHES YET</span><p>Try another phrase, or browse our latest <Link to="/category/news">stories</Link> and <Link to="/category/opportunities">opportunities</Link>.</p></div>}</main>
}

function StoryPage() {
  const { stories, loading } = useStories()
  const { id } = useParams()
  const story = stories.find((item) => item.id === id)
  if (!story && loading) return <main className="page-shell not-found"><span className="eyebrow">CONNECTING TO SOURCES</span><h1>Loading this story.</h1></main>
  if (!story) return <main className="page-shell not-found"><span className="eyebrow">404 · STORY NOT FOUND</span><h1>That page has moved.</h1><Link className="text-link" to="/">Back to the Briefa front page <ArrowRight size={15} /></Link></main>
  const related = stories.filter((item) => item.category === story.category && item.id !== story.id).slice(0, 2)
  return <main className="page-shell article-page"><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><Link to={`/category/${story.category.toLowerCase()}`}>{story.category}</Link><ChevronRight size={13} /><span>Story</span></div><article><header className="article-header"><Link className="eyebrow" to={`/category/${story.category.toLowerCase()}`}>{story.tag}</Link><h1>{story.title}</h1><p className="article-deck">{story.summary}</p><div className="article-meta"><div className="author-avatar">{story.author.split(' ').map((word) => word[0]).join('').slice(0, 2)}</div><span>By <strong>{story.author}</strong><small>{story.date} <i>·</i> {story.read}</small></span><SaveButton story={story} /></div></header><figure className="article-figure"><img src={story.image} alt="" /><figcaption>{story.location} <span>{story.sourceName || 'Briefa preview'}</span></figcaption></figure><div className="article-body"><aside className="article-aside"><span className="eyebrow">IN THIS STORY</span><a href="#article-start">The bigger picture</a><a href="#article-source">Source information <ArrowUpRight size={13} /></a></aside><div className="article-copy" id="article-start">{story.paragraphs.map((paragraph, index) => <p key={paragraph} className={index === 0 ? 'article-lede' : ''}>{paragraph}</p>)}<div className="source-note" id="article-source"><span className="eyebrow">ORIGINAL SOURCE</span>{story.sourceUrl ? <p><a href={story.sourceUrl} target="_blank" rel="noreferrer">Read the original report at {story.sourceName || 'the publisher'} <ArrowUpRight size={13} /></a></p> : <p>Live source details are unavailable while the feed is offline.</p>}</div></div></div></article>{related.length > 0 && <section className="related-section"><SectionHeading eyebrow="KEEP EXPLORING" title="More worth your time" /><div className="story-grid">{related.map((item) => <StoryCard key={item.id} story={item} />)}</div></section>}</main>
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
  return <main className="page-shell live-page"><FeedStatus /><section className="live-hero"><div className="live-hero-copy"><span className="live-pill"><span className="live-dot" aria-hidden="true" /> Live now</span><h1>Fresh reporting, moving in real time.</h1><p>Developing stories, quick updates, and trusted sources for what matters now.</p><Link className="text-link" to="/">Back to homepage <ArrowRight size={15} /></Link></div><div className="live-hero-panel"><div className="live-hero-stat"><strong>{String(sources.length).padStart(2, '0')}</strong><span>configured feeds</span></div><div className="live-hero-stat"><strong>{String(activeSources).padStart(2, '0')}</strong><span>connected now</span></div><div className="live-hero-stat"><strong>15m</strong><span>refresh interval</span></div></div></section><section className="source-group"><SectionHeading eyebrow="DIRECT LIVE LINKS FROM PHASE TWO" title="Watch live at the source" /><div className="live-grid">{livePlatformLinks.map((item) => <a key={item.name} href={item.url} className="live-card" target="_blank" rel="noreferrer"><span className="live-card-top"><span className="live-pill"><span className="live-dot" aria-hidden="true" />PLATFORM</span><ArrowUpRight size={16} /></span><strong>{item.name}</strong><p>{item.description}</p></a>)}</div></section><section className="source-group"><SectionHeading eyebrow="LIVE RSS/API HEALTH" title={`Connected feeds · ${activeSources}/${sources.length}`} /><div className="live-grid">{sources.map((item) => <a key={item.name} href={item.url} className="live-card" target="_blank" rel="noreferrer"><span className="live-card-top"><span className={`live-pill ${item.status === 'ok' ? '' : 'is-offline'}`}><span className="live-dot" aria-hidden="true" />{item.status === 'ok' ? 'CONNECTED' : 'RETRYING'}</span><ArrowUpRight size={16} /></span><strong>{item.name}</strong><p>{item.status === 'ok' ? `Feed connected. Last checked ${updated}.` : item.error || 'This source will be retried on the next sync.'}</p></a>)}</div></section></main>
}

function App() {
  const [saved, setSaved] = useState(readSaved)
  const [feed, setFeed] = useState({ stories: [], sources: [], refreshedAt: null, aiStatus: 'not_configured', imageGenerationAvailable: false, trendingVideos: [] })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [feedError, setFeedError] = useState('')
  const [locale, setLocale] = useState(() => localStorage.getItem('briefa-locale') || 'en')
  const [theme, setTheme] = useState(() => localStorage.getItem('briefa-theme') || 'light')
  const loadStories = useCallback(async (force = false) => {
    if (force) setRefreshing(true)
    try {
      const response = await fetch(`/api/stories${force ? '?refresh=true' : ''}`, { cache: 'no-store' })
      if (!response.ok) throw new Error(`Feed API returned ${response.status}`)
      const result = await response.json()
      let generatedImages = {}
      try { generatedImages = JSON.parse(localStorage.getItem('briefa-generated-images') || '{}') } catch {}
      const items = (Array.isArray(result.items) ? result.items : []).map((item) => ({ ...item, image: generatedImages[item.id] || item.image }))
      const sources = Array.isArray(result.sources) ? result.sources : []
      if (!items.length && sources.length && sources.every((source) => source.status !== 'ok')) throw new Error('Live sources are currently unavailable')
      setFeed({ stories: items, sources, refreshedAt: result.refreshedAt, aiStatus: result.aiStatus || 'not_configured', imageGenerationAvailable: Boolean(result.imageGenerationAvailable), trendingVideos: Array.isArray(result.trendingVideos) ? result.trendingVideos : [] })
      setFeedError('')
    } catch {
      setFeed((current) => ({ ...current, stories: current.stories.length ? current.stories : seedStories }))
      setFeedError('Live sources are unavailable. Showing preview items until they reconnect.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])
  const forceRefresh = useCallback(() => loadStories(true), [loadStories])
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
    const timer = window.setInterval(() => loadStories(true), 15 * 60 * 1000)
    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(timer)
    }
  }, [loadStories])
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
  const storyContext = { ...feed, loading, error: feedError, refreshing, refresh: forceRefresh, generateStoryImage }
  return <StoriesContext.Provider value={storyContext}><LocaleContext.Provider value={{ locale, setLocale, theme, setTheme }}><SavedContext.Provider value={{ saved, toggleSaved }}><BrowserRouter><ScrollToTop /><div className="site-wrap" data-theme={theme}><Header /><Routes><Route path="/" element={<HomePage />} /><Route path="/category/:category" element={<CategoryPage />} /><Route path="/story/:id" element={<StoryPage />} /><Route path="/saved" element={<SavedPage />} /><Route path="/live" element={<LivePage />} /><Route path="/search" element={<SearchPage />} /><Route path="/about" element={<AboutPage />} /><Route path="/sources" element={<SourcesPage />} /></Routes><Footer /></div></BrowserRouter></SavedContext.Provider></LocaleContext.Provider></StoriesContext.Provider>
}

export default App
