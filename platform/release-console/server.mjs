import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildReleaseConsoleSnapshot } from './snapshot.mjs'

const publicDir = resolve(import.meta.dirname, 'public')
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' }
const securityHeaders = Object.freeze({
  'cache-control': 'no-store',
  'content-security-policy': "default-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
})

function json(response, status, value) {
  response.writeHead(status, { ...securityHeaders, 'content-type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(value))
}

function isLoopbackAuthority(value = '') {
  const hostname = value.replace(/^\[/, '').replace(/\](?::\d+)?$/, '').replace(/:\d+$/, '').toLowerCase()
  return ['127.0.0.1', 'localhost', '::1'].includes(hostname)
}

export function assertSafeSnapshot(value, path = 'snapshot') {
  if (Array.isArray(value)) return value.forEach((item, index) => assertSafeSnapshot(item, `${path}[${index}]`))
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (/token|secret|password|authorization|cookie/i.test(key)) throw new Error(`${path}.${key} 是禁止的敏感欄位`)
      assertSafeSnapshot(child, `${path}.${key}`)
    }
  }
  if (typeof value === 'string' && /(github_pat_|ghp_|authorization:\s*bearer|cloudflare_api_token)/i.test(value)) throw new Error(`${path} 含有敏感內容`)
}

async function serveFile(pathname, response) {
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1)
  const file = normalize(join(publicDir, relative))
  if (file !== publicDir && !file.startsWith(`${publicDir}${sep}`)) return false
  try {
    const info = await stat(file)
    if (!info.isFile()) return false
    response.writeHead(200, { ...securityHeaders, 'content-type': contentTypes[extname(file)] || 'application/octet-stream' })
    createReadStream(file).pipe(response)
    return true
  } catch { return false }
}

export function createReleaseConsoleServer({ snapshotLoader = buildReleaseConsoleSnapshot } = {}) {
  return createServer(async (request, response) => {
    if (!isLoopbackAuthority(request.headers.host)) {
      json(response, 403, { error: 'LOOPBACK_ONLY' })
      return
    }
    const url = new URL(request.url, `http://${request.headers.host}`)
    if (request.method !== 'GET') {
      json(response, 405, { error: 'READ_ONLY', message: '控制台只允許唯讀 GET' })
      return
    }
  if (request.method === 'GET' && url.pathname === '/api/release-console') {
      try {
        const snapshot = await snapshotLoader()
        assertSafeSnapshot(snapshot)
        json(response, 200, snapshot)
      } catch {
        json(response, 503, { error: 'SNAPSHOT_UNAVAILABLE', message: '版本證據暫時無法查詢' })
      }
    return
  }
  if (request.method === 'GET' && await serveFile(url.pathname, response)) return
  json(response, 404, { error: 'NOT_FOUND' })
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const host = '127.0.0.1'
  const port = Number(process.env.RELEASE_CONSOLE_PORT || 4190)
  createReleaseConsoleServer().listen(port, host, () => console.log(`唯讀版本控制台：http://${host}:${port}`))
}
