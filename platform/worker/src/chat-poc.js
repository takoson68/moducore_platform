import {
  CHAT_DEFAULT_ROOM_ID,
  CHAT_PROTOCOL_VERSION,
  roomNamespace,
  validateClientEvent,
} from '../../chat-contract/index.js'

const MAX_PROCESSED_REQUESTS = 256
const MAX_ROOMS = 500
const CHAT_IDLE_TIMEOUT_MS = 10 * 60 * 1000
const PLATFORM_AUTH_ORIGIN = 'https://dinecore-staging.takoson68.workers.dev'
const PLATFORM_AUTH_PROJECT = 'dineCore'

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin')
  const allowed = env.ADMIN_ORIGIN || origin || '*'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Project',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Max-Age': '600',
  }
}

function jsonResponse(value, status, request, env) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...corsHeaders(request, env) },
  })
}

async function readJson(request) {
  try { return await request.json() } catch { return null }
}

async function requirePlatformAdmin(request, env) {
  const token = request.headers.get('Authorization')
  if (!token || !/^Bearer [a-f0-9]{64}$/i.test(token)) return { ok: false, status: 401, error: 'UNAUTHORIZED' }
  const authOrigin = env.AUTH_ORIGIN === PLATFORM_AUTH_ORIGIN ? env.AUTH_ORIGIN : PLATFORM_AUTH_ORIGIN
  const authProject = env.AUTH_PROJECT_ID === PLATFORM_AUTH_PROJECT ? env.AUTH_PROJECT_ID : PLATFORM_AUTH_PROJECT
  const response = await fetch(`${authOrigin}/api/session`, {
    cache: 'no-store',
    headers: {
      Authorization: token,
      'Cache-Control': 'no-cache',
      'X-Project': authProject,
    },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.authenticated || data.user?.role !== 'super_admin') {
    return { ok: false, status: response.ok ? 403 : 401, error: 'FORBIDDEN' }
  }
  return { ok: true, user: data.user }
}

async function directoryRequest(env, path, method = 'GET', body) {
  if (!env.CHAT_DIRECTORY) return null
  const id = env.CHAT_DIRECTORY.idFromName('platform-chat-directory:v1')
  const request = new Request(`https://directory${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'X-Chat-Internal': '1' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const response = await env.CHAT_DIRECTORY.get(id).fetch(request)
  return response.json()
}

async function handleRoomDirectory(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) })
  const url = new URL(request.url)
  const roomId = url.pathname.startsWith('/api/chat/rooms/')
    ? decodeURIComponent(url.pathname.slice('/api/chat/rooms/'.length))
    : null

  if (request.method === 'GET' && !roomId) {
    const rooms = await directoryRequest(env, '/rooms')
    return jsonResponse({ success: true, rooms: rooms?.rooms || [] }, 200, request, env)
  }

  const admin = await requirePlatformAdmin(request, env)
  if (!admin.ok) return jsonResponse({ success: false, error: { code: admin.error } }, admin.status, request, env)
  const body = await readJson(request)

  if (request.method === 'POST' && !roomId) {
    const value = body || {}
    if (!/^[A-Za-z0-9_-]{1,50}$/.test(value.roomId || '') || typeof value.displayName !== 'string' || !value.displayName.trim()) {
      return jsonResponse({ success: false, error: { code: 'INVALID_ROOM' } }, 400, request, env)
    }
    const result = await directoryRequest(env, '/rooms/create', 'POST', {
      roomId: value.roomId,
      displayName: value.displayName.trim().slice(0, 80),
      actorId: admin.user.id,
    })
    return jsonResponse(result, result?.error ? 409 : 201, request, env)
  }

  if (!roomId) return jsonResponse({ success: false, error: { code: 'NOT_FOUND' } }, 404, request, env)
  if (request.method === 'PATCH') {
    const result = await directoryRequest(env, `/rooms/${encodeURIComponent(roomId)}`, 'PATCH', body || {})
    return jsonResponse(result, result?.error ? 404 : 200, request, env)
  }
  if (request.method === 'DELETE') {
    const result = await directoryRequest(env, `/rooms/${encodeURIComponent(roomId)}`, 'DELETE')
    return jsonResponse(result, result?.error ? 404 : 200, request, env)
  }
  return jsonResponse({ success: false, error: { code: 'METHOD_NOT_ALLOWED' } }, 405, request, env)
}

export class ChatDirectory {
  constructor(state) { this.state = state }

  async rooms() {
    return (await this.state.storage.get('rooms')) || []
  }

  async save(rooms) {
    await this.state.storage.put('rooms', rooms.slice(0, MAX_ROOMS))
    return rooms.slice(0, MAX_ROOMS)
  }

  async fetch(request) {
    if (request.headers.get('X-Chat-Internal') !== '1') return new Response('Not Found', { status: 404 })
    const url = new URL(request.url)
    const now = Date.now()
    const rooms = await this.rooms()
    if (request.method === 'GET' && url.pathname === '/rooms') {
      return Response.json({ rooms: rooms.filter(room => room.status === 'active') })
    }
    const roomId = url.pathname.startsWith('/rooms/') ? decodeURIComponent(url.pathname.slice('/rooms/'.length)) : null
    const body = await request.json().catch(() => ({}))
    if (request.method === 'POST' && url.pathname === '/rooms/create') {
      if (rooms.some(room => room.roomId === body.roomId)) return Response.json({ error: 'ROOM_EXISTS' })
      const room = { roomId: body.roomId, displayName: body.displayName, status: 'active', createdAt: now, updatedAt: now }
      await this.save([...rooms, room])
      return Response.json({ success: true, room })
    }
    if (request.method === 'POST' && url.pathname === '/rooms/register') {
      if (rooms.some(room => room.roomId === body.roomId)) return Response.json({ success: true })
      await this.save([...rooms, { roomId: body.roomId, displayName: body.roomId, status: 'active', createdAt: now, updatedAt: now }])
      return Response.json({ success: true })
    }
    const index = rooms.findIndex(room => room.roomId === roomId)
    if (index < 0) return Response.json({ error: 'ROOM_NOT_FOUND' })
    if (request.method === 'PATCH') {
      rooms[index] = { ...rooms[index], displayName: typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 80) : rooms[index].displayName, updatedAt: now }
      await this.save(rooms)
      return Response.json({ success: true, room: rooms[index] })
    }
    if (request.method === 'DELETE') {
      rooms[index] = { ...rooms[index], status: 'inactive', updatedAt: now }
      await this.save(rooms)
      return Response.json({ success: true, room: rooms[index] })
    }
    return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
}

export class PublicChat {
  constructor(state) {
    this.state = state
    this.connections = new Map()
    this.processedRequests = new Map()
    this.sequence = 0
    this.playerSequence = 0
  }

  async fetch(request) {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('WebSocket upgrade required', { status: 426 })
    }

    const url = new URL(request.url)
    const roomId = url.searchParams.get('roomId') || CHAT_DEFAULT_ROOM_ID
    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]
    const connectionId = `connection_${crypto.randomUUID()}`
    const playerNumber = ++this.playerSequence
    const playerId = `player_${String(playerNumber).padStart(3, '0')}`
    const displayName = `玩家${String(playerNumber).padStart(3, '0')}`

    server.accept()
    const connection = { roomId, connectionId, playerId, playerNumber, displayName, idleTimer: null }
    this.connections.set(server, connection)
    this.scheduleIdleDisconnect(server, connection)
    server.addEventListener('message', (event) => this.handleMessage(server, event.data))
    server.addEventListener('close', () => this.removeConnection(server))
    server.addEventListener('error', () => this.removeConnection(server))
    this.send(server, {
      type: 'chat.ready',
      payload: {
        connectionId,
        playerId,
        playerNumber,
        displayName,
        roomId,
        serverTime: Date.now(),
      },
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  removeConnection(socket) {
    const connection = this.connections.get(socket)
    if (connection?.idleTimer) clearTimeout(connection.idleTimer)
    this.connections.delete(socket)
  }

  scheduleIdleDisconnect(socket, connection) {
    if (connection.idleTimer) clearTimeout(connection.idleTimer)
    connection.idleTimer = setTimeout(() => {
      if (this.connections.get(socket) !== connection) return
      connection.idleTimer = null
      try { socket.close(4000, 'idle_timeout') } catch { this.removeConnection(socket) }
    }, CHAT_IDLE_TIMEOUT_MS)
  }

  handleMessage(socket, raw) {
    let value
    try {
      value = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw))
    } catch {
      this.sendError(socket, 'INVALID_JSON', '訊息不是有效 JSON')
      return
    }

    const result = validateClientEvent(value)
    if (!result.ok) {
      this.sendError(socket, result.error.code, result.error.message, value?.requestId)
      return
    }

    const connection = this.connections.get(socket)
    if (!connection) return
    this.scheduleIdleDisconnect(socket, connection)

    if (value.type === 'chat.ping') {
      this.send(socket, { type: 'chat.pong', payload: { serverTime: Date.now() } })
      return
    }

    if (value.payload.roomId !== connection.roomId) {
      this.sendError(socket, 'ROOM_MISMATCH', '訊息房間與連線房間不一致', value.requestId)
      return
    }

    if (value.type === 'chat.join') return

    const duplicate = this.processedRequests.get(`${connection.connectionId}:${value.requestId}`)
    if (duplicate) {
      this.send(socket, { type: 'chat.message.ack', requestId: value.requestId, payload: duplicate })
      return
    }

    const message = {
      roomId: connection.roomId,
      messageId: `msg_${crypto.randomUUID()}`,
      sequence: ++this.sequence,
      sender: { id: connection.playerId, displayName: connection.displayName, playerNumber: connection.playerNumber },
      content: value.payload.content,
      serverTime: Date.now(),
    }
    const acknowledgement = { messageId: message.messageId, acceptedAt: message.serverTime }
    this.rememberRequest(`${connection.connectionId}:${value.requestId}`, acknowledgement)
    this.send(socket, { type: 'chat.message.ack', requestId: value.requestId, payload: acknowledgement })
    this.broadcast({ type: 'chat.message.created', payload: message })
  }

  rememberRequest(key, value) {
    this.processedRequests.set(key, value)
    if (this.processedRequests.size <= MAX_PROCESSED_REQUESTS) return
    const oldest = this.processedRequests.keys().next().value
    this.processedRequests.delete(oldest)
  }

  broadcast(event) {
    for (const socket of this.connections.keys()) this.send(socket, event)
  }

  sendError(socket, code, message, requestId) {
    this.send(socket, { type: 'chat.error', requestId, error: { code, message } })
  }

  send(socket, event) {
    socket.send(JSON.stringify({ version: CHAT_PROTOCOL_VERSION, ...event }))
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/chat/rooms' || url.pathname.startsWith('/api/chat/rooms/')) {
      return handleRoomDirectory(request, env)
    }
    if (url.pathname !== '/ws/chat') return new Response('Not Found', { status: 404 })

    const projectId = env.PROJECT_ID
    const roomId = url.searchParams.get('roomId') || CHAT_DEFAULT_ROOM_ID
    await directoryRequest(env, '/rooms/register', 'POST', { roomId })
    let namespace
    try {
      namespace = roomNamespace(projectId, roomId)
    } catch {
      return new Response('Project or room is not configured', { status: 503 })
    }

    const namespaceVersion = env.CHAT_NAMESPACE_VERSION || '1'
    const id = env.PUBLIC_CHAT.idFromName(`${namespace}:v${namespaceVersion}`)
    return env.PUBLIC_CHAT.get(id).fetch(request)
  },
}
