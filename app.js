function esc(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function render(data, demo) {
  const grid = document.getElementById('grid')
  grid.innerHTML = (data.sites || []).map((s) => (
    '<a class="card" href="' + esc(s.url) + '"' + (String(s.url).startsWith('#') ? '' : ' target="_blank" rel="noopener"') + '>' +
      '<div class="top"><span class="dot' + (s.up ? ' up' : '') + '"></span><h2>' + esc(s.name) + '</h2></div>' +
      '<div class="note">' + esc(s.note) + (demo ? ' · 演示' : (s.up ? ' · 在线' : ' · 未启动')) + '</div>' +
      '<div class="url">' + esc(s.url) + '</div>' +
    '</a>'
  )).join('')
  const box = document.getElementById('news')
  const items = (data.news && data.news.items) || []
  if (!data.news || !data.news.ok) {
    box.innerHTML = '<div class="muted">资讯模块未连接（公开版不访问作者本机）。</div>'
    return
  }
  if (!items.length) {
    box.innerHTML = '<div class="muted">暂无示例资讯条目。</div>'
    return
  }
  box.innerHTML = items.map((it) => (
    '<a href="' + esc(it.url) + '"' + (String(it.url).startsWith('#') ? '' : ' target="_blank" rel="noopener"') + '>' +
      '<span class="tag">' + (it.level === 'critical' ? '重大发布' : '值得盯') + '</span>' +
      esc(it.source) + ' · ' + esc(it.title) +
    '</a>'
  )).join('')
}

async function loadDemo() {
  const res = await fetch('./data/sites.demo.json')
  if (!res.ok) throw new Error('无法加载演示数据')
  return { ...(await res.json()), _demo: true }
}

async function loadLive() {
  const res = await fetch('/api/status')
  if (!res.ok) throw new Error('status ' + res.status)
  return await res.json()
}

async function load() {
  let data
  let demo = false
  try {
    if (location.hostname.endsWith('github.io')) {
      data = await loadDemo()
      demo = true
    } else {
      data = await loadLive()
    }
  } catch {
    data = await loadDemo()
    demo = true
  }
  render(data, demo)
}

load().catch((e) => {
  document.getElementById('grid').innerHTML = '<div class="muted">' + esc(String(e)) + '</div>'
})
setInterval(() => { load().catch(() => {}) }, 30000)
