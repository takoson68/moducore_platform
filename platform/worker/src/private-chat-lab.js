const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/
const DEVICE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_SIGNAL_BYTES = 48 * 1024
const MAX_MEMBERS = 20
const MAX_DEVICES = 20
const SESSION_SECONDS = 30 * 60
const TICKET_SECONDS = 60
const AUTH_NAMESPACE = 'chatcore-auth:v1'
const DINECORE_ORIGIN = 'https://dinecore-staging.takoson68.workers.dev'

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
}
function err(code, message, status = 400) { return json({ success: false, error: { code, message } }, status) }
function send(socket, event) { try { socket.send(JSON.stringify(event)) } catch { /* closed sockets are cleared by the runtime */ } }
function textBytes(value) { return new TextEncoder().encode(value) }
function b64url(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '') }
function fromB64url(value) { return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), char => char.charCodeAt(0)) }
function randomToken(bytes = 32) { return b64url(crypto.getRandomValues(new Uint8Array(bytes))) }
function experimentMemberUsernames(env) { return new Set(String(env.CHATCORE_MEMBER_USERNAMES || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean)) }
function isExperimentMember(env, username) { return typeof username === 'string' && experimentMemberUsernames(env).has(username.trim().toLowerCase()) }
function projectIsChatCore(request) { return request.headers.get('X-Project') === 'chatCore' }

