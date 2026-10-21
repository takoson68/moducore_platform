import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { buildReleaseConsoleSnapshot } from './snapshot.mjs'

const publicDir = resolve(import.meta.dirname, 'public')
const host = process.env.RELEASE_CONSOLE_HOST || '127.0.0.1'
const port = Number(process.env.RELEASE_CONSOLE_PORT || 4190)
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' }

function json(response, status, value) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify(value))
}

async function serveFile(pathname, response) {
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1)
  const file = normalize(join(publicDir, relative))
  if (file !== publicDir && !file.startsWith(`${publicDir}${sep}`)) return false
  try {
    const info = await stat(file)
    if (!info.isFile()) return false
    response.writeHead(200, { 'content-type': contentTypes[extname(file)] || 'application/octet-stream' })
    createReadStream(file).pipe(response)
    return true
  } catch { return false }
}

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || `${host}:${port}`}`)
  if (request.method === 'GET' && url.pathname === '/api/release-console') {
    try { json(response, 200, await buildReleaseConsoleSnapshot()) }
    catch (error) { json(response, 503, { error: 'SNAPSHOT_UNAVAILABLE', message: String(error.message || error) }) }
    return
  }
  if (request.method === 'GET' && await serveFile(url.pathname, response)) return
  json(response, 404, { error: 'NOT_FOUND' })
}).listen(port, host, () => {
  console.log(`唯讀版本控制台：http://${host}:${port}`)
})
