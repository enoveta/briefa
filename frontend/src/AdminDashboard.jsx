import { useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard, FileText, BriefcaseBusiness, GraduationCap, Handshake,
  Newspaper, CalendarDays, Search, Plus, Pencil, Trash2, Eye, EyeOff,
  RefreshCw, Download, Settings, ExternalLink, CheckCircle2, AlertCircle,
  Menu, X, ArrowUpRight, Save, Globe, Filter, ChevronRight, Pin, PinOff, ChartNoAxesColumn, Smartphone, Monitor, Tablet,
} from 'lucide-react'
import './AdminDashboard.css'

const CONTENT_KEY = 'briefa-admin-listings'
const SETTINGS_KEY = 'briefa-admin-settings'
const categories = ['News', 'Jobs', 'Scholarships', 'Opportunities', 'Events', 'Tenders', 'Announcements', 'Other']
const categoryIcons = { News: Newspaper, Jobs: BriefcaseBusiness, Scholarships: GraduationCap, Opportunities: Handshake, Events: CalendarDays, Tenders: FileText }
const emptyForm = { category: 'Jobs', title: '', organization: '', summary: '', location: 'Kigali, Rwanda', deadline: '', sourceUrl: '', image: '', tag: '', published: true, featured: false }
const readJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback } }
const makeId = () => `briefa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export default function AdminDashboard() {
  const [active, setActive] = useState('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [items, setItems] = useState(() => readJSON(CONTENT_KEY, []))
  const [settings, setSettings] = useState(() => readJSON(SETTINGS_KEY, { siteName: 'Briefa', tagline: 'Stories worth your time. Opportunities worth your attention.', homepageJobs: 4, homepageScholarships: 3, homepageNews: 8, sliderLimit: 5, autoRefresh: true }))
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [pinFilter, setPinFilter] = useState('All')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [notice, setNotice] = useState('')
  const [feedStatus, setFeedStatus] = useState({ loading: true, sources: [], stories: 0, refreshedAt: null, error: '' })
  const [syncing, setSyncing] = useState(false)
  const [analytics, setAnalytics] = useState(() => readJSON('briefa-analytics-events', []))
  const [pinnedIds, setPinnedIds] = useState(() => readJSON('briefa-breaking-pinned', []))

  useEffect(() => {
    localStorage.setItem(CONTENT_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event('briefa-admin-content-updated'))
  }, [items])
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }, [settings])
  useEffect(() => { localStorage.setItem('briefa-breaking-pinned', JSON.stringify(pinnedIds)); window.dispatchEvent(new Event('briefa-breaking-updated')) }, [pinnedIds])
  useEffect(() => { loadFeedStatus(false) }, [])

  async function loadFeedStatus(refresh = false) {
    setSyncing(true)
    try {
      const response = await fetch(`/api/stories${refresh ? '?refresh=true' : ''}`, { cache: 'no-store' })
      if (!response.ok) throw new Error(`Feed service returned ${response.status}`)
      const data = await response.json()
      const liveItems = Array.isArray(data.items) ? data.items : []
      setFeedStatus({ loading: false, sources: data.sources || [], stories: liveItems.length, refreshedAt: data.refreshedAt || null, error: '' })
      // Make feed content visible in the same admin content library as manually managed items.
      // Keep admin edits/status by preferring an existing item with the same ID.
      setItems((current) => {
        const existingIds = new Set(current.map((item) => item.id))
        const additions = liveItems.filter((item) => item?.id && !existingIds.has(item.id)).map((item) => ({
          ...item, published: item.published !== false, isLiveFeedItem: true,
          organization: item.organization || item.sourceName || item.author || 'Live publisher',
          summary: item.summary || item.description || '',
          sourceUrl: item.sourceUrl || item.url || '',
          date: item.date || item.publishedAt || new Date().toISOString().slice(0, 10),
        }))
        return additions.length ? [...additions, ...current] : current
      })
      if (refresh) setNotice('Briefa content feeds refreshed and content library synced.')
    } catch (error) {
      setFeedStatus((old) => ({ ...old, loading: false, error: error.message || 'Could not reach feed service.' }))
      if (refresh) setNotice('Feed refresh failed. Check that the API server is running.')
    } finally { setSyncing(false) }
  }

  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesCategory = filter === 'All' || item.category === filter
    const matchesStatus = statusFilter === 'All' || (statusFilter === 'Published' ? item.published : statusFilter === 'Hidden' || statusFilter === 'Draft' ? !item.published : true)
    const matchesPin = pinFilter === 'All' || (pinFilter === 'Pinned' ? pinnedIds.includes(item.id) : !pinnedIds.includes(item.id))
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || [item.title, item.organization, item.summary, item.location, item.category].some((value) => String(value || '').toLowerCase().includes(term))
    return matchesCategory && matchesStatus && matchesPin && matchesSearch
  }), [items, filter, statusFilter, pinFilter, pinnedIds, search])

  const stats = [
    { label: 'MANAGED CONTENT', value: items.length, detail: `${items.filter((item) => item.published).length} published`, icon: FileText },
    { label: 'JOBS', value: items.filter((item) => item.category === 'Jobs' && item.published).length, detail: 'Published listings', icon: BriefcaseBusiness },
    { label: 'SCHOLARSHIPS', value: items.filter((item) => item.category === 'Scholarships' && item.published).length, detail: 'Published listings', icon: GraduationCap },
    { label: 'CONNECTED FEEDS', value: feedStatus.sources.filter((source) => source.status === 'ok').length, detail: `of ${feedStatus.sources.length} configured`, icon: Globe },
  ]

  function openNew() { setEditingId(null); setForm({ ...emptyForm, category: filter !== 'All' ? filter : 'Jobs' }); setEditorOpen(true); setActive('Website content') }
  function openEdit(item) { setEditingId(item.id); setForm({ ...emptyForm, ...item }); setEditorOpen(true) }
  function saveItem(event) {
    event.preventDefault()
    if (!form.title.trim() || !form.summary.trim()) { setNotice('Add a title and short description before saving.'); return }
    const item = { ...form, id: editingId || makeId(), sourceName: form.organization.trim() || 'Briefa', author: form.organization.trim() || 'Briefa', date: new Date().toISOString().slice(0, 10), read: form.location || 'See listing', createdAt: editingId ? items.find((entry) => entry.id === editingId)?.createdAt : new Date().toISOString() }
    setItems((current) => editingId ? current.map((entry) => entry.id === editingId ? item : entry) : [item, ...current])
    setEditorOpen(false); setNotice(editingId ? 'Content updated.' : 'Content added to Briefa.')
  }
  function deleteItem(item) {
    if (!window.confirm(`Delete “${item.title}” from managed content?`)) return
    setItems((current) => current.filter((entry) => entry.id !== item.id)); setNotice('Content deleted.')
  }
  function togglePublished(item) { setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, published: !entry.published } : entry)); setNotice(item.published ? 'Content moved to drafts.' : 'Content published to the site.') }
  function togglePinned(item) { setPinnedIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [item.id, ...current]); setNotice(pinnedIds.includes(item.id) ? 'Story unpinned.' : 'Story pinned. It will appear first in its feed and in Breaking.') }
  const pageViews = analytics.length
  const pageCounts = Object.entries(analytics.reduce((acc, event) => { acc[event.path || '/'] = (acc[event.path || '/'] || 0) + 1; return acc }, {})).sort((a,b) => b[1]-a[1]).slice(0, 12)
  const deviceCounts = analytics.reduce((acc, event) => { const device = event.device || 'Unknown'; acc[device] = (acc[device] || 0) + 1; return acc }, {})
  function exportContent() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), items, settings }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'briefa-content-backup.json'; link.click(); URL.revokeObjectURL(url)
  }
  function importContent(event) {
    const file = event.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = () => { try { const parsed = JSON.parse(String(reader.result)); if (!Array.isArray(parsed.items)) throw new Error('This file does not contain a Briefa content list.'); setItems(parsed.items); if (parsed.settings) setSettings((current) => ({ ...current, ...parsed.settings })); setNotice('Briefa backup imported.'); } catch (error) { setNotice(error.message || 'Could not import that file.') } }
    reader.readAsText(file); event.target.value = ''
  }
  const nav = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Website content', icon: FileText },
    { label: 'Analytics', icon: ChartNoAxesColumn },
    { label: 'Jobs', icon: BriefcaseBusiness },
    { label: 'Scholarships', icon: GraduationCap },
    { label: 'Opportunities', icon: Handshake },
    { label: 'News & events', icon: Newspaper },
    { label: 'Sources & sync', icon: RefreshCw },
    { label: 'Site settings', icon: Settings },
  ]
  function chooseNav(label) { setActive(label); setSidebarOpen(false); setEditorOpen(false); if (['Jobs', 'Scholarships', 'Opportunities', 'News & events'].includes(label)) { setFilter(label === 'News & events' ? 'News' : label); setStatusFilter('All') } else if (label === 'Website content') { setFilter('All'); setStatusFilter('All') } }
  const contentView = ['Website content', 'Jobs', 'Scholarships', 'Opportunities', 'News & events'].includes(active)

  return <div className="briefa-admin">
    <header className="admin-topbar">
      <button className="admin-mobile-menu" type="button" aria-label="Toggle navigation" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X size={20} /> : <Menu size={20} />}</button>
      <a className="admin-brand" href="/admin"><span className="admin-brand-mark">B</span><span><strong>BRIEFA</strong><small>CONTENT STUDIO</small></span></a>
      <div className="admin-topbar-context"><span className="admin-live-dot" /> Website content workspace</div>
      <a className="admin-view-site" href="/" target="_blank" rel="noreferrer">View website <ExternalLink size={14} /></a>
    </header>
    <div className="admin-layout">
      {sidebarOpen && <button className="admin-sidebar-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="admin-side-label">WORKSPACE</div>
        <nav aria-label="Admin navigation">{nav.map((entry) => { const Icon = entry.icon; const selected = active === entry.label || (contentView && entry.label === 'Website content' && active === 'Website content'); return <button type="button" key={entry.label} className={`admin-nav-item ${selected ? 'is-active' : ''}`} onClick={() => chooseNav(entry.label)}><Icon size={17} /><span>{entry.label}</span>{entry.label === 'Website content' && <span className="admin-nav-count">{items.length}</span>}</button> })}</nav>
        <div className="admin-sidebar-note"><span className="admin-sidebar-note-icon"><CheckCircle2 size={16} /></span><strong>Briefa brand system</strong><p>Navy, signal cyan, clean editorial cards.</p></div>
        <div className="admin-profile"><div className="admin-avatar">B</div><div><strong>Briefa Admin</strong><small>Content administrator</small></div><span className="admin-profile-status" title="Local admin workspace" /></div>
      </aside>
      <main className="admin-main">
        <div className="admin-page-heading"><div><span className="admin-eyebrow">BRIEFA / ADMIN</span><h1>{active}</h1><p>{active === 'Overview' ? 'A clear view of your listings, stories, and connected publishing feeds.' : active === 'Sources & sync' ? 'Check the live feeds that bring news and opportunities into Briefa.' : active === 'Site settings' ? 'Manage the homepage limits and the details shown across your site.' : 'Create, edit, publish, and organize the content displayed on Briefa.'}</p></div><div className="admin-heading-actions"><button className="admin-secondary-button" type="button" onClick={exportContent}><Download size={15} /> Backup</button><button className="admin-primary-button" type="button" onClick={openNew}><Plus size={16} /> Add content</button></div></div>
        {notice && <div className="admin-notice" role="status"><CheckCircle2 size={16} />{notice}<button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}>×</button></div>}
        {active === 'Overview' && <>
          <section className="admin-welcome"><div><span className="admin-welcome-kicker">YOUR PUBLISHING DESK</span><h2>Make every update count.</h2><p>Manage jobs, scholarships, opportunities, news, and events in one place.</p><button className="admin-welcome-button" type="button" onClick={() => chooseNav('Website content')}>Manage website content <ChevronRight size={16} /></button></div><div className="admin-welcome-art"><div className="admin-art-card admin-art-card-one"><BriefcaseBusiness size={21}/><span>Jobs</span><strong>{items.filter((item) => item.category === 'Jobs' && item.published).length}</strong></div><div className="admin-art-card admin-art-card-two"><GraduationCap size={21}/><span>Scholarships</span><strong>{items.filter((item) => item.category === 'Scholarships' && item.published).length}</strong></div><div className="admin-art-orbit" /></div></section>
          <section className="admin-stat-grid">{stats.map((stat) => { const Icon = stat.icon; return <article className="admin-stat-card" key={stat.label}><div className="admin-stat-top"><span className="admin-stat-icon"><Icon size={18}/></span><span className="admin-stat-dot" /></div><span className="admin-eyebrow">{stat.label}</span><strong className="admin-stat-value">{stat.value}</strong><small>{stat.detail}</small></article> })}</section>
          <section className="admin-overview-grid"><article className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">RECENT CONTENT</span><h2>Latest updates</h2></div><button className="admin-inline-link" type="button" onClick={() => chooseNav('Website content')}>View all <ArrowUpRight size={14}/></button></div>{items.length ? items.slice(0, 5).map((item) => <div className="admin-recent-row" key={item.id}><span className={`admin-category-mark category-${item.category.toLowerCase()}`}>{item.category.slice(0, 1)}</span><div className="admin-recent-copy"><strong>{item.title}</strong><small>{item.organization || 'Briefa'} · {item.category}</small></div><span className={`admin-status-pill ${item.published ? 'is-published' : 'is-draft'}`}>{item.published ? 'Published' : 'Hidden / draft'}</span><button className="admin-icon-button" type="button" aria-label={`Edit ${item.title}`} onClick={() => openEdit(item)}><Pencil size={14}/></button></div>) : <div className="admin-empty-state"><FileText size={25}/><strong>Your managed content starts here</strong><p>Add a job, scholarship, opportunity, news story, or event to publish it on the website.</p><button className="admin-secondary-button" type="button" onClick={openNew}><Plus size={15}/> Create first listing</button></div>}</article>
            <article className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">LIVE FEEDS</span><h2>Source health</h2></div><button className="admin-icon-button" type="button" onClick={() => loadFeedStatus(true)} disabled={syncing} aria-label="Refresh sources"><RefreshCw size={15} className={syncing ? 'admin-spin' : ''}/></button></div><div className="admin-source-summary"><strong>{feedStatus.sources.filter((source) => source.status === 'ok').length}<span> / {feedStatus.sources.length}</span></strong><small>sources connected</small></div>{feedStatus.error ? <p className="admin-error-line"><AlertCircle size={14}/>{feedStatus.error}</p> : feedStatus.sources.slice(0, 5).map((source) => <div className="admin-activity-row" key={source.name}><span>{source.name}</span><span className={`admin-feed-state ${source.status === 'ok' ? 'is-ok' : 'is-off'}`}><i/>{source.status === 'ok' ? 'Connected' : 'Retrying'}</span></div>)}<button className="admin-full-width-link" type="button" onClick={() => chooseNav('Sources & sync')}>Manage source sync <ArrowUpRight size={14}/></button></article></section>
        </>}
        {contentView && <section className="admin-panel admin-content-panel"><div className="admin-toolbar"><label className="admin-search"><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search titles, organizations, descriptions..." aria-label="Search content"/></label><label className="admin-filter"><Filter size={15}/><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter category"><option value="All">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><select className="admin-status-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter publication status"><option>All</option><option>Published</option><option>Hidden</option><option>Draft</option></select><select className="admin-status-select" value={pinFilter} onChange={(event) => setPinFilter(event.target.value)} aria-label="Filter pinned content"><option value="All">Pinned & unpinned</option><option value="Pinned">Pinned only</option><option value="Unpinned">Unpinned only</option></select><label className="admin-import-button">Import backup<input type="file" accept="application/json,.json" onChange={importContent}/></label></div><div className="admin-table-heading"><div><h2>{filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}</h2><p>All content returned by live feeds plus manually managed listings appears here. Feed items are synced when you refresh feeds; changes are stored in this browser.</p></div><button className="admin-primary-button" type="button" onClick={openNew}><Plus size={15}/> Add listing</button></div>{filteredItems.length ? <div className="admin-content-list">{filteredItems.map((item) => { const Icon = categoryIcons[item.category] || FileText; return <article className="admin-content-row" key={item.id}><div className="admin-content-thumb">{item.image ? <img src={item.image} alt=""/> : <span><Icon size={21}/></span>}</div><div className="admin-content-main"><div className="admin-content-meta"><span className={`admin-category-tag category-${String(item.category || 'News').toLowerCase()}`}>{item.category || 'News'}</span>{item.isLiveFeedItem && <span className="admin-featured-tag">Live feed</span>}<span className={`admin-status-pill ${item.published ? 'is-published' : 'is-draft'}`}>{item.published ? 'Published' : 'Hidden / draft'}</span>{item.featured && <span className="admin-featured-tag">Featured</span>}{pinnedIds.includes(item.id) && <span className="admin-featured-tag">Pinned to top</span>}</div><h3>{item.title}</h3><p>{item.summary}</p><div className="admin-content-details"><span>{item.organization || 'No organization'}</span>{item.location && <span>{item.location}</span>}{item.deadline && <span>Deadline: {item.deadline}</span>}</div></div><div className="admin-content-actions"><button className={`admin-icon-button ${pinnedIds.includes(item.id) ? 'is-pinned' : ''}`} type="button" title={pinnedIds.includes(item.id) ? 'Unpin story' : 'Pin story'} aria-label={pinnedIds.includes(item.id) ? 'Unpin story' : 'Pin story'} onClick={() => togglePinned(item)}>{pinnedIds.includes(item.id) ? <PinOff size={15}/> : <Pin size={15}/>}</button><button className="admin-icon-button" type="button" title={item.published ? 'Unpublish' : 'Publish'} aria-label={item.published ? 'Unpublish listing' : 'Publish listing'} onClick={() => togglePublished(item)}>{item.published ? <EyeOff size={15}/> : <Eye size={15}/>}</button><button className="admin-icon-button" type="button" title="Preview source" aria-label="Preview source" onClick={() => item.sourceUrl && window.open(item.sourceUrl, "_blank", "noopener,noreferrer")} disabled={!item.sourceUrl}><ExternalLink size={15}/></button><button className="admin-icon-button" type="button" title="Edit" aria-label="Edit listing" onClick={() => openEdit(item)}><Pencil size={15}/></button><button className="admin-icon-button is-danger" type="button" title="Delete" aria-label="Delete listing" onClick={() => deleteItem(item)}><Trash2 size={15}/></button></div></article> })}</div> : <div className="admin-empty-state"><FileText size={26}/><strong>No matching content</strong><p>Add a listing or change the filters to see more content.</p><button className="admin-secondary-button" type="button" onClick={openNew}><Plus size={15}/> Add content</button></div>}</section>}
        {active === 'Analytics' && <section className="admin-analytics-view"><div className="admin-stat-grid"><article className="admin-stat-card"><div className="admin-stat-top"><span className="admin-stat-icon"><ChartNoAxesColumn size={18}/></span></div><span className="admin-eyebrow">RECORDED PAGE VIEWS</span><strong className="admin-stat-value">{pageViews}</strong><small>Since analytics was enabled in this browser</small></article>{["Mobile","Desktop","Tablet"].map((device) => { const Icon = device === 'Mobile' ? Smartphone : device === 'Tablet' ? Tablet : Monitor; return <article className="admin-stat-card" key={device}><div className="admin-stat-top"><span className="admin-stat-icon"><Icon size={18}/></span></div><span className="admin-eyebrow">{device.toUpperCase()} VIEWS</span><strong className="admin-stat-value">{deviceCounts[device] || 0}</strong><small>{pageViews ? Math.round(((deviceCounts[device] || 0) / pageViews) * 100) : 0}% of recorded page views</small></article>})}</div><section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">CONTENT PERFORMANCE</span><h2>Most visited pages</h2><p>Page views recorded by this browser. No names or precise location are collected.</p></div><button className="admin-secondary-button" type="button" onClick={() => { setAnalytics([]); localStorage.setItem('briefa-analytics-events','[]'); setNotice('Local analytics history cleared.') }}>Clear history</button></div>{pageCounts.length ? pageCounts.map(([path,count]) => <div className="admin-analytics-row" key={path}><span>{path}</span><div className="admin-analytics-bar"><i style={{width:`${Math.max(3, count / pageCounts[0][1] * 100)}%`}}/></div><strong>{count}</strong></div>) : <div className="admin-empty-state"><ChartNoAxesColumn size={26}/><strong>No page views recorded yet</strong><p>Browse the public site in this same browser to start collecting local preview analytics.</p></div>}<p className="admin-analytics-note">Important: this preview stores analytics in the visitor's browser only. To see real visitors across devices, you need server-side analytics or a service such as Google Analytics/Plausible.</p></section></section>}
        {active === 'Sources & sync' && <section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">RSS / SEARCH FEEDS</span><h2>Connected publishers and opportunity boards</h2><p>These are live sources configured by Briefa's feed service.</p></div><button className="admin-primary-button" type="button" onClick={() => loadFeedStatus(true)} disabled={syncing}><RefreshCw size={15} className={syncing ? 'admin-spin' : ''}/>{syncing ? 'Refreshing…' : 'Refresh feeds'}</button></div>{feedStatus.refreshedAt && <p className="admin-last-sync">Last updated: {new Date(feedStatus.refreshedAt).toLocaleString()}</p>}{feedStatus.error && <p className="admin-error-line"><AlertCircle size={14}/>{feedStatus.error}</p>}<div className="admin-source-list">{feedStatus.sources.map((source) => <article className="admin-source-row" key={source.name}><span className={`admin-source-status ${source.status === 'ok' ? 'is-ok' : 'is-off'}`}><i/></span><div><strong>{source.name}</strong><p>{source.category} · {source.status === 'ok' ? 'Feed is responding' : source.error || 'Temporarily unavailable; automatic retry is enabled.'}</p></div><a href={source.url} target="_blank" rel="noreferrer" className="admin-icon-button" aria-label={`Open ${source.name}`}><ExternalLink size={15}/></a></article>)}</div></section>}
        {active === 'Site settings' && <section className="admin-panel admin-settings-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">SITE CONFIGURATION</span><h2>Homepage & brand settings</h2><p>These preferences are stored in this browser for this project preview.</p></div><span className="admin-settings-mark"><Settings size={23}/></span></div><div className="admin-settings-grid"><label>Homepage jobs preview<select value={settings.homepageJobs} onChange={(event) => setSettings({ ...settings, homepageJobs: Number(event.target.value) })}><option value={3}>3 cards</option><option value={4}>4 cards</option><option value={5}>5 cards</option></select></label><label>Homepage scholarships preview<select value={settings.homepageScholarships} onChange={(event) => setSettings({ ...settings, homepageScholarships: Number(event.target.value) })}><option value={2}>2 cards</option><option value={3}>3 cards</option><option value={4}>4 cards</option></select></label><label>Homepage news stories<select value={settings.homepageNews} onChange={(event) => setSettings({ ...settings, homepageNews: Number(event.target.value) })}><option value={5}>5 stories</option><option value={6}>6 stories</option><option value={7}>7 stories</option><option value={8}>8 stories</option></select></label><label>Top slider maximum<select value={settings.sliderLimit} onChange={(event) => setSettings({ ...settings, sliderLimit: Number(event.target.value) })}><option value={3}>3 slides</option><option value={4}>4 slides</option><option value={5}>5 slides</option><option value={6}>6 slides</option></select></label></div><label className="admin-toggle-row"><span><strong>Automatic feed refresh</strong><small>Allow the public site to refresh connected stories on its scheduled interval.</small></span><input type="checkbox" checked={settings.autoRefresh} onChange={(event) => setSettings({ ...settings, autoRefresh: event.target.checked })}/></label><div className="admin-settings-actions"><button className="admin-primary-button" type="button" onClick={() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); window.dispatchEvent(new Event('briefa-settings-updated')); setNotice('Site settings saved in this browser.') }}><Save size={15}/> Save settings</button><button className="admin-secondary-button" type="button" onClick={() => { setSettings({ siteName: 'Briefa', tagline: 'Stories worth your time. Opportunities worth your attention.', homepageJobs: 4, homepageScholarships: 3, homepageNews: 8, sliderLimit: 5, autoRefresh: true }); localStorage.setItem(SETTINGS_KEY, JSON.stringify({ siteName: 'Briefa', tagline: 'Stories worth your time. Opportunities worth your attention.', homepageJobs: 4, homepageScholarships: 3, homepageNews: 8, sliderLimit: 5, autoRefresh: true })); window.dispatchEvent(new Event('briefa-settings-updated')); setNotice('Settings reset to Briefa defaults.') }}>Reset defaults</button></div></section>}
        <footer className="admin-footer"><span>BRIEFA CONTENT STUDIO</span><span>Local preview storage · Navy #00225B · Signal Cyan #00D7FD</span></footer>
      </main>
    </div>
    {editorOpen && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false) }}><section className="admin-editor-modal" role="dialog" aria-modal="true" aria-labelledby="admin-editor-title"><div className="admin-editor-heading"><div><span className="admin-eyebrow">BRIEFA PUBLISHING</span><h2 id="admin-editor-title">{editingId ? 'Edit content' : 'Add website content'}</h2><p>Published items are shown alongside live feed content on this browser.</p></div><button className="admin-icon-button" type="button" onClick={() => setEditorOpen(false)} aria-label="Close editor"><X size={18}/></button></div><form onSubmit={saveItem}><div className="admin-form-grid"><label>Content type<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Organization / publisher<input value={form.organization} onChange={(event) => setForm({ ...form, organization: event.target.value })} placeholder="e.g. Development Bank of Rwanda"/></label><label className="admin-form-span">Title *<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Write a clear listing title"/></label><label className="admin-form-span">Short description *<textarea required rows={3} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="A concise, accurate summary for Briefa cards"/></label><label>Location<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Kigali, Rwanda / Remote"/></label><label>Deadline<input type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })}/></label><label className="admin-form-span">Original source URL<input type="url" value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} placeholder="https://..."/></label><label className="admin-form-span">Image URL (optional)<input type="url" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://..."/></label><label>Label / tag<input value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })} placeholder="Featured, Internship, Fully funded"/></label><div className="admin-form-checks"><label><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })}/> Publish now</label><label><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })}/> Mark featured</label></div></div><div className="admin-editor-footer"><button className="admin-secondary-button" type="button" onClick={() => setEditorOpen(false)}>Cancel</button><button className="admin-primary-button" type="submit"><Save size={15}/>{editingId ? 'Save changes' : 'Add to Briefa'}</button></div></form></section></div>}
  </div>
}
