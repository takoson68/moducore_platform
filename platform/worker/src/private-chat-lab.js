const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/
const PEER_ID_PATTERN = /^[0-9a-f-]{36}$/i
const MAX_SIGNAL_BYTES = 48 * 1024
const MAX_PEERS = 2

function errorEvent(code, message) {
  return JSON.stringify({ type: 'lab.error', payload: { code, message } })
}

function send(socket, event) {
  try {
    socket.send(JSON.stringify(event))
  } catch {
    // 已關閉的 socket 會由 Durable Object runtime 清理。
  }
}

export class PrivateChatLabRoom {
  constructor(state) {
    this.state = state
  }

  async fetch(request) {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('WebSocket upgrade required', { status: 426 })
    }

    const roomId = new URL(request.url).searchParams.get('roomId') || 'm1-lab'
    if (!ROOM_ID_PATTERN.test(roomId)) return new Response('Invalid roomId', { status: 400 })

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    this.state.acceptWebSocket(server)
    server.serializeAttachment({ roomId })
    return new Response(null, { status: 101, webSocket: client })
  }

  connectedPeers(roomId) {
    return this.state.getWebSockets().flatMap(socket => {
      const attachment = socket.deserializeAttachment()
      return attachment?.roomId === roomId && attachment.peerId
        ? [{ socket, peerId: attachment.peerId }]
        : []
    })
  }

  async webSocketMessage(socket, raw) {
    const attachment = socket.deserializeAttachment()
    if (!attachment?.roomId) return

    const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw)
    if (new TextEncoder().encode(text).byteLength > MAX_SIGNAL_BYTES) {
      send(socket, JSON.parse(errorEvent('PAYLOAD_TOO_LARGE', 'Signaling payload 超過限制')))
      socket.close(1009, 'payload_too_large')
      return
    }

    let event
    try {
      event = JSON.parse(text)
    } catch {
      send(socket, JSON.parse(errorEvent('INVALID_JSON', 'Signaling event 必須是 JSON')))
      return
    }

    if (event?.type === 'lab.join') {
      await this.join(socket, attachment, event.payload?.peerId)
      return
    }

    if (event?.type === 'lab.leave') {
      socket.close(1000, 'peer_left')
      return
    }

    if (event?.type === 'lab.signal') {
      this.relay(socket, attachment, event.payload)
      return
    }

    send(socket, JSON.parse(errorEvent('UNKNOWN_EVENT', '不支援的 Signaling event')))
  }

  async join(socket, attachment, peerId) {
    if (attachment.peerId) {
      send(socket, JSON.parse(errorEvent('ALREADY_JOINED', '此連線已加入房間')))
      return
    }
    if (typeof peerId !== 'string' || !PEER_ID_PATTERN.test(peerId)) {
      send(socket, JSON.parse(errorEvent('INVALID_PEER_ID', 'peerId 格式無效')))
      return
    }

    const peers = this.connectedPeers(attachment.roomId)
    if (peers.some(peer => peer.peerId === peerId)) {
      send(socket, JSON.parse(errorEvent('DUPLICATE_PEER', 'peerId 已在房間使用')))
      socket.close(4001, 'duplicate_peer')
      return
    }
    if (peers.length >= MAX_PEERS) {
      send(socket, JSON.parse(errorEvent('ROOM_FULL', 'M1 實驗房間僅允許兩個 Peer')))
      socket.close(4002, 'room_full')
      return
    }

    const joinedAttachment = { ...attachment, peerId }
    socket.serializeAttachment(joinedAttachment)
    send(socket, {
      type: 'lab.joined',
      payload: { roomId: attachment.roomId, peerId, peers: peers.map(peer => peer.peerId) },
    })
    for (const peer of peers) {
      send(peer.socket, { type: 'lab.peer-joined', payload: { peerId } })
    }
  }

  relay(socket, attachment, payload) {
    if (!attachment.peerId) {
      send(socket, JSON.parse(errorEvent('NOT_JOINED', '請先加入實驗房間')))
      return
    }
    const { to, signal } = payload || {}
    if (typeof to !== 'string' || !signal || !['offer', 'answer', 'candidate'].includes(signal.kind)) {
      send(socket, JSON.parse(errorEvent('INVALID_SIGNAL', 'Signaling event 格式無效')))
      return
    }
    if (signal.kind === 'offer' || signal.kind === 'answer') {
      if (typeof signal.description !== 'string' || signal.description.length > MAX_SIGNAL_BYTES) {
        send(socket, JSON.parse(errorEvent('INVALID_DESCRIPTION', 'SDP description 無效')))
        return
      }
    } else if (signal.candidate !== null && typeof signal.candidate !== 'object') {
      send(socket, JSON.parse(errorEvent('INVALID_CANDIDATE', 'ICE candidate 無效')))
      return
    }

    const recipient = this.connectedPeers(attachment.roomId).find(peer => peer.peerId === to)
    if (!recipient) {
      send(socket, JSON.parse(errorEvent('PEER_NOT_FOUND', '目標 Peer 已離線')))
      return
    }
    send(recipient.socket, {
      type: 'lab.signal',
      payload: { from: attachment.peerId, signal },
    })
  }

  async webSocketClose(socket) {
    const attachment = socket.deserializeAttachment()
    if (!attachment?.peerId) return
    for (const peer of this.connectedPeers(attachment.roomId)) {
      send(peer.socket, { type: 'lab.peer-left', payload: { peerId: attachment.peerId } })
    }
  }

  async webSocketError(socket) {
    await this.webSocketClose(socket)
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname !== '/ws/private-chat-lab') return new Response('Not Found', { status: 404 })
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('WebSocket upgrade required', { status: 426 })
    }

    const roomId = url.searchParams.get('roomId') || 'm1-lab'
    if (!ROOM_ID_PATTERN.test(roomId)) return new Response('Invalid roomId', { status: 400 })
    const id = env.PRIVATE_CHAT_LAB.idFromName(`m1:${roomId}`)
    return env.PRIVATE_CHAT_LAB.get(id).fetch(request)
  },
}