async function signSession(payload, secret) {
  const key = await crypto.subtle.importKey('raw', textBytes(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const body = b64url(textBytes(JSON.stringify(payload)))
  const signature = await crypto.subtle.sign('HMAC', key, textBytes(body))
  return `${body}.${b64url(signature)}`
}
async function verifySession(token, secret) {
  if (typeof token !== 'string' || token.length > 2048) return null
  const [body, signature, extra] = token.split('.')
  if (!body || !signature || extra) return null
  try {
    const key = await crypto.subtle.importKey('raw', textBytes(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    if (!await crypto.subtle.verify('HMAC', key, fromB64url(signature), textBytes(body))) return null
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body)))
    if (payload.tenantId !== 'dineCore' || !/^\d+$/.test(String(payload.userId)) || payload.exp <= Math.floor(Date.now() / 1000)) return null
    return payload
  } catch { return null }
}
async function authorize(request, env) {
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(request.headers.get('Authorization') || '')
  if (!match || !env.CHATCORE_SESSION_SECRET) return null
  const identity = await verifySession(match[1], env.CHATCORE_SESSION_SECRET)
  if (!identity || !isExperimentMember(env, identity.username)) return null
  const stored = await authCall(env, '/session/check', 'POST', undefined, match[1])
  const session = await stored.json().catch(() => null)
  return session?.authenticated ? identity : null
}
function authStub(env) { return env.CHATCORE_AUTH.get(env.CHATCORE_AUTH.idFromName(AUTH_NAMESPACE)) }
async function authCall(env, path, method, body, sessionToken) {
  const headers = { 'X-ChatCore-Internal': '1', 'content-type': 'application/json' }
  if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`
  const request = new Request(`https://chatcore-auth${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  return authStub(env).fetch(request)
}
async function isSessionActive(env, sessionId, username) {
  if (!sessionId || !isExperimentMember(env, username)) return false
  try {
    const response = await authCall(env, '/session/active', 'POST', { sessionId })
    return (await response.json().catch(() => null))?.authenticated === true
  } catch { return false }
}

export class ChatCoreAuth {
  constructor(state) { this.state = state }
  async fetch(request) {
    if (request.headers.get('X-ChatCore-Internal') !== '1') return new Response('Not found', { status: 404 })
    const url = new URL(request.url)
    if (url.pathname === '/session' && request.method === 'POST') {
      const body = await request.json().catch(() => null)
      if (!body?.token || !body?.identity) return err('INVALID_SESSION', 'Session 無效')
      if (typeof body.identity.sessionId !== 'string' || !body.identity.sessionId) return err('INVALID_SESSION', 'Session reference 無效')
      await this.state.storage.put(`session:${body.token}`, { ...body.identity, exp: body.exp })
      await this.state.storage.put(`session-id:${body.identity.sessionId}`, body.token)
      await this.state.storage.setAlarm(Date.now() + SESSION_SECONDS * 1000)
      return json({ success: true })
    }
    if (url.pathname === '/session/check' && request.method === 'POST') {
      const token = /^Bearer (.+)$/.exec(request.headers.get('Authorization') || '')?.[1]
      const value = token ? await this.state.storage.get(`session:${token}`) : null
      if (!value || value.exp <= Math.floor(Date.now() / 1000)) {
        if (token) {
          await this.state.storage.delete(`session:${token}`)
          if (value?.sessionId) await this.state.storage.delete(`session-id:${value.sessionId}`)
        }
        return json({ authenticated: false, user: null, token: null })
      }
      return json({ authenticated: true, user: { id: Number(value.userId), tenant_id: 'chatCore', username: value.username, name: value.name, role: 'member' }, token })
    }
    if (url.pathname === '/session/active' && request.method === 'POST') {
      const body = await request.json().catch(() => null)
      const token = body?.sessionId ? await this.state.storage.get(`session-id:${body.sessionId}`) : null
      const value = token ? await this.state.storage.get(`session:${token}`) : null
      return json({ authenticated: Boolean(value && value.exp > Math.floor(Date.now() / 1000)) })
    }
    if (url.pathname === '/session/revoke' && request.method === 'POST') {
      const token = /^Bearer (.+)$/.exec(request.headers.get('Authorization') || '')?.[1]
      if (token) {
        const value = await this.state.storage.get(`session:${token}`)
        await this.state.storage.delete(`session:${token}`)
        if (value?.sessionId) await this.state.storage.delete(`session-id:${value.sessionId}`)
      }
      return json({ success: true })
    }
    return new Response('Not found', { status: 404 })
  }
  async alarm() {
    const now = Math.floor(Date.now() / 1000)
    const sessions = await this.state.storage.list({ prefix: 'session:' })
    let nextExpiry = Infinity
    for (const [key, value] of sessions) {
      if (value.exp <= now) {
        await this.state.storage.delete(key)
        if (value.sessionId) await this.state.storage.delete(`session-id:${value.sessionId}`)
      } else nextExpiry = Math.min(nextExpiry, value.exp)
    }
    if (Number.isFinite(nextExpiry)) await this.state.storage.setAlarm(nextExpiry * 1000)
  }
}

export class PrivateChatLabRoom {
  constructor(state, env) { this.state = state; this.env = env }
  async issueTicket(identity, deviceId) {
    const ticket = randomToken(24)
    const exp = Math.floor(Date.now() / 1000) + TICKET_SECONDS
    await this.state.storage.put(`ticket:${ticket}`, { tenantId: identity.tenantId, userId: identity.userId, username: identity.username, name: identity.name, sessionId: identity.sessionId, deviceId, peerId: crypto.randomUUID(), exp })
    await this.state.storage.setAlarm(Date.now() + TICKET_SECONDS * 1000)
    return { ticket, exp }
  }
  async consumeTicket(ticket) {
    const key = `ticket:${ticket}`
    const value = await this.state.storage.get(key)
    await this.state.storage.delete(key)
    if (!value || value.exp <= Math.floor(Date.now() / 1000)) return null
    return value
  }
  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname === '/__ticket' && request.method === 'POST' && request.headers.get('X-ChatCore-Internal') === '1') {
      const body = await request.json().catch(() => null)
      if (!body?.identity || !DEVICE_ID_PATTERN.test(body.deviceId || '')) return err('INVALID_TICKET_REQUEST', 'Device ID 無效')
      const existing = this.state.getWebSockets().map(socket => socket.deserializeAttachment()).filter(value => value?.joined)
      const users = new Set(existing.map(value => `${value.tenantId}:${value.userId}`))
      const userKey = `${body.identity.tenantId}:${body.identity.userId}`
      if (existing.length >= MAX_DEVICES || (!users.has(userKey) && users.size >= MAX_MEMBERS)) return err('ROOM_FULL', '實驗房間已達 20 個會員或在線裝置上限', 409)
      return json(await this.issueTicket(body.identity, body.deviceId))
    }
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket upgrade required', { status: 426 })
    const roomId = url.searchParams.get('roomId') || ''
    if (!ROOM_ID_PATTERN.test(roomId)) return new Response('Invalid roomId', { status: 400 })
    const ticket = url.searchParams.get('ticket') || ''
    const identity = await this.consumeTicket(ticket)
    if (!identity) return new Response('Invalid or expired ticket', { status: 401 })
    const existing = this.state.getWebSockets().map(socket => socket.deserializeAttachment()).filter(value => value?.joined)
    const users = new Set(existing.map(value => `${value.tenantId}:${value.userId}`))
    const userKey = `${identity.tenantId}:${identity.userId}`
    if (existing.length >= MAX_DEVICES || (!users.has(userKey) && users.size >= MAX_MEMBERS)) return new Response('Room capacity reached', { status: 409 })
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    server.serializeAttachment({ roomId, ...identity, joined: false })
    this.state.acceptWebSocket(server)
    return new Response(null, { status: 101, webSocket: client })
  }
  connectedPeers(roomId) {
    return this.state.getWebSockets().flatMap(socket => {
      const attachment = socket.deserializeAttachment()
      return attachment?.roomId === roomId && attachment.joined ? [{ socket, peerId: attachment.peerId, userId: attachment.userId, tenantId: attachment.tenantId }] : []
    })
  }
  async webSocketMessage(socket, raw) {
    const attachment = socket.deserializeAttachment()
    if (!attachment?.roomId) return
    if (!await isSessionActive(this.env, attachment.sessionId, attachment.username)) { socket.close(4003, 'session_invalid'); return }
    const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw)
    if (new TextEncoder().encode(text).byteLength > MAX_SIGNAL_BYTES) { socket.close(1009, 'payload_too_large'); return }
    let event
    try { event = JSON.parse(text) } catch { send(socket, { type: 'lab.error', payload: { code: 'INVALID_JSON' } }); return }
    if (event?.type === 'lab.join') { this.join(socket, attachment); return }
    if (event?.type === 'lab.leave') { socket.close(1000, 'peer_left'); return }
    if (event?.type === 'lab.signal') { this.relay(socket, attachment, event.payload); return }
    send(socket, { type: 'lab.error', payload: { code: 'UNKNOWN_EVENT' } })
  }
  join(socket, attachment) {
    if (attachment.joined) { send(socket, { type: 'lab.error', payload: { code: 'ALREADY_JOINED' } }); return }
    const peers = this.connectedPeers(attachment.roomId)
    const userKey = `${attachment.tenantId}:${attachment.userId}`
    const users = new Set(peers.map(peer => `${peer.tenantId}:${peer.userId}`))
    if (peers.length >= MAX_DEVICES || (!users.has(userKey) && users.size >= MAX_MEMBERS)) { socket.close(4002, 'room_full'); return }
    const joined = { ...attachment, peerId: crypto.randomUUID(), joined: true }
    socket.serializeAttachment(joined)
    send(socket, { type: 'lab.joined', payload: { roomId: attachment.roomId, peerId: joined.peerId, peers: peers.map(peer => peer.peerId), user: { id: Number(joined.userId), name: joined.name } } })
    for (const peer of peers) send(peer.socket, { type: 'lab.peer-joined', payload: { peerId: joined.peerId } })
  }
  relay(socket, attachment, payload) {
    if (!attachment.joined) { send(socket, { type: 'lab.error', payload: { code: 'NOT_JOINED' } }); return }
    const { to, signal } = payload || {}
    if (typeof to !== 'string' || !signal || !['offer', 'answer', 'candidate'].includes(signal.kind)) { send(socket, { type: 'lab.error', payload: { code: 'INVALID_SIGNAL' } }); return }
    if (signal.kind !== 'candidate' && (typeof signal.description !== 'string' || signal.description.length > MAX_SIGNAL_BYTES)) { send(socket, { type: 'lab.error', payload: { code: 'INVALID_DESCRIPTION' } }); return }
    if (signal.kind === 'candidate' && signal.candidate !== null && typeof signal.candidate !== 'object') { send(socket, { type: 'lab.error', payload: { code: 'INVALID_CANDIDATE' } }); return }
    const recipient = this.connectedPeers(attachment.roomId).find(peer => peer.peerId === to)
    if (!recipient) { send(socket, { type: 'lab.error', payload: { code: 'PEER_NOT_FOUND' } }); return }
    send(recipient.socket, { type: 'lab.signal', payload: { from: attachment.peerId, signal } })
  }
  async webSocketClose(socket) {
    const attachment = socket.deserializeAttachment()
    if (!attachment?.joined) return
    for (const peer of this.connectedPeers(attachment.roomId)) send(peer.socket, { type: 'lab.peer-left', payload: { peerId: attachment.peerId } })
  }
  async webSocketError(socket) { await this.webSocketClose(socket) }
  async alarm() {
    const now = Math.floor(Date.now() / 1000)
    const tickets = await this.state.storage.list({ prefix: 'ticket:' })
    let nextExpiry = Infinity
    for (const [key, value] of tickets) {
      if (value.exp <= now) await this.state.storage.delete(key)
      else nextExpiry = Math.min(nextExpiry, value.exp)
    }
    for (const socket of this.state.getWebSockets()) {
      const attachment = socket.deserializeAttachment()
      if (!await isSessionActive(this.env, attachment?.sessionId, attachment?.username)) socket.close(4003, 'session_invalid')
      else nextExpiry = Math.min(nextExpiry, now + 60)
    }
    if (Number.isFinite(nextExpiry)) await this.state.storage.setAlarm(nextExpiry * 1000)
  }
}

