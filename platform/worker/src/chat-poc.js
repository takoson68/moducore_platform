import {
  CHAT_DEFAULT_ROOM_ID,
  CHAT_PROTOCOL_VERSION,
  roomNamespace,
  validateClientEvent,
} from '../../chat-contract/index.js'

const MAX_PROCESSED_REQUESTS = 256

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
    this.connections.set(server, { roomId, connectionId, playerId, playerNumber, displayName })
    server.addEventListener('message', (event) => this.handleMessage(server, event.data))
    server.addEventListener('close', () => this.connections.delete(server))
    server.addEventListener('error', () => this.connections.delete(server))
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
    if (url.pathname !== '/ws/chat') return new Response('Not Found', { status: 404 })

    const projectId = env.PROJECT_ID
    const roomId = url.searchParams.get('roomId') || CHAT_DEFAULT_ROOM_ID
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
