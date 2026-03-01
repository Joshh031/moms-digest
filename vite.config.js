import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function rssProxy() {
  return {
    name: 'rss-proxy',
    configureServer(server) {
      server.middlewares.use('/api/rss', async (req, res) => {
        const params = new URL(req.url, 'http://localhost').searchParams
        const url = params.get('url')
        if (!url) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing url parameter' }))
          return
        }
        try {
          const response = await fetch(url, {
            headers: { 'User-Agent': 'MomsDigest/1.0' },
          })
          const text = await response.text()
          res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' })
          res.end(text)
        } catch {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Failed to fetch feed' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), rssProxy()],
  server: {
    host: true,
  },
})
