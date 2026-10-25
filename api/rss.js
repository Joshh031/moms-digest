const ALLOWED_HOSTS = [
  'rss.nytimes.com',
  'feeds.npr.org',
  'rss.cnn.com',
  'feeds.washingtonpost.com',
  'news.google.com',
  'www.newsday.com',
  'newsday.com',
  'mississippitoday.org',
  'www.al.com',
  'www.gulflive.com',
  'www.wlox.com',
  'www.wcbi.com',
  'whnt.com',
  'www.housingwire.com',
  'www.inman.com',
  'www.realtor.com',
  'www.espn.com',
  'libn.com',
  'patch.com',
  'abc7ny.com',
  'nypost.com',
  'feeds.feedburner.com',
  'time.com',
  'www.newyorker.com',
  'people.com',
  'gothamist.com',
  'wcbi.com',
]

const MAX_REDIRECTS = 5
const MAX_BYTES = 2 * 1024 * 1024
const REDIRECTS = new Set([301, 302, 303, 307, 308])

function feedUrl(value) {
  if (typeof value !== 'string' || !value || value.length > 4096) {
    throw Object.assign(new Error('Invalid URL'), { status: 400 })
  }
  let url
  try { url = new URL(value) } catch {
    throw Object.assign(new Error('Invalid URL'), { status: 400 })
  }
  // Exact hosts only: a suffix match also accepts attacker-controlled lookalikes.
  // HTTP remains supported for the existing CNN feeds, on its default port only.
  if (!['http:', 'https:'].includes(url.protocol) || url.port ||
      url.username || url.password || !ALLOWED_HOSTS.includes(url.hostname)) {
    throw Object.assign(new Error('Feed not allowed'), { status: 403 })
  }
  url.hash = ''
  return url
}

async function readFeed(response) {
  if (Number(response.headers.get('content-length')) > MAX_BYTES) {
    await response.body?.cancel()
    throw new Error('Feed too large')
  }
  if (!response.body) throw new Error('Empty feed')
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BYTES) {
        await reader.cancel()
        throw new Error('Feed too large')
      }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  return Buffer.concat(chunks, size).toString('utf8')
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  let url
  try { url = feedUrl(req.query?.url) } catch (error) {
    return res.status(error.status).json({ error: error.message })
  }
  // One deadline covers the whole redirect chain and response body.
  const signal = AbortSignal.timeout(10000)
  try {
    for (let redirects = 0; ; redirects++) {
      const response = await fetch(url.href, {
        headers: { 'User-Agent': 'MomsDigest/1.0' },
        redirect: 'manual', signal,
      })
      if (REDIRECTS.has(response.status)) {
        const location = response.headers.get('location')
        await response.body?.cancel()
        if (!location || redirects >= MAX_REDIRECTS) throw new Error('Invalid redirect')
        // Validate every hop before sending the next request, including relative URLs.
        url = feedUrl(new URL(location, url).href)
        continue
      }
      if (!response.ok) {
        await response.body?.cancel()
        throw new Error('Feed unavailable')
      }
      const text = await readFeed(response)
      res.setHeader('Content-Type', 'application/xml; charset=utf-8')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60')
      return res.status(200).send(text)
    }
  } catch (error) {
    const timeout = signal.aborted || error.name === 'TimeoutError' || error.name === 'AbortError'
    return res.status(timeout ? 504 : (error.status || 502)).json({
      error: timeout ? 'Feed request timed out' : 'Failed to fetch allowed feed',
    })
  }
}
