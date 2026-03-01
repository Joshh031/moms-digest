import { useState, useEffect, useCallback } from 'react'

const FEEDS = [
  {
    name: 'Geopolitics',
    emoji: '\u{1F30D}',
    feeds: [
      'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      'https://feeds.npr.org/1004/rss.xml',
      'http://rss.cnn.com/rss/cnn_world.rss',
    ],
  },
  {
    name: 'Politics',
    emoji: '\u{1F3DB}\u{FE0F}',
    feeds: [
      'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
      'https://feeds.npr.org/1014/rss.xml',
      'http://rss.cnn.com/rss/cnn_allpolitics.rss',
      'https://feeds.washingtonpost.com/rss/politics',
    ],
  },
  {
    name: 'Long Island',
    emoji: '\u{1F5FD}',
    feeds: [
      'https://news.google.com/rss/search?q=%22Long+Island%22+when:3d&hl=en-US&gl=US&ceid=US:en',
      'https://www.newsday.com/arcio/rss/',
    ],
  },
  {
    name: 'AL & MS',
    emoji: '\u{1F3E1}',
    feeds: [
      'https://mississippitoday.org/feed/',
      'https://www.al.com/arc/outboundfeeds/rss/?outputType=xml',
      'https://news.google.com/rss/search?q=Alabama+OR+Mississippi+news+when:3d&hl=en-US&gl=US&ceid=US:en',
    ],
  },
  {
    name: 'Real Estate',
    emoji: '\u{1F3E0}',
    feeds: [
      'https://rss.nytimes.com/services/xml/rss/nyt/RealEstate.xml',
      'https://www.housingwire.com/feed/',
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
    if (host.includes('housingwire')) return 'HousingWire'
    if (host.includes('espn')) return 'ESPN'
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

  const fetchFeed = useCallback(async (idx) => {
    setLoading(true)
    setError(null)
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
          const key = a.title.toLowerCase().slice(0, 60)
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 30)

      if (allArticles.length === 0) throw new Error('No articles found')
      setArticles(allArticles)
    } catch (err) {
      setError(err.message)
      setArticles([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchFeed(activeIdx)
  }, [activeIdx, fetchFeed])

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
            <button className="retry" onClick={() => fetchFeed(activeIdx)}>
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
