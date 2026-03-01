import { useState, useEffect, useCallback } from 'react'

const FEEDS = [
  { name: 'Headlines', url: 'https://feeds.npr.org/1001/rss.xml', emoji: '\u{1F4F0}' },
  { name: 'World', url: 'https://feeds.bbci.co.uk/news/rss.xml', emoji: '\u{1F30D}' },
  { name: 'Health', url: 'https://feeds.npr.org/1128/rss.xml', emoji: '\u{1F49A}' },
  { name: 'Cooking', url: 'https://smittenkitchen.com/feed/', emoji: '\u{1F373}' },
  { name: 'Good News', url: 'https://www.goodnewsnetwork.org/feed/', emoji: '\u{2600}\u{FE0F}' },
]

const PROXY = import.meta.env.DEV
  ? 'https://api.allorigins.win/raw?url='
  : '/api/rss?url='

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const then = new Date(dateStr)
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
  }))
}

function Header() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <header className="header">
      <h1>Mom's Daily Digest</h1>
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
        {article.pubDate && (
          <span className="card-time">{timeAgo(article.pubDate)}</span>
        )}
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
      const feedUrl = FEEDS[idx].url
      const res = await fetch(`${PROXY}${encodeURIComponent(feedUrl)}`)
      if (!res.ok) throw new Error('Feed unavailable')
      const xml = await res.text()
      const parsed = parseRSS(xml)
      if (parsed.length === 0) throw new Error('No articles found')
      setArticles(parsed)
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
        Made with love for Mom
      </footer>
    </div>
  )
}
