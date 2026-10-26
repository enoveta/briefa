const categorySources = {
  News: [
    { name: 'UN News', description: 'United Nations reporting and updates.', url: 'https://news.un.org/' },
    { name: 'Reuters', description: 'Independent global and Africa reporting.', url: 'https://www.reuters.com/world/africa/' },
    { name: 'BBC News', description: 'Africa and international news coverage.', url: 'https://www.bbc.com/news' },
    { name: 'Al Jazeera', description: 'Africa and world news reporting.', url: 'https://www.aljazeera.com/' },
    { name: 'Rwanda Government', description: 'Official government information and announcements.', url: 'https://www.gov.rw/' },
    { name: 'ReliefWeb', description: 'Humanitarian reporting and situation updates.', url: 'https://reliefweb.int/' },
    { name: 'World Health Organization', description: 'Public-health news and guidance.', url: 'https://www.who.int/news' },
    { name: 'World Bank News', description: 'Development, research, and policy news.', url: 'https://www.worldbank.org/en/news' },
  ],
  Jobs: [
    { name: 'UN Careers', description: 'Jobs and consultancies across the UN system.', url: 'https://careers.un.org/' },
    { name: 'UN jobs in Rwanda', description: 'United Nations roles based in Rwanda.', url: 'https://rwanda.un.org/en/jobs' },
    { name: 'World Bank Careers', description: 'Roles at the World Bank Group.', url: 'https://www.worldbank.org/ext/en/careers' },
    { name: 'African Union Careers', description: 'Careers across African Union institutions.', url: 'https://au.int/en/careers' },
    { name: 'African Development Bank', description: 'Jobs and consultancies at AfDB.', url: 'https://www.afdb.org/en/about-us/careers' },
    { name: 'Rwanda Development Board', description: 'Rwanda investment and development opportunities.', url: 'https://rdb.rw/' },
    { name: 'Rwanda Public Service Recruitment Portal', description: 'Public-sector vacancies and applications.', url: 'https://recruitment.mifotra.gov.rw/' },
    { name: 'Impactpool', description: 'International development and humanitarian roles.', url: 'https://www.impactpool.org/' },
  ],
  Scholarships: [
    { name: 'Chevening Scholarships', description: 'UK-funded scholarships for future leaders.', url: 'https://www.chevening.org/scholarships/' },
    { name: 'DAAD Scholarships', description: 'Scholarships for study and research in Germany.', url: 'https://www.daad.de/en/studying-in-germany/scholarships/' },
    { name: 'Erasmus Mundus', description: 'Joint master’s programmes and scholarships in Europe.', url: 'https://erasmus-plus.ec.europa.eu/' },
    { name: 'Commonwealth Scholarships', description: 'Scholarships and fellowships for Commonwealth applicants.', url: 'https://cscuk.fcdo.gov.uk/' },
    { name: 'Mastercard Foundation', description: 'Education and leadership programmes across Africa.', url: 'https://mastercardfdn.org/' },
    { name: 'African Union', description: 'Continental education and fellowship opportunities.', url: 'https://au.int/' },
    { name: 'Study in Japan', description: 'Official study and scholarship information for Japan.', url: 'https://www.studyinjapan.go.jp/en/' },
    { name: 'EducationUSA', description: 'Official guidance for study in the United States.', url: 'https://educationusa.state.gov/' },
  ],
  Opportunities: [
    { name: 'ReliefWeb', description: 'Humanitarian jobs, grants, and calls for proposals.', url: 'https://reliefweb.int/' },
    { name: 'Africa No Filter Opportunity Hub', description: 'Grants and opportunities for African storytellers.', url: 'https://opportunity.africanofilter.org/' },
    { name: 'YouthConnekt Rwanda', description: 'Opportunities for young people in Rwanda.', url: 'https://youthconnekt.rw/opportunities/' },
    { name: 'UNECA Opportunities', description: 'Economic development programmes and opportunities.', url: 'https://www.uneca.org/about/opportunities' },
    { name: 'UNESCO Youth Grants', description: 'Youth grants and global grant schemes.', url: 'https://www.unesco.org/en/youth/global-grant-scheme' },
    { name: 'Open Opportunities Rwanda', description: 'Calls and opportunities for Rwanda.', url: 'https://openopportunities.org/opportunities-country/rwanda/' },
    { name: 'Youth Opportunities', description: 'International opportunities for young people.', url: 'https://youthopp.yifoss.org/opportunities/' },
    { name: 'UNHCR Rwanda', description: 'Support and opportunities for refugees in Rwanda.', url: 'https://help.unhcr.org/rwanda/' },
  ],
  Events: [
    { name: 'UN events in Rwanda', description: 'Events and announcements from the UN in Rwanda.', url: 'https://rwanda.un.org/en/events' },
    { name: 'Eventbrite Kigali', description: 'Public event listings in Kigali.', url: 'https://www.eventbrite.com/d/rwanda--kigali-city/kigali/' },
    { name: 'Visit Rwanda', description: 'Official destination events and visitor information.', url: 'https://www.visitrwanda.com/' },
    { name: 'Rwanda Convention Bureau', description: 'Conferences and business events in Rwanda.', url: 'https://rcb.rw/' },
    { name: 'UNESCO Events', description: 'International events and cultural programmes.', url: 'https://www.unesco.org/en/events' },
    { name: 'World Bank Events', description: 'Development events, briefings, and conferences.', url: 'https://www.worldbank.org/en/events' },
    { name: 'African Union', description: 'Official meetings, events, and announcements.', url: 'https://au.int/' },
    { name: 'University & Conference Announcements', description: 'Use the host university or conference organiser’s official event page for confirmed details.', url: 'https://www.unesco.org/en/events' },
  ],
}