async function routeApi(request, env) {
  const url = new URL(request.url)
  if (!projectIsChatCore(request)) return err('PROJECT_MISMATCH', 'X-Project 必須是 chatCore', 403)
  if (typeof env.CHATCORE_SESSION_SECRET !== 'string' || env.CHATCORE_SESSION_SECRET.length < 32) return err('AUTH_NOT_CONFIGURED', 'ChatCore Session Secret 尚未設定或長度不足', 503)
  if (url.pathname === '/api/login' && request.method === 'POST') {
    const credentials = await request.json().catch(() => null)
    if (typeof credentials?.username !== 'string' || typeof credentials?.password !== 'string' || !credentials.username.trim() || !credentials.password || credentials.username.length > 50 || credentials.password.length > 256) return err('CREDENTIALS_REQUIRED', '請輸入有效的 dineCore 會員帳密', 400)
    const authRequest = new Request(`${DINECORE_ORIGIN}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'X-Project': 'dineCore' }, body: JSON.stringify(credentials) })
    const response = env.AUTH_SERVICE ? await env.AUTH_SERVICE.fetch(authRequest) : await fetch(authRequest)
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.success || !result.user) return err('INVALID_CREDENTIALS', 'dineCore 登入驗證失敗', 401)
    if (typeof result.token !== 'string' || !/^([a-f0-9]{64})$/i.test(result.token)) return err('INVALID_AUTH_RESPONSE', 'dineCore Auth 回應缺少可撤銷的 Session Token', 502)
    // dineCore 只負責一次帳密驗證；立即撤銷上游 token，前端只會取得 chatCore 專屬 Session。
    {
      const logoutRequest = new Request(`${DINECORE_ORIGIN}/api/logout`, { method: 'POST', headers: { Authorization: `Bearer ${result.token}`, 'X-Project': 'dineCore' } })
      const logoutResponse = env.AUTH_SERVICE ? await env.AUTH_SERVICE.fetch(logoutRequest) : await fetch(logoutRequest)
      if (!logoutResponse.ok) return err('UPSTREAM_LOGOUT_FAILED', '無法撤銷上游 dineCore Session，已停止登入', 503)
    }
    const userId = String(result.user.id)
    const username = typeof result.user.username === 'string' ? result.user.username.trim().toLowerCase() : ''
    if (!username) return err('INVALID_AUTH_RESPONSE', 'dineCore Auth 回應缺少會員帳號名稱', 502)
    if (!isExperimentMember(env, username)) return err('NOT_IN_CHATCORE_EXPERIMENT', '此 dineCore 會員尚未加入 chatCore 實驗', 403)
    const identity = { tenantId: 'dineCore', userId, username, name: result.user.name || username, sessionId: crypto.randomUUID() }
    const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS
    const token = await signSession({ ...identity, exp }, env.CHATCORE_SESSION_SECRET)
    await authCall(env, '/session', 'POST', { token, identity, exp })
    const storedSession = await authCall(env, '/session/check', 'POST', undefined, token)
    if (!(await storedSession.json().catch(() => null))?.authenticated) return err('SESSION_STORE_FAILED', '無法建立 ChatCore Session', 503)
    return json({ success: true, authenticated: true, user: { id: Number(userId), tenant_id: 'chatCore', username: identity.username, name: identity.name, role: 'member' }, token })
  }
  const bearer = /^Bearer (.+)$/.exec(request.headers.get('Authorization') || '')?.[1]
  if (url.pathname === '/api/session' && request.method === 'GET') {
    const identity = bearer ? await verifySession(bearer, env.CHATCORE_SESSION_SECRET) : null
    if (!identity || !isExperimentMember(env, identity.username)) return json({ success: true, authenticated: false, user: null, token: null })
    const stored = await authCall(env, '/session/check', 'POST', undefined, bearer)
    const data = await stored.json().catch(() => null)
    return json(data?.authenticated ? { success: true, ...data } : { success: true, authenticated: false, user: null, token: null })
  }
  if (url.pathname === '/api/logout' && request.method === 'POST') {
    if (bearer) await authCall(env, '/session/revoke', 'POST', undefined, bearer)
    return json({ success: true })
  }
  if (url.pathname === '/api/private-chat/ticket' && request.method === 'POST') {
    const identity = await authorize(request, env)
    if (!identity) return err('UNAUTHORIZED', '請重新登入 chatCore 實驗', 401)
    const body = await request.json().catch(() => null)
    if (!ROOM_ID_PATTERN.test(body?.roomId || '') || !DEVICE_ID_PATTERN.test(body?.deviceId || '')) return err('INVALID_TICKET_REQUEST', '房間或裝置識別無效', 400)
    const room = env.PRIVATE_CHAT_LAB.get(env.PRIVATE_CHAT_LAB.idFromName(`m1:${body.roomId}`))
    const response = await room.fetch(new Request('https://private-chat/__ticket', { method: 'POST', headers: { 'X-ChatCore-Internal': '1', 'content-type': 'application/json' }, body: JSON.stringify({ identity, deviceId: body.deviceId }) }))
    return new Response(await response.text(), { status: response.status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
  }
  return err('NOT_FOUND', '找不到 API', 404)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': request.headers.get('Origin') || '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Project', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Max-Age': '600', 'Cache-Control': 'no-store', 'Vary': 'Origin' } })
      const response = await routeApi(request, env)
      response.headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*')
      response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Project')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      response.headers.set('Vary', 'Origin')
      return response
    }
    if (url.pathname !== '/ws/private-chat-lab') return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not Found', { status: 404 })
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket upgrade required', { status: 426 })
    const roomId = url.searchParams.get('roomId') || ''
    const ticket = url.searchParams.get('ticket') || ''
    if (!ROOM_ID_PATTERN.test(roomId) || !ticket) return new Response('Room and one-time ticket required', { status: 400 })
    const id = env.PRIVATE_CHAT_LAB.idFromName(`m1:${roomId}`)
    return env.PRIVATE_CHAT_LAB.get(id).fetch(request)
  },
}
