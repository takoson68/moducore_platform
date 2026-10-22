const projects = document.querySelector('#projects')
const summary = document.querySelector('#summary')
const operator = document.querySelector('#operator')
const operations = document.querySelector('#operations')
const mode = document.querySelector('#mode')
const refresh = document.querySelector('#refresh')
const template = document.querySelector('#project-template')
const dialog = document.querySelector('#confirm-dialog')
let session = null
let pending = null
let pollTimer = null

const text = (value, fallback = '未知') => value === null || value === undefined || value === '' ? fallback : String(value)
const short = (value) => value ? value.slice(0, 12) : '—'
const time = (value) => value ? new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '未知'
const html = (value) => text(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
const safeUrl = (value) => { try { const parsed = new URL(value); return parsed.protocol === 'https:' ? parsed.href : '#' } catch { return '#' } }
const can = (capability) => {
  if (session?.mode === 'controlled' && capability.startsWith('delete_')) return false
  return ({ viewer: ['view'], deployer: ['view', 'deploy', 'rollback', 'cancel'], admin: ['view', 'deploy', 'rollback', 'cancel', 'delete_release', 'delete_artifact'] })[session?.actor?.role]?.includes(capability)
}

function deploymentMarkup(title, item) {
  if (!item) return `<h3>${title}</h3><p class="empty">尚無可驗證紀錄</p>`
  return `<h3>${title}</h3><strong>v${text(item.version)}</strong><dl><div><dt>Tag</dt><dd>${html(item.tag || '手動')}</dd></div><div><dt>Commit</dt><dd title="${html(item.commit)}">${html(short(item.commit))}</dd></div><div><dt>部署時間</dt><dd>${time(item.createdAt)}</dd></div><div><dt>Smoke</dt><dd class="tone-${item.smoke}">${text(item.smoke)}</dd></div><div class="wide"><dt>Cloudflare Version</dt><dd title="${html(item.cloudflareVersionId)}">${html(item.cloudflareVersionId)}</dd></div><div class="wide links">${item.runUrl ? `<a href="${safeUrl(item.runUrl)}" target="_blank" rel="noreferrer">Workflow ↗</a>` : ''}${item.releaseUrl ? `<a href="${safeUrl(item.releaseUrl)}" target="_blank" rel="noreferrer">Release ↗</a>` : ''}</div></dl>`
}

function actionButton(action, project, tag, label, extra = '') { return `<button type="button" data-action="${action}" data-project="${html(project)}" data-tag="${html(tag)}" class="${extra}">${label}</button>` }

function releaseMarkup(project, release, protectedTags) {
  const artifact = release.artifact
  const verified = artifact.completeness === 'complete' && artifact.integrity === 'verified'
  const protectedRelease = protectedTags.includes(release.tag)
  return `<div class="release-row"><div><strong>${html(release.tag)}</strong><small>建置 ${time(release.builtAt)} · 發布 ${time(release.publishedAt)} · ${artifact.fileCount ?? '—'} files</small></div><span class="pill ${html(artifact.completeness)}">${html(artifact.completeness)}</span><span class="pill ${html(artifact.integrity)}">${html(artifact.integrity)}</span>${artifact.zip?.url ? `<a href="${safeUrl(artifact.zip.url)}" class="download">下載 ZIP</a>` : '<span>無 ZIP</span>'}<span>${verified && can('deploy') ? actionButton('deploy', project.key, release.tag, '部署') : ''}${!protectedRelease && verified && can('delete_release') ? `<label class="delete-choice"><input type="checkbox" data-delete-tag="${html(release.tag)}">待刪除</label>` : ''}</span></div>`
}

function render(snapshot) {
  summary.className = `summary ${snapshot.status}`
  summary.innerHTML = `<strong>整體狀態：${snapshot.status}</strong><span>更新時間 ${time(snapshot.generatedAt)}</span><span>${Object.entries(snapshot.sources).map(([key, value]) => `${key}: ${value}`).join(' · ')}</span>`
  projects.replaceChildren()
  for (const project of snapshot.projects) {
    const current = project.deployments.find((item) => item.position === 'current')
    const previous = project.deployments.find((item) => item.position === 'previous')
    const card = template.content.firstElementChild.cloneNode(true)
    card.querySelector('h2').textContent = project.project
    card.querySelector('.target').textContent = project.target
    const status = card.querySelector('.status'); status.textContent = project.status; status.className = `status ${project.status}`
    card.querySelector('.site-link').href = project.stagingUrl
    card.querySelector('.current').innerHTML = deploymentMarkup('CURRENT', current)
    card.querySelector('.previous').innerHTML = deploymentMarkup('PREVIOUS', previous)
    const deletable = project.releases.some((release) => ![current?.tag, previous?.tag].includes(release.tag) && release.artifact.completeness === 'complete' && release.artifact.integrity === 'verified')
    card.querySelector('.project-actions').innerHTML = `${previous && can('rollback') ? actionButton('rollback', project.key, previous.tag, `回退 previous：v${previous.version}`) : ''}${deletable && can('delete_release') ? `<button type="button" class="danger" data-batch-delete data-project="${html(project.key)}">批次刪除已選 Release</button>` : ''}`
    card.querySelector('.cloudflare-proof').textContent = `Cloudflare 實際線上：${text(project.cloudflareCurrentVersionId)} · ${time(project.cloudflareDeployedAt)}`
    card.querySelector('.releases').innerHTML = project.releases.length ? project.releases.map((release) => releaseMarkup(project, release, [current?.tag, previous?.tag])).join('') : '<p class="empty">沒有可讀取的 Release</p>'
    card.querySelector('.issues').innerHTML = project.issues.length ? project.issues.map((issue) => `<p class="issue ${html(issue.severity)}"><strong>${html(issue.code)}</strong>${html(issue.message)}</p>`).join('') : '<p class="clear">沒有偵測到問題</p>'
    projects.append(card)
  }
}

function renderOperations(rows) {
  operations.innerHTML = rows.length ? rows.slice().reverse().map((item) => `<div class="operation-row"><span class="pill ${html(item.status)}">${html(item.status)}</span><strong>${html(item.action)}</strong><span class="operation-tag">${html(item.project)} · ${html(item.tag)}</span><span>${time(item.updatedAt)}</span>${item.runUrl ? `<a href="${safeUrl(item.runUrl)}" target="_blank" rel="noreferrer">查看 Workflow ↗</a>` : ''}${item.status === 'queued' && can('cancel') ? `<button data-cancel="${html(item.id)}" data-project="${html(item.project)}" data-tag="${html(item.tag)}">取消</button>` : ''}</div>`).join('') : '<p class="empty">目前沒有操作</p>'
}

async function api(path, options) { const response = await fetch(path, { cache: 'no-store', ...options }); const body = await response.json(); if (!response.ok) throw new Error(body.error || body.message); return body }

async function load() {
  refresh.disabled = true; refresh.textContent = '查詢中…'
  try {
    const [snapshot, identity, operationData] = await Promise.all([api('/api/release-console'), api('/api/session'), api('/api/operations')])
    session = identity
    operator.innerHTML = `<strong>${html(identity.actor.login)}</strong> · GitHub ${html(identity.actor.repositoryPermission)} · Console ${html(identity.actor.role)} · 驗證 ${time(identity.authenticatedAt)}`
    mode.textContent = identity.mode === 'simulation' ? '模擬模式：不會變更 GitHub 或 Cloudflare' : '受控模式：會觸發 Staging Workflow；不部署 Production'
    render(snapshot); renderOperations(operationData.operations)
    clearTimeout(pollTimer)
    const pendingWorkflow = operationData.operations.some((item) => ['queued', 'running'].includes(item.status))
    const snapshotBehind = operationData.operations.some((item) => item.status === 'success' && snapshot.projects.find((project) => project.key === item.project)?.deployments.find((deployment) => deployment.position === 'current')?.id === item.source.deploymentId)
    if (pendingWorkflow || snapshotBehind) pollTimer = setTimeout(load, 5000)
  } catch (error) { summary.className = 'summary unavailable'; summary.textContent = `控制台資料暫時無法取得：${error.message}` }
  finally { refresh.disabled = false; refresh.textContent = '重新查詢' }
}

function confirmAction(action, project, tag, operationId = null, tags = null) {
  const labels = { deploy: '部署指定版本', rollback: '回退 previous', cancel: '取消 queued 操作', delete_release: '刪除 Release' }
  const impacts = action.startsWith('delete_') ? '不可恢復影響：GitHub Release 與其 ZIP、manifest、checksum 連結將被移除。current、previous 與最後一個已驗證版本永遠不可刪除。' : session?.mode === 'simulation' ? '此要求只會模擬，不會更新線上 Staging。' : '確認後會由 GitHub Actions 重新部署選定的已驗證 Release ZIP，通過 Smoke 後才更新線上 Staging 與 current／previous。'
  pending = { action, project, tag, operationId, tags }
  document.querySelector('#dialog-title').textContent = labels[action]
  document.querySelector('#dialog-impact').textContent = impacts
  document.querySelector('#dialog-expected').textContent = `${action}:${project}:${tag}`
  document.querySelector('#dialog-confirmation').value = ''
  document.querySelector('#dialog-error').textContent = ''
  dialog.showModal()
}

projects.addEventListener('click', (event) => {
  const batch = event.target.closest('[data-batch-delete]')
  if (batch) {
    const tags = [...batch.closest('.project-card').querySelectorAll('[data-delete-tag]:checked')].map((item) => item.dataset.deleteTag).sort()
    if (tags.length) confirmAction('delete_release', batch.dataset.project, tags.join(','), null, tags)
    return
  }
  const button = event.target.closest('[data-action]'); if (button) confirmAction(button.dataset.action, button.dataset.project, button.dataset.tag)
})
operations.addEventListener('click', (event) => { const button = event.target.closest('[data-cancel]'); if (button) confirmAction('cancel', button.dataset.project, button.dataset.tag, button.dataset.cancel) })
dialog.addEventListener('close', async () => {
  if (dialog.returnValue !== 'default' || !pending) return
  const confirmation = document.querySelector('#dialog-confirmation').value
  const expected = `${pending.action}:${pending.project}:${pending.tag}`
  if (confirmation !== expected) { document.querySelector('#dialog-error').textContent = '確認字串不符'; dialog.showModal(); return }
  try {
    const path = pending.action === 'cancel' ? '/api/operations/cancel' : '/api/operations'
    const body = pending.action === 'cancel' ? { operationId: pending.operationId, confirmation } : { action: pending.action, project: pending.project, tag: pending.tag, tags: pending.tags, confirmation }
    await api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); pending = null; await load()
  } catch (error) { document.querySelector('#dialog-error').textContent = error.message; dialog.showModal() }
})
refresh.addEventListener('click', load)
load()
