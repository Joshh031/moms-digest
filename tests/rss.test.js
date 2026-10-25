import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/rss.js'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })
const feed = '<rss><channel><item><title>News</title></item></channel></rss>'
function res() {
  return { code: 200, headers: {}, status(n) { this.code = n; return this },
    setHeader(k, v) { this.headers[k] = v }, json(body) { this.body = body; return this },
    send(body) { this.body = body; return this } }
}
async function run(url, method = 'GET') {
  const response = res()
  await handler({ method, query: { url } }, response)
  return response
}

test('rejects malformed URLs, suffix impostors, unlisted subdomains and private addresses before fetching', async () => {
  let calls = 0
  globalThis.fetch = async () => { calls++; throw new Error('Unexpected network request') }
  for (const url of [undefined, ['https://rss.nytimes.com/feed'], 'not a URL',
    'https://evilrss.nytimes.com/feed', 'https://rss.nytimes.com.attacker.example/feed',
    'https://sub.rss.nytimes.com/feed', 'https://rss.nytimes.com@127.0.0.1/feed',
    'https://user:password@rss.nytimes.com/feed', 'https://rss.nytimes.com:8080/feed',
    'file://rss.nytimes.com/feed', 'ftp://rss.nytimes.com/feed',
    'http://127.0.0.1/feed', 'http://169.254.169.254/', 'http://[::1]/']) {
    const response = await run(url)
    assert.ok([400, 403].includes(response.code), String(url))
  }
  assert.equal(calls, 0)
})

test('serves configured HTTPS feeds and existing HTTP CNN feeds unchanged', async () => {
  const calls = []
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return new Response(feed) }
  for (const url of ['https://rss.nytimes.com/services/xml/rss/nyt/World.xml', 'http://rss.cnn.com/rss/cnn_world.rss']) {
    const response = await run(url)
    assert.equal(response.code, 200)
    assert.equal(response.body, feed)
    assert.equal(response.headers['X-Content-Type-Options'], 'nosniff')
  }
  assert.ok(calls.every(c => c.options.redirect === 'manual' && c.options.signal))
})

test('rejects non-GET methods without upstream requests', async () => {
  globalThis.fetch = async () => { assert.fail('Unexpected network request') }
  assert.equal((await run('https://rss.nytimes.com/feed', 'POST')).code, 405)
})

test('does not follow redirects to private networks or lookalike domains', async () => {
  for (const location of ['http://169.254.169.254/latest/meta-data', 'http://[::1]/',
    'https://evilrss.nytimes.com/feed', 'https://rss.nytimes.com:8080/', '//attacker.example/feed']) {
    const calls = []
    globalThis.fetch = async url => { calls.push(url); return new Response(null, { status: 302, headers: { location } }) }
    assert.equal((await run('https://rss.nytimes.com/feed')).code, 403)
    assert.equal(calls.length, 1, location)
  }
})

test('follows relative and approved cross-host redirects using the same deadline', async () => {
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, signal: options.signal })
    if (calls.length === 1) return new Response(null, { status: 301, headers: { location: '/feed/current' } })
    if (calls.length === 2) return new Response(null, { status: 307, headers: { location: 'https://time.com/feed/' } })
    return new Response(feed)
  }
  const response = await run('https://feeds.feedburner.com/time/topstories')
  assert.equal(response.code, 200)
  assert.equal(response.body, feed)
  assert.equal(calls[1].url, 'https://feeds.feedburner.com/feed/current')
  assert.equal(calls[2].url, 'https://time.com/feed/')
  assert.ok(calls.every(c => c.signal === calls[0].signal))
})

test('bounds redirect loops and rejects missing redirect locations', async () => {
  let calls = 0
  globalThis.fetch = async () => { calls++; return new Response(null, { status: 302, headers: { location: '/loop' } }) }
  assert.equal((await run('https://rss.nytimes.com/feed')).code, 502)
  assert.equal(calls, 6)
  globalThis.fetch = async () => new Response(null, { status: 302 })
  assert.equal((await run('https://rss.nytimes.com/feed')).code, 502)
})

test('does not return upstream error pages as successful XML', async () => {
  globalThis.fetch = async () => new Response('Provider error', { status: 500 })
  assert.equal((await run('https://rss.nytimes.com/feed')).code, 502)
})

test('rejects oversized declared and streamed responses', async () => {
  globalThis.fetch = async () => new Response(feed, { headers: { 'content-length': String(3 * 1024 * 1024) } })
  assert.equal((await run('https://rss.nytimes.com/feed')).code, 502)
  let cancelled = false
  globalThis.fetch = async () => new Response(new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(1024 * 1024)) },
    cancel() { cancelled = true },
  }))
  assert.equal((await run('https://rss.nytimes.com/feed')).code, 502)
  assert.equal(cancelled, true)
})

test('reports upstream timeouts without exposing provider details', async () => {
  globalThis.fetch = async () => { throw new DOMException('upstream internal details', 'TimeoutError') }
  const response = await run('https://rss.nytimes.com/feed')
  assert.equal(response.code, 504)
  assert.deepEqual(response.body, { error: 'Feed request timed out' })
})
