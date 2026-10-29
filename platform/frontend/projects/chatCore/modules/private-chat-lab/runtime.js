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

export function createPrivateChatLabSession({ onState, onMessage, onMetrics }) {
  let socket = null
  let selfPeerId = null
  let closed = false
  let metricsTimer = null
  let signalingEvents = 0
  const peers = new Map()
  const socketCleanups = []
  const iceServers = resolveIceServers()

  function emitState(state, detail = '') {
    onState?.({ state, detail })
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

  function installDataChannel(peer, channel) {
    peer.channelCleanups.forEach(cleanup => cleanup())
    peer.channelCleanups = []
    peer.channel = channel
    listen(channel, 'open', () => {
      emitState('connected', `DataChannel 已連線：${peer.peerId}`)
    }, peer.channelCleanups)
    listen(channel, 'message', event => {
      onMessage?.({ sender: `對方 ${peer.peerId.slice(0, 8)}`, text: String(event.data), at: Date.now() })
    }, peer.channelCleanups)
    listen(channel, 'close', () => {
      if (!closed) emitState('waiting', 'DataChannel 已關閉')
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
    if (reason && !closed) emitState('waiting', reason)
  }

  function connectionMetrics(connection) {
    return connection.getStats().then(reports => {
      const values = [...reports.values()]
      const pair = values.find(report =>
        report.type === 'candidate-pair' && report.state === 'succeeded' && (report.nominated || report.selected)
      )
      const local = pair ? reports.get(pair.localCandidateId) : null
      const remote = pair ? reports.get(pair.remoteCandidateId) : null
      return {
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
      if (state === 'connected') emitState('connected', `WebRTC 已連線：${peerId}`)
      if (state === 'connecting') emitState('connecting', `正在建立 WebRTC 連線：${peerId}`)
      if (state === 'disconnected') emitState('recovering', '連線中斷，等待 ICE 恢復')
      if (state === 'failed') {
        emitState('failed', 'ICE 連線失敗')
        if (selfPeerId < peerId && !peer.iceRestarted) restartIce(peer)
      }
    }, peer.peerCleanups)
    listen(connection, 'iceconnectionstatechange', () => {
      if (connection.iceConnectionState === 'failed') {
        emitState('failed', 'ICE 連線失敗')
        if (selfPeerId < peerId && !peer.iceRestarted) restartIce(peer)
      }
    }, peer.peerCleanups)

    metricsTimer = setInterval(() => {
      connectionMetrics(connection)
        .then(metrics => onMetrics?.(metrics))
        .catch(() => {})
    }, 1500)
    peer.peerCleanups.push(() => {
      if (metricsTimer !== null) clearInterval(metricsTimer)
      metricsTimer = null
    })

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
      emitState('waiting', `已加入 ${event.payload.roomId}，peerId ${selfPeerId}`)
      event.payload.peers.forEach(createPeer)
    } else if (event.type === 'lab.peer-joined') {
      createPeer(event.payload.peerId)
    } else if (event.type === 'lab.signal') {
      signalingEvents += 1
      handleSignal(event.payload.from, event.payload.signal)
        .catch(error => emitState('error', `WebRTC 協商錯誤：${error.message}`))
    } else if (event.type === 'lab.peer-left') {
      disposePeer(event.payload.peerId, `Peer 已離開：${event.payload.peerId}`)
    } else if (event.type === 'lab.error') {
      emitState('error', `${event.payload.code}：${event.payload.message}`)
    }
  }

  function connect({ roomId, signalingUrl }) {
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
    url.searchParams.set('roomId', roomId)
    socket = new WebSocket(url)
    listen(socket, 'open', () => {
      emitState('signaling', 'Signaling WebSocket 已連線，正在加入實驗房間')
      sendSocket({ type: 'lab.join', payload: { peerId: selfPeerId } })
    }, socketCleanups)
    listen(socket, 'message', event => handleSocketMessage(event.data), socketCleanups)
    listen(socket, 'close', () => {
      if (!closed) {
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
  }

  function sendText(text) {
    const channel = [...peers.values()].map(peer => peer.channel)
      .find(candidate => candidate?.readyState === 'open')
    if (!channel) return false
    channel.send(text)
    onMessage?.({ sender: '我', text, at: Date.now() })
    return true
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

  return { connect, sendText, dispose, iceServersConfigured: iceServers.length > 0 }
}
