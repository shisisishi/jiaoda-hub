import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, normalize, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.JIAODA_HUB_PORT || process.argv[2] || 8330)
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
}

const SITES = [
  { id: 'hub', name: '交大总控', url: `http://127.0.0.1:${PORT}/`, port: PORT, note: '本页' },
  { id: 'dsh', name: 'DeepSeek Harness', url: 'http://127.0.0.1:3080/', port: 3080, note: '示例端口 · 需本机安装 DSH' },
  { id: 'day', name: '交大一日', url: 'http://127.0.0.1:8301/', port: 8301, note: '示例子服务' },
  { id: 'news', name: 'AI 前沿', url: 'http://127.0.0.1:8320/', port: 8320, note: '示例子服务' },
  { id: 'zhishi', name: '知识站', url: 'http://127.0.0.1:8899/', port: 8899, note: '示例子服务' },
  { id: 'obid', name: 'Obsidian 可视化', url: 'http://127.0.0.1:8288/', port: 8288, note: '示例子服务' },
  { id: 'idea', name: '四年指南', url: 'http://127.0.0.1:8273/', port: 8273, note: '示例子服务' },
]

function ping(port) {
  return new Promise((resolve) => {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 1200)
    fetch('http://127.0.0.1:' + port + '/', { signal: ac.signal, redirect: 'manual' })
      .then((r) => { clearTimeout(t); resolve(r.status > 0 && r.status < 500) })
      .catch(() => { clearTimeout(t); resolve(false) })
  })
}

async function newsPreview() {
  try {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 2500)
    const res = await fetch('http://127.0.0.1:8320/api/news', { signal: ac.signal })
    clearTimeout(t)
    if (!res.ok) return { ok: false, items: [] }
    const data = await res.json()
    const items = (data.items || []).filter((it) => it.level === 'critical' || it.level === 'high').slice(0, 6)
    return { ok: true, items, generatedAt: data.generatedAt }
  } catch {
    return { ok: false, items: [] }
  }
}

function json(res, body) {
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(JSON.stringify(body))
}

createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1')
  if (url.pathname === '/api/status') {
    const sites = []
    for (const s of SITES) {
      sites.push({ ...s, up: s.id === 'hub' ? true : await ping(s.port) })
    }
    const news = await newsPreview()
    return json(res, { sites, news, generatedAt: Date.now() })
  }
  try {
    let p = decodeURIComponent(url.pathname)
    if (p === '/') p = '/index.html'
    const fp = join(ROOT, normalize(p))
    const info = await stat(fp)
    if (info.isDirectory()) throw new Error('dir')
    const body = await readFile(fp)
    res.writeHead(200, {
      'Content-Type': MIME[extname(fp)] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end('not found')
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log('交大总控（本地）  http://127.0.0.1:' + PORT + '/')
})
