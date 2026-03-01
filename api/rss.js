const ALLOWED_HOSTS = [
  'rss.nytimes.com',
  'feeds.npr.org',
  'rss.cnn.com',
  'feeds.washingtonpost.com',
  'news.google.com',
  'www.newsday.com',
  'mississippitoday.org',
  'www.al.com',
  'www.housingwire.com',
  'www.espn.com',
]

export default async function handler(req, res) {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  try {
    const feedHost = new URL(url).hostname
    if (!ALLOWED_HOSTS.some(h => feedHost.endsWith(h))) {
      return res.status(403).json({ error: 'Feed not allowed' })
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MomsDigest/1.0' },
    })
    const text = await response.text()

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60')
    return res.status(200).send(text)
  } catch {
    return res.status(500).json({ error: 'Failed to fetch feed' })
  }
}
