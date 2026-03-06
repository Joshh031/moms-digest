import { useState, useEffect, useCallback } from 'react'

const FEEDS = [
  {
    name: 'Geopolitics',
    emoji: '🌍',
    feeds: [
      'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      'https://feeds.npr.org/1004/rss.xml',
      'http://rss.cnn.com/rss/cnn_world.rss',
      'https://feeds.washingtonpost.com/rss/world',
    ],
  },
  {
    name: 'Politics',
    emoji: '🏛️',
    feeds: [
      'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
      'https://feeds.npr.org/1014/rss.xml',
      'http://rss.cnn.com/rss/cnn_allpolitics.rss',
      'https://feeds.washingtonpost.com/rss/politics',
    ],
  },
{
    name: 'Long Island',
    emoji: '🗽',
    feeds: [
      'https://libn.com/feed/',
      'https://abc7ny.com/feed',
      'https://gothamist.com/feed',
    ],
  },
  {
    name: 'AL & MS',
    emoji: '🌿',
    feeds: [
      'https://mississippitoday.org/feed/',
      'https://www.al.com/arc/outboundfeeds/rss/?outputType=xml',
      'https://www.gulflive.com/arc/outboundfeeds/rss/?outputType=xml',
      'https://whnt.com/feed/',
    ],
  },
 {
    name: 'Real Estate',
    emoji: '🏡',
    feeds: [
      'https://rss.nytimes.com/services/xml/rss/nyt/RealEstate.xml',
      'https://www.inman.com/feed/',
      'https://www.realtor.com/news/feed/',
    ],
  },
{
    name: 'Magazines',
    emoji: '📰',
    feeds: [
      'https://feeds.feedburner.com/time/topstories',
      'https://www.newyorker.com/feed/news',
      'https://feeds.feedburner.com/people/headlines',
    ],
  },
  {
    name: 'Sports',
    emoji: '🏆',
    feeds: [
      'https://www.espn.com/espn/rss/news',
      'https://www.espn.com/espn/rss/nfl/news',
      'https://www.espn.com/espn/rss/mlb/news',
    ],
  },
]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const then = new Date(dateStr)
  if (isNaN(then)) return ''
  const mins = Math.floor((now - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function stripHtml(html) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || ''
}

function extractSource(link) {
  try {
    const host = new URL(link).hostname.replace('www.', '')
    if (host.includes('nytimes')) return 'NYT'
    if (host.includes('npr')) return 'NPR'
    if (host.includes('cnn')) return 'CNN'
    if (host.includes('washingtonpost')) return 'WaPo'
    if (host.includes('newsday')) return 'Newsday'
    if (host.includes('mississippitoday')) return 'MS Today'
    if (host.includes('al.com')) return 'AL.com'
    if (host.includes('gulflive')) return 'Gulf Live'
    if (host.includes('housingwire')) return 'HousingWire'
    if (host.includes('inman')) return 'Inman'
    if (host.includes('espn')) return 'ESPN'
    if (host.includes('time.com')) return 'TIME'
    if (host.includes('newyorker')) return 'New Yorker'
    if (host.includes('people')) return 'People'
    if (host.includes('patch')) return 'Patch'
    if (host.includes('libn')) return 'LIBN'
    if (host.includes('whnt')) return 'WHNT'
    return host.split('.')[0]
  } catch {
    return ''
  }
}

function extractImage(item) {
  const mediaThumbnail = item.getElementsByTagNameNS(
    'http://search.yahoo.com/mrss/', 'thumbnail'
  )[0]
  if (mediaThumbnail) return mediaThumbnail.getAttribute('url')

  const mediaContent = item.getElementsByTagNameNS(
    'http://search.yahoo.com/mrss/', 'content'
  )[0]
  if (mediaContent) {
    const url = mediaContent.getAttribute('url') || ''
    const medium = mediaContent.getAttribute('medium') || ''
    if (medium === 'image' || url.match(/\.(jpg|jpeg|png|webp|gif)/i)) return url
  }

  const enclosure = item.querySelector('enclosure')
  if (enclosure) {
    const type = enclosure.getAttribute('type') || ''
    if (type.startsWith('image/')) return enclosure.getAttribute('url')
  }

  const desc = item.querySelector('description')?.textContent || ''
  const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/)
  if (imgMatch) return imgMatch[1]

  const content = item.getElementsByTagNameNS(
    'http://purl.org/rss/1.0/modules/content/', 'encoded'
  )[0]
  if (content) {
    const contentMatch = content.textContent.match(/<img[^>]+src=["']([^"']+)["']/)
    if (contentMatch) return contentMatch[1]
  }

  return null
}

