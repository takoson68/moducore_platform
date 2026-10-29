const DEFAULT_ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]
const ICE_SERVERS_ENV = import.meta.env.VITE_CHATCORE_ICE_SERVERS || ''

function resolveIceServers() {
  if (!ICE_SERVERS_ENV.trim()) return DEFAULT_ICE_SERVERS
  try {
    const servers = JSON.parse(ICE_SERVERS_ENV)
    if (!Array.isArray(servers)) throw new Error('ICE server 設定必須是陣列')
    return servers
  } catch (error) {
    throw new Error(`ICE server 設定無法解析：${error.message}`)
  }
}

export function createPrivateChatLabSession({ onState, onMessage, onAcknowledgement, onMetrics, onPeers, onJoined }) {
  let socket = null
  let selfPeerId = null
  let joinedRoom = false
  let joinRejected = false
  let closed = false
  let signalingEvents = 0
  const peers = new Map()
  const remotePeerIds = new Set()
  const socketCleanups = []
  const iceServers = resolveIceServers()

  function emitState(state, detail = '') {
    onState?.({ state, detail })
  }

  function updateRoomState() {
    if (closed) return
    const connectedPeers = [...remotePeerIds].filter(peerId => peers.get(peerId)?.channel?.readyState === 'open')
    const peerStates = [...remotePeerIds].map(peerId => {
      const peer = peers.get(peerId)
      return {
        peerId,
        state: peer?.channel?.readyState === 'open' ? 'connected' : peer?.connection.connectionState || 'connecting',
      }
    })
    onPeers?.({
      peerId: selfPeerId,
      count: (selfPeerId ? 1 : 0) + remotePeerIds.size,
      connectedCount: (selfPeerId ? 1 : 0) + connectedPeers.length,
      remoteCount: remotePeerIds.size,
      peers: peerStates,
    })

    if (!selfPeerId) return
    if (remotePeerIds.size === 0) {
      emitState('waiting', '房間已加入，等待其他參與者')
    } else if (connectedPeers.length === remotePeerIds.size) {
      emitState('connected', `${connectedPeers.length + 1} 人已透過 DataChannel 連線`)
    } else if (connectedPeers.length > 0) {
      emitState('partial', `${connectedPeers.length}/${remotePeerIds.size} 位 Peer 已連線`)
    } else if (peerStates.some(peer => peer.state === 'failed')) {
      emitState('failed', '部分 Peer 的 ICE 連線失敗')
    } else if (peerStates.some(peer => peer.state === 'disconnected')) {
      emitState('recovering', '部分 Peer 連線中斷，等待 ICE 恢復')
    } else {
      emitState('connecting', `正在連線 ${remotePeerIds.size} 位 Peer`)
    }
  }

  function listen(target, type, handler, cleanupList) {
    target.addEventListener(type, handler)
    cleanupList.push(() => target.removeEventListener(type, handler))
  }

  function sendSocket(event) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false
    signalingEvents += 1
    socket.send(JSON.stringify(event))
    return true
  }

  function sendSignal(peerId, signal) {
    sendSocket({ type: 'lab.signal', payload: { to: peerId, signal } })
  }

  function sendPeerEvent(peerId, event) {
    const channel = peers.get(peerId)?.channel
    if (channel?.readyState !== 'open' || channel.bufferedAmount > 256 * 1024) return false
    channel.send(JSON.stringify({ protocol: 'chatCore.v1', ...event }))
    return true
  }

  function sendAcknowledgement(peerId, messageId, stage) {
    if (!['received', 'persisted', 'read'].includes(stage)) return false
    return sendPeerEvent(peerId, { type: 'ack', messageId, stage })
  }

  function decodeDataChannelMessage(peer, data) {
    let event
    try { event = JSON.parse(String(data)) } catch { event = null }
    if (event?.protocol !== 'chatCore.v1') {
      onMessage?.({
        messageId: null,
        senderPeerId: peer.peerId,
        sender: `對方 ${peer.peerId.slice(0, 8)}`,
        text: String(data),
        at: Date.now(),
        legacy: true,
      })
      return
    }
    if (event.type === 'message') {
      const message = event.message
      if (!message || typeof message.id !== 'string' || typeof message.text !== 'string' || message.text.length > 2000) return
      sendAcknowledgement(peer.peerId, message.id, 'received')
      onMessage?.({
        messageId: message.id,
        senderPeerId: peer.peerId,
        sender: `對方 ${peer.peerId.slice(0, 8)}`,
        text: message.text,
        at: Number.isFinite(message.at) ? message.at : Date.now(),
      })
      return
    }
    if (event.type === 'ack' && typeof event.messageId === 'string' && ['received', 'persisted', 'read'].includes(event.stage)) {
      onAcknowledgement?.({ peerId: peer.peerId, messageId: event.messageId, stage: event.stage })
    }
  }

  function installDataChannel(peer, channel) {
    peer.channelCleanups.forEach(cleanup => cleanup())
    peer.channelCleanups = []
    peer.channel = channel
    listen(channel, 'open', () => {
      updateRoomState()
    }, peer.channelCleanups)
    listen(channel, 'message', event => {
      decodeDataChannelMessage(peer, event.data)
    }, peer.channelCleanups)
    listen(channel, 'close', () => {
      updateRoomState()
    }, peer.channelCleanups)
    listen(channel, 'error', () => {
      if (!closed) emitState('error', 'DataChannel 發生錯誤')
    }, peer.channelCleanups)
  }

  function disposePeer(peerId, reason = '') {
    const peer = peers.get(peerId)
    if (!peer) return
    peers.delete(peerId)
    peer.channelCleanups.forEach(cleanup => cleanup())
    peer.peerCleanups.forEach(cleanup => cleanup())
    try { peer.channel?.close() } catch { /* 已關閉則略過。 */ }
    try { peer.connection.close() } catch { /* 已關閉則略過。 */ }
    if (reason && !closed) updateRoomState()
  }

  function connectionMetrics(connection, peerId) {
    return connection.getStats().then(reports => {
      const values = [...reports.values()]
      const pair = values.find(report =>
        report.type === 'candidate-pair' && report.state === 'succeeded' && (report.nominated || report.selected)
      )
      const local = pair ? reports.get(pair.localCandidateId) : null
      const remote = pair ? reports.get(pair.remoteCandidateId) : null
      return {
        peerId,
        signalingEvents,
        connectionState: connection.connectionState,
        iceState: connection.iceConnectionState,
        candidatePair: pair ? {
          local: local?.candidateType || 'unknown',
          remote: remote?.candidateType || 'unknown',
          path: local?.candidateType === 'relay' || remote?.candidateType === 'relay'
            ? 'relay'
            : local?.candidateType === 'srflx' || remote?.candidateType === 'srflx'
              ? 'stun/direct'
              : 'host/direct',
          currentRoundTripTime: pair.currentRoundTripTime ?? null,
          bytesSent: pair.bytesSent ?? 0,
          bytesReceived: pair.bytesReceived ?? 0,
        } : null,
      }
    })
  }

  function createPeer(peerId) {
    const existing = peers.get(peerId)
    if (existing) return existing
    remotePeerIds.add(peerId)

    const connection = new RTCPeerConnection({ iceServers })
    const peer = {
      peerId,
      connection,
      channel: null,
      peerCleanups: [],
      channelCleanups: [],
      remoteCandidates: [],
      offerStarted: false,
      iceRestarted: false,
      metricsTimer: null,
    }
    peers.set(peerId, peer)

    listen(connection, 'icecandidate', event => {
      sendSignal(peerId, {
        kind: 'candidate',
        candidate: event.candidate ? event.candidate.toJSON() : null,
      })
    }, peer.peerCleanups)
    listen(connection, 'datachannel', event => installDataChannel(peer, event.channel), peer.peerCleanups)
    listen(connection, 'connectionstatechange', () => {
      const state = connection.connectionState
      updateRoomState()
      if (state === 'failed') {
        if (selfPeerId < peerId && !peer.iceRestarted) restartIce(peer)
      }
    }, peer.peerCleanups)
    listen(connection, 'iceconnectionstatechange', () => {
      if (connection.iceConnectionState === 'failed') {
        if (selfPeerId < peerId && !peer.iceRestarted) restartIce(peer)
      }
      updateRoomState()
    }, peer.peerCleanups)

    peer.metricsTimer = setInterval(() => {
      connectionMetrics(connection, peer.peerId)
        .then(metrics => onMetrics?.(metrics))
        .catch(() => {})
    }, 1500)
    peer.peerCleanups.push(() => {
      if (peer.metricsTimer !== null) clearInterval(peer.metricsTimer)
      peer.metricsTimer = null
    })

    updateRoomState()
    if (selfPeerId < peerId) startOffer(peer)
    return peer
  }

  async function startOffer(peer, iceRestart = false) {
    if (closed || peer.offerStarted && !iceRestart) return
    peer.offerStarted = true
    if (!peer.channel) {
      installDataChannel(peer, peer.connection.createDataChannel('chat-text', { ordered: true }))
    }
    const offer = await peer.connection.createOffer(iceRestart ? { iceRestart: true } : undefined)
    await peer.connection.setLocalDescription(offer)
    sendSignal(peer.peerId, { kind: 'offer', description: peer.connection.localDescription.sdp })
  }

  async function restartIce(peer) {
    if (closed || peer.iceRestarted) return
    peer.iceRestarted = true
    emitState('recovering', '執行一次 ICE restart')
    try {
      await startOffer(peer, true)
    } catch (error) {
      emitState('failed', `ICE restart 失敗：${error.message}`)
    }
  }

  async function flushCandidates(peer) {
    const pending = peer.remoteCandidates.splice(0)
    for (const candidate of pending) await peer.connection.addIceCandidate(candidate)
  }

  async function handleSignal(from, signal) {
    const peer = createPeer(from)
    if (signal.kind === 'candidate') {
      if (peer.connection.remoteDescription) await peer.connection.addIceCandidate(signal.candidate)
      else peer.remoteCandidates.push(signal.candidate)
      return
    }

    if (signal.kind === 'offer') {
      if (selfPeerId < from) {
        emitState('error', '收到非預期的 offer，已避免同時協商')
        return
      }
      await peer.connection.setRemoteDescription({ type: 'offer', sdp: signal.description })
      await flushCandidates(peer)
      const answer = await peer.connection.createAnswer()
      await peer.connection.setLocalDescription(answer)
      sendSignal(from, { kind: 'answer', description: peer.connection.localDescription.sdp })
      return
    }

    if (signal.kind === 'answer') {
      await peer.connection.setRemoteDescription({ type: 'answer', sdp: signal.description })
      await flushCandidates(peer)
    }
  }

  function handleSocketMessage(raw) {
    let event
    try { event = JSON.parse(String(raw)) } catch {
      emitState('error', 'Signaling 回應格式無效')
      return
    }
    if (event.type === 'lab.joined') {
      selfPeerId = event.payload.peerId
      joinedRoom = true
      onJoined?.({ roomId: event.payload.roomId, peerId: selfPeerId })
      event.payload.peers.forEach(peerId => remotePeerIds.add(peerId))
      event.payload.peers.forEach(createPeer)
      updateRoomState()
    } else if (event.type === 'lab.peer-joined') {
      createPeer(event.payload.peerId)
    } else if (event.type === 'lab.signal') {
      signalingEvents += 1
      handleSignal(event.payload.from, event.payload.signal)
        .catch(error => emitState('error', `WebRTC 協商錯誤：${error.message}`))
    } else if (event.type === 'lab.peer-left') {
      remotePeerIds.delete(event.payload.peerId)
      disposePeer(event.payload.peerId, `Peer 已離開：${event.payload.peerId}`)
    } else if (event.type === 'lab.error') {
      if (!joinedRoom) joinRejected = true
      emitState('error', `${event.payload.code}：${event.payload.message}`)
    }
  }

  function connect({ roomId, ticket, signalingUrl }) {
    if (socket || closed) throw new Error('連線已啟動或已釋放。')
    if (!roomId || roomId.length > 64 || !/^[A-Za-z0-9_-]+$/.test(roomId)) {
      throw new Error('房間代碼限 1–64 個英數字、底線或連字號。')
    }
    if (typeof RTCPeerConnection !== 'function') throw new Error('此瀏覽器不支援 WebRTC。')

    selfPeerId = crypto.randomUUID()
    const resolvedSignalingUrl = signalingUrl || (import.meta.env.DEV
      ? 'ws://127.0.0.1:8787/ws/private-chat-lab'
      : `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/private-chat-lab`)
    const url = new URL(resolvedSignalingUrl)
    if (!ticket) throw new Error('缺少一次性房間 Ticket，請重新登入後加入。')
    url.searchParams.set('roomId', roomId)
    url.searchParams.set('ticket', ticket)
    socket = new WebSocket(url)
    listen(socket, 'open', () => {
      emitState('signaling', 'Signaling WebSocket 已連線，正在加入實驗房間')
      sendSocket({ type: 'lab.join', payload: { peerId: selfPeerId } })
    }, socketCleanups)
    listen(socket, 'message', event => handleSocketMessage(event.data), socketCleanups)
    listen(socket, 'close', () => {
      if (!closed) {
        if (joinRejected) return
        emitState('signaling-disconnected', 'Signaling WebSocket 已中斷')
        disposeAllPeers()
      }
    }, socketCleanups)
    listen(socket, 'error', () => {
      if (!closed) emitState('error', 'Signaling WebSocket 連線失敗；請確認 Staging 服務已啟動')
    }, socketCleanups)
    emitState('connecting', '正在連線 Signaling Worker')
  }

  function disposeAllPeers() {
    for (const peerId of [...peers.keys()]) disposePeer(peerId)
    remotePeerIds.clear()
    onPeers?.({ count: 0, connectedCount: 0, remoteCount: 0, peers: [] })
  }

  function sendText(text, messageId = null) {
    let sentCount = 0
    const recipientPeerIds = []
    const message = { id: messageId || crypto.randomUUID(), text, at: Date.now(), senderPeerId: selfPeerId }
    for (const peer of peers.values()) {
      if (peer.channel?.readyState !== 'open') continue
      if (!sendPeerEvent(peer.peerId, { type: 'message', message })) continue
      sentCount += 1
      recipientPeerIds.push(peer.peerId)
    }
    return sentCount ? recipientPeerIds : false
  }

  function dispose() {
    if (closed) return
    closed = true
    sendSocket({ type: 'lab.leave' })
    socketCleanups.forEach(cleanup => cleanup())
    disposeAllPeers()
    try { socket?.close(1000, 'client_dispose') } catch { /* 已關閉則略過。 */ }
    socket = null
    emitState('disconnected', '連線與 Peer 資源已釋放')
  }

  return {
    connect,
    sendText,
    sendAcknowledgement,
    sendRead: (peerId, messageId) => sendAcknowledgement(peerId, messageId, 'read'),
    getConnectedPeerIds: () => [...peers.values()]
      .filter(peer => peer.channel?.readyState === 'open')
      .map(peer => peer.peerId),
    dispose,
    iceServersConfigured: iceServers.length > 0,
  }
}
