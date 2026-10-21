const projects = document.querySelector('#projects')
const summary = document.querySelector('#summary')
const refresh = document.querySelector('#refresh')
const template = document.querySelector('#project-template')

const text = (value, fallback = '未知') => value === null || value === undefined || value === '' ? fallback : String(value)
const short = (value) => value ? value.slice(0, 12) : '—'
const time = (value) => value ? new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '未知'
const html = (value) => text(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
const url = (value) => {
  try { const parsed = new URL(value); return parsed.protocol === 'https:' ? parsed.href : '#' } catch { return '#' }
}

function deploymentMarkup(title, deployment) {
  if (!deployment) return `<h3>${title}</h3><p class="empty">尚無可驗證紀錄</p>`
  return `<h3>${title}</h3><strong>v${text(deployment.version)}</strong><dl>
    <div><dt>Tag</dt><dd>${html(deployment.tag || '手動')}</dd></div><div><dt>Commit</dt><dd title="${html(deployment.commit)}">${html(short(deployment.commit))}</dd></div>
    <div><dt>部署時間</dt><dd>${time(deployment.createdAt)}</dd></div><div><dt>Smoke</dt><dd class="tone-${deployment.smoke}">${text(deployment.smoke)}</dd></div>
    <div class="wide"><dt>Cloudflare Version</dt><dd title="${html(deployment.cloudflareVersionId)}">${html(deployment.cloudflareVersionId)}</dd></div>
    <div class="wide links">${deployment.runUrl ? `<a href="${url(deployment.runUrl)}" target="_blank" rel="noreferrer">Workflow ↗</a>` : ''}${deployment.releaseUrl ? `<a href="${url(deployment.releaseUrl)}" target="_blank" rel="noreferrer">Release ↗</a>` : ''}</div>
  </dl>`
}

function releaseMarkup(release) {
  const artifact = release.artifact
  return `<div class="release-row"><div><strong>${html(release.tag)}</strong><small>建置 ${time(release.builtAt)} · 發布 ${time(release.publishedAt)} · ${artifact.fileCount ?? '—'} files</small></div>
    <span class="pill ${html(artifact.completeness)}">${html(artifact.completeness)}</span><span class="pill ${html(artifact.integrity)}">${html(artifact.integrity)}</span>
    ${artifact.zip?.url ? `<a href="${url(artifact.zip.url)}" class="download">下載 ZIP</a>` : '<span>無 ZIP</span>'}</div>`
}

function render(snapshot) {
  summary.className = `summary ${snapshot.status}`
  summary.innerHTML = `<strong>整體狀態：${snapshot.status}</strong><span>更新時間 ${time(snapshot.generatedAt)}</span><span>${Object.entries(snapshot.sources).map(([key, value]) => `${key}: ${value}`).join(' · ')}</span>`
  projects.replaceChildren()
  for (const project of snapshot.projects) {
    const card = template.content.firstElementChild.cloneNode(true)
    card.querySelector('h2').textContent = project.project
    card.querySelector('.target').textContent = project.target
    const status = card.querySelector('.status')
    status.textContent = project.status
    status.className = `status ${project.status}`
    const site = card.querySelector('.site-link')
    site.href = project.stagingUrl
    card.querySelector('.current').innerHTML = deploymentMarkup('CURRENT', project.deployments.find((item) => item.position === 'current'))
    card.querySelector('.previous').innerHTML = deploymentMarkup('PREVIOUS', project.deployments.find((item) => item.position === 'previous'))
    card.querySelector('.cloudflare-proof').textContent = `Cloudflare 實際線上：${text(project.cloudflareCurrentVersionId)} · ${time(project.cloudflareDeployedAt)}`
    const releases = card.querySelector('.releases')
    releases.innerHTML = project.releases.length ? project.releases.map(releaseMarkup).join('') : '<p class="empty">沒有可讀取的 Release</p>'
    const issues = card.querySelector('.issues')
    issues.innerHTML = project.issues.length ? project.issues.map((issue) => `<p class="issue ${html(issue.severity)}"><strong>${html(issue.code)}</strong>${html(issue.message)}</p>`).join('') : '<p class="clear">沒有偵測到問題</p>'
    projects.append(card)
  }
}

async function load() {
  refresh.disabled = true
  refresh.textContent = '查詢中…'
  summary.className = 'summary loading'
  summary.textContent = '正在向 GitHub 與 Cloudflare 取得最新證據…'
  try {
    const response = await fetch('/api/release-console', { cache: 'no-store' })
    const body = await response.json()
    if (!response.ok) throw new Error(body.message || body.error)
    render(body)
  } catch (error) {
    summary.className = 'summary unavailable'
    summary.textContent = `控制台資料暫時無法取得：${error.message}`
  } finally {
    refresh.disabled = false
    refresh.textContent = '重新查詢'
  }
}

refresh.addEventListener('click', load)
load()