export const sourceGroups = [
  { name: 'News & current affairs', sources: categorySources.News },
  { name: 'Jobs & careers', sources: categorySources.Jobs },
  { name: 'Scholarships', sources: categorySources.Scholarships },
  { name: 'Opportunities, grants & fellowships', sources: categorySources.Opportunities },
  { name: 'Events', sources: categorySources.Events },
]

export const livePlatformLinks = [
  { name: 'YouTube Live', description: 'Live video and event streams.', url: 'https://www.youtube.com/live' },
  { name: 'TikTok Trending', description: 'Trending creative content and discovery.', url: 'https://ads.tiktok.com/business/creativecenter/' },
  { name: 'TikTok LIVE', description: 'Live broadcasts on TikTok.', url: 'https://www.tiktok.com/live' },
  { name: 'Instagram Reels', description: 'Short-form video discovery.', url: 'https://www.instagram.com/reels/' },
  { name: 'Facebook Live', description: 'Live broadcasts and watch pages.', url: 'https://www.facebook.com/watch/' },
  { name: 'Facebook Videos', description: 'Video discovery on Facebook.', url: 'https://www.facebook.com/' },
  { name: 'X Live & Explore', description: 'Trending posts and live coverage.', url: 'https://x.com/explore' },
  { name: 'Twitch Live', description: 'Live streams across categories.', url: 'https://www.twitch.tv/' },
  { name: 'Kick Live', description: 'Live streams and creator channels.', url: 'https://kick.com/' },
]

export const trendingVideoPlatforms = [
  { name: 'TikTok', label: 'Explore', url: 'https://www.tiktok.com/explore' },
  { name: 'Instagram Reels', label: 'Reels', url: 'https://www.instagram.com/reels/' },
  { name: 'YouTube Shorts', label: 'Shorts', url: 'https://www.youtube.com/shorts/' },
  { name: 'Facebook Reels', label: 'Reels', url: 'https://www.facebook.com/reel/' },
  { name: 'X', label: 'Videos', url: 'https://x.com/explore' },
  { name: 'Snapchat Spotlight', label: 'Spotlight', url: 'https://www.snapchat.com/spotlight' },
  { name: 'Reddit', label: 'Popular', url: 'https://www.reddit.com/r/popular/' },
]

export function sourcesForCategory(category) {
  return categorySources[category] || []
}
