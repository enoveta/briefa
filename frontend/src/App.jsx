import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, CalendarDays, Check, ChevronDown, ChevronRight, Globe2, MapPin, Menu, Moon, Play, RefreshCw, Search, SlidersHorizontal, Sun, Tag, WandSparkles, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
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
    id: 'rural-market-links', category: 'News', tag: 'FOOD SYSTEMS', topics: ['Africa', 'Business & Economy', 'Agriculture', 'Community'],
    title: 'Rural market links are helping small farmers keep more of each harvest',
    summary: 'New cooperative storage and transport partnerships are giving growers more options for when and where they sell.',
    author: 'Briefa News Desk', date: 'October 11, 2026', read: '4 min read', location: 'East Africa',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1100&q=80',
    paragraphs: [
      'Farmer cooperatives and local logistics teams are testing shared storage and transport arrangements to help small growers reach buyers beyond nearby markets.',
      'By pooling deliveries and improving access to basic storage, participating groups aim to reduce losses and give farmers more flexibility when negotiating prices.',
      'The long-term impact will depend on reliable infrastructure, transparent cooperative management, and continued access to buyers.'
    ],
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
    image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['This sample role supports regional teams translating climate research into practical planning tools.', 'The analyst will work with researchers, local partners, and public institutions to build useful datasets and communicate findings.', 'This is demo listing content for the Briefa preview. Confirm details with the original employer before applying.'],
  },
  {
    id: 'digital-health-coordinator', category: 'Jobs', tag: 'PUBLIC HEALTH', topics: ['Health & Medical', 'International Organizations (UN, NGOs)'],
    title: 'Digital Health Programme Coordinator',
    summary: 'Help health teams introduce practical digital tools and strengthen services across partner clinics.',
    author: 'Briefa Demo Listings', date: 'Closes November 24, 2026', read: 'Kampala · Full-time', location: 'Kampala, Uganda',
    image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['This sample position coordinates pilot projects that help clinics use digital tools in day-to-day care.', 'The role brings together clinical staff, technology teams, and community partners to support implementation and training.', 'This is demo listing content for the Briefa preview. Confirm details with the original employer before applying.'],
  },
  {
    id: 'fintech-product-designer', category: 'Jobs', tag: 'TECHNOLOGY', topics: ['Tech & IT', 'Startups', 'Finance & Banking'],
    title: 'Product Designer, Small Business Finance',
    summary: 'Design accessible financial tools around the real working lives of independent businesses.',
    author: 'Briefa Demo Listings', date: 'Closes December 01, 2026', read: 'Lagos · Hybrid', location: 'Lagos, Nigeria',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1100&q=80',
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
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1100&q=80',
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
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['Independent retailers have long had to make fragmented payment tools work for their businesses. A new group of founders is building products around how shops actually operate.', 'Their approach starts with listening: teams are working with retailers to understand cash flow, stock management, and the time pressures of running a small business.', 'The result is a new conversation about financial products designed to support, rather than complicate, everyday commerce.'],
  },

  {
    id: 'africa-learning-labs', category: 'News', tag: 'EDUCATION', topics: ['Africa', 'Education', 'Science & Research'],
    title: 'Community learning labs bring practical digital skills closer to young people',
    summary: 'Local educators are pairing shared devices with hands-on lessons to make technology training more accessible.',
    author: 'Briefa News Desk', date: 'October 08, 2026', read: '5 min read', location: 'East Africa',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['Community organisations are opening learning sessions where young people can practice digital skills with guidance from local mentors.', 'The programs focus on useful foundations, from online research and office tools to introductory coding and digital safety.', 'Their long-term reach will depend on reliable connectivity, equipment maintenance, and sustained support for instructors.'],
  },
  {
    id: 'clean-cooking-enterprises', category: 'News', tag: 'CLIMATE & HEALTH', topics: ['Africa', 'Energy', 'Health & Public Health', 'Environment & Climate'],
    title: 'Clean-cooking businesses look for ways to reach more households',
    summary: 'Entrepreneurs are testing distribution and payment models designed around the budgets of everyday families.',
    author: 'Briefa News Desk', date: 'October 07, 2026', read: '4 min read', location: 'East Africa',
    image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['Clean-cooking enterprises are exploring ways to make efficient stoves and fuels easier for households to access.', 'Some businesses are working with community distributors and flexible payment options to reduce the upfront cost for customers.', 'Affordability, dependable supply, and clear information about safe use remain central to wider adoption.'],
  },
  {
    id: 'regional-transport-links', category: 'News', tag: 'TRADE & MOBILITY', topics: ['Africa', 'Business & Economy', 'Infrastructure'],
    title: 'Regional transport links put small exporters in focus',
    summary: 'Trade groups say clearer logistics and border procedures can help smaller firms reach customers across the region.',
    author: 'Briefa News Desk', date: 'October 06, 2026', read: '5 min read', location: 'East Africa',
    image: 'https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&w=1100&q=80',
    paragraphs: ['Small exporters often face high delivery costs and complex paperwork when selling across borders.', 'Regional business groups are calling for more predictable logistics, accessible market information, and simpler processes for smaller shipments.', 'Progress will depend on coordination between transport operators, border agencies, and the businesses using these routes.'],
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
    <div className="story-visual"><Link to={`/story/${story.id}`} className="story-image-link" {...storyClickProps(story.id)}><img src={story.image} alt="" loading="lazy" /><span className="image-arrow"><ArrowUpRight size={16} /></span></Link>{imageGenerationAvailable && story.sourceUrl && <button className="story-image-ai" type="button" onClick={createImage} disabled={generatingImage} title={imageError || 'Create an AI cover based on this story'}><WandSparkles size={13} />{generatingImage ? 'Creating' : 'AI cover'}</button>}</div>
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
  const featuredLimit = (() => { try { return Math.max(1, Math.min(6, Number(JSON.parse(localStorage.getItem('briefa-admin-settings') || '{}').sliderLimit) || 5)) } catch { return 5 } })()
  const featured = stories.filter((story) => story.category === 'News').slice(0, featuredLimit)
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
        <img src={story.image} alt="" loading="lazy" /><span className="daily-brief-copy"><small>{story.category} · {story.tag}</small><strong>{story.title}</strong><span>{story.read}</span></span><ArrowUpRight size={14} />
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
      <motion.div className="showcase-slide" key={story.id} initial={{ opacity: 0.65 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}><Link to={isCategoryStory ? `/story/${story.id}` : `/category/${category.toLowerCase()}`} aria-label={isCategoryStory ? `Read: ${story.title}` : `Browse ${title}`}><img src={story.image} alt="" /><span className="showcase-caption">{isCategoryStory ? story.tag : `${title} · IN FOCUS`}<strong>{isCategoryStory ? story.title : description}</strong></span></Link></motion.div>
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
      <span className="trending-thumb">{story.image && <img src={story.image} alt="" loading="lazy" />}</span>
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
        <img src={story.image} alt="" loading="lazy" /><span className="daily-brief-copy"><small>{story.category} · {story.tag}</small><strong>{story.title}</strong></span><ArrowUpRight size={14} />
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
    ? [...stories.filter((story) => story.category === category), ...seedStories.filter((story) => story.category === category && !stories.some((live) => live.id === story.id))]
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
    const regular = uniqueCoverageItems.filter((story) => !story.topics?.includes('Breaking'))
    const breakingFallback = uniqueCoverageItems.filter((story) => story.topics?.includes('Breaking'))
    // Fill the requested eight-card grid when fewer than eight non-breaking stories exist.
    sectionStories = [...regular, ...breakingFallback].slice(0, sectionLimit)
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
  const filtered = stories.filter((story) => story.category === title && (selectedTopic === 'All' || story.topics?.includes(selectedTopic)) && (selectedCountry === 'All' || story.country === selectedCountry) && (!dateWindows[selectedDate] || now - Date.parse(story.publishedAt) <= dateWindows[selectedDate]) && (title !== 'Events' || selectedRegion === 'All' || story.region === selectedRegion) && (title !== 'News' || selectedRegion === 'All' || (selectedRegion === 'Africa' ? (story.country && story.country !== 'Global' && story.country !== 'Rwanda') || story.topics?.includes('Africa') : selectedRegion === 'World' ? story.country === 'Global' || story.topics?.includes('World') : true)) && (title !== 'Events' || selectedStatus === 'All' || story.eventStatus === selectedStatus))
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
  return <main className="page-shell category-page"><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><span>Search</span></div><section className="category-intro search-intro"><span className="eyebrow">SEARCH BRIEFA</span><h1>Results<span className="title-period">.</span></h1><p>Showing matches for <strong>“{query}”</strong></p><span className="category-count">{matches.length} {matches.length === 1 ? 'RESULT' : 'RESULTS'}</span></section>{matches.length ? <div className="story-grid search-results">{matches.map((story) => <StoryCard key={story.id} story={story} />)}</div> : <div className="coming-soon"><span className="eyebrow">NO MATCHES YET</span><p>Try another phrase, or browse our latest <Link to="/category/news">stories</Link> and <Link to="/category/opportunities">opportunities</Link>.</p></div>}</main>
}

function StoryPage() {
  const { stories, loading } = useStories()
  const { id } = useParams()
  const story = stories.find((item) => item.id === id)
  if (!story && loading) return <main className="page-shell not-found"><span className="eyebrow">CONNECTING TO SOURCES</span><h1>Loading this story.</h1></main>
  if (!story) return <main className="page-shell not-found"><span className="eyebrow">404 · STORY NOT FOUND</span><h1>That page has moved.</h1><Link className="text-link" to="/">Back to the Briefa front page <ArrowRight size={15} /></Link></main>
  const related = stories.filter((item) => item.category === story.category && item.id !== story.id).slice(0, 2)
  return <main className="page-shell article-page"><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><Link to={`/category/${story.category.toLowerCase()}`}>{story.category}</Link><ChevronRight size={13} /><span>Story</span></div><article><header className="article-header"><Link className="eyebrow" to={`/category/${story.category.toLowerCase()}`}>{story.tag}</Link><h1>{story.title}</h1><p className="article-deck">{story.summary}</p><div className="article-meta"><div className="author-avatar">{story.author.split(' ').map((word) => word[0]).join('').slice(0, 2)}</div><span>By <strong>{story.author}</strong><small>{story.date} <i>·</i> {story.read}</small></span><SaveButton story={story} /></div></header><figure className="article-figure"><img src={story.image} alt="" /><figcaption>{story.location} <span>{story.sourceName || 'Briefa preview'}</span></figcaption></figure><div className="article-body"><aside className="article-aside"><span className="eyebrow">IN THIS STORY</span><a href="#article-start">The bigger picture</a><a href="#article-source">Source information <ArrowUpRight size={13} /></a></aside><div className="article-copy" id="article-start">{story.paragraphs.map((paragraph, index) => <p key={paragraph} className={index === 0 ? 'article-lede' : ''}>{paragraph}</p>)}<div className="source-note" id="article-source"><div className="source-note-icon"><Globe2 size={19} /></div><div className="source-note-copy"><span className="eyebrow">VERIFY AT THE SOURCE</span><strong>{story.sourceName || 'Original publisher'}</strong><p>Read the full report and confirm the details directly with the publisher.</p></div>{story.sourceUrl ? <a className="source-action" href={story.sourceUrl} target="_blank" rel="noreferrer">Visit source <ArrowUpRight size={16} /></a> : <span className="source-action is-disabled">Source unavailable</span>}</div></div></div></article>{related.length > 0 && <section className="related-section"><SectionHeading eyebrow="KEEP EXPLORING" title="More worth your time" /><div className="story-grid">{related.map((item) => <StoryCard key={item.id} story={item} />)}</div></section>}</main>
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
  const [locale, setLocale] = useState(() => localStorage.getItem('briefa-locale') || 'en')
  const [theme, setTheme] = useState(() => localStorage.getItem('briefa-theme') || 'light')
  const [settingsVersion, setSettingsVersion] = useState(0)
  useEffect(() => { const onSettingsUpdate = () => setSettingsVersion((value) => value + 1); window.addEventListener('briefa-settings-updated', onSettingsUpdate); return () => window.removeEventListener('briefa-settings-updated', onSettingsUpdate) }, [])
  const loadStories = useCallback(async (force = false) => {
    if (force) setRefreshing(true)
    try {
      const response = await fetch(`/api/stories${force ? '?refresh=true' : ''}`, { cache: 'no-store' })
      if (!response.ok) throw new Error(`Feed API returned ${response.status}`)
      const result = await response.json()
      let generatedImages = {}
      try { generatedImages = JSON.parse(localStorage.getItem('briefa-generated-images') || '{}') } catch {}
      const liveItems = (Array.isArray(result.items) ? result.items : []).map((item) => ({ ...item, image: item.image || generatedImages[item.id] || '' }))
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
      const items = [...managedItems, ...liveItems.filter((item) => !managedIds.has(item.id))]
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
    // Keep the public feed fresh automatically, regardless of local admin preferences.
    const timer = window.setInterval(() => loadStories(true), 5 * 60 * 1000)
    return () => {
      window.clearTimeout(initialLoad)
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