function parseRSS(xml) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  if (doc.querySelector('parsererror')) return []
  const items = doc.querySelectorAll('item')
  return Array.from(items).slice(0, 20).map(item => ({
    title: item.querySelector('title')?.textContent?.trim() || '',
    link: item.querySelector('link')?.textContent?.trim() || '',
    description: stripHtml(
      item.querySelector('description')?.textContent || ''
    ).slice(0, 200),
    pubDate: item.querySelector('pubDate')?.textContent || '',
    image: extractImage(item),
    source: extractSource(item.querySelector('link')?.textContent || ''),
  }))
}

function Header() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
  return (
    <header className="header">
      <h1>Patsy's Daily Digest</h1>
      <p className="date">{today}</p>
    </header>
  )
}

function FeedCard({ article }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="card"
    >
      {article.image && (
        <div className="card-image">
          <img src={article.image} alt="" loading="lazy" />
        </div>
      )}
      <div className="card-body">
        <h2 className="card-title">{article.title}</h2>
        {article.description && (
          <p className="card-desc">{article.description}</p>
        )}
        <div className="card-meta">
          {article.source && <span className="card-source">{article.source}</span>}
          {article.pubDate && <span className="card-time">{timeAgo(article.pubDate)}</span>}
        </div>
      </div>
    </a>
  )
}

export default function App() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchFeeds = useCallback(async (idx) => {
    setLoading(true)
    setError(null)
    setArticles([])
    try {
      const feedUrls = FEEDS[idx].feeds
      const results = await Promise.allSettled(
        feedUrls.map(async (url) => {
          const res = await fetch(`/api/rss?url=${encodeURIComponent(url)}`)
          if (!res.ok) return []
          const xml = await res.text()
          return parseRSS(xml)
        })
      )
      const seen = new Set()
      const allArticles = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .filter(a => {
          if (!a.title) return false
          const key = a.title.toLowerCase().slice(0, 60)
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 40)

      if (allArticles.length === 0) throw new Error('No articles found')
      setArticles(allArticles)
    } catch (err) {
      setError(err.message)
      setArticles([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchFeeds(activeIdx)
  }, [activeIdx, fetchFeeds])

  return (
    <div className="app">
      <Header />
      <nav className="tabs">
        {FEEDS.map((feed, i) => (
          <button
            key={feed.name}
            className={`tab ${i === activeIdx ? 'active' : ''}`}
            onClick={() => setActiveIdx(i)}
          >
            <span className="tab-emoji">{feed.emoji}</span>
            <span className="tab-label">{feed.name}</span>
          </button>
        ))}
      </nav>
      <main className="feed">
        {loading ? (
          <div className="status">
            <div className="spinner" />
            <p>Loading {FEEDS[activeIdx].name}...</p>
          </div>
        ) : error ? (
          <div className="status">
            <p>Could not load feed</p>
            <button className="retry" onClick={() => fetchFeeds(activeIdx)}>
              Try Again
            </button>
          </div>
        ) : (
          articles.map((article, i) => (
            <FeedCard key={i} article={article} />
          ))
        )}
      </main>
      <footer className="footer">
        Made with love for Patsy
      </footer>
    </div>
  )
}
