<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { createPrivateChatLabSession } from '../runtime.js'
import { createPrivateChatMessageRepository } from '../messageRepository.js'
import { canMarkMessageRead } from '../readEligibility.js'
import world from '@/world.js'

const route = useRoute()
const router = useRouter()
const ROOM_LIST_STORAGE_KEY = 'chatCore.privateChatLab.recentRooms.v1'
const messageRepository = createPrivateChatMessageRepository()
const roomId = ref(String(route.query.roomId || ''))
const authStore = world.store('auth')
const tokenStore = world.store('token')
const authUser = computed(() => authStore.state.user)
const isLoggedIn = computed(() => authStore.isLoggedIn())
const loginUsername = ref('')
const loginPassword = ref('')
const authBusy = ref(false)
const authError = ref('')
const roomList = ref(loadRoomList())
const pendingOutbox = ref([])
const storageError = ref('')
const isConnecting = ref(false)
const isSending = ref(false)
const draft = ref('')
const viewMode = ref('integrated')
const releaseVersion = import.meta.env.VITE_RELEASE_VERSION || 'dev'
const status = ref({ state: 'disconnected', detail: '尚未連線' })
const messages = ref([])
const metricsByPeer = ref({})
const participants = ref({ count: 0, connectedCount: 0, remoteCount: 0, peers: [] })
const session = ref(null)
const errorMessage = ref('')
const roomNotice = ref('')
const canSend = computed(() => ['connected', 'partial'].includes(status.value.state) && Boolean(draft.value.trim()) && !isSending.value)
const connectLabel = computed(() => session.value ? '已加入房間，等待 Peer' : '加入聊天室')
const isActive = computed(() => ['connected', 'partial'].includes(status.value.state))
const locationHost = typeof window === 'undefined' ? 'chatCore' : window.location.host
const candidateSummary = computed(() => {
  const paths = [...new Set(Object.values(metricsByPeer.value).map(metric => metric.candidatePair?.path).filter(Boolean))]
  return paths.length ? paths.join(' / ') : '等待連線候選'
})
let outboxFlushPromise = null
let readObserver = null
const observedMessageRows = new Map()
const readInFlight = new Set()
const retriesInFlight = new Set()
const retryTimers = new Map()
const chatPaneRef = ref(null)

function isChatReadable() {
  if (document.visibilityState !== 'visible' || !chatPaneRef.value) return false
  const element = chatPaneRef.value
  const style = getComputedStyle(element)
  const rect = element.getBoundingClientRect()
  return style.display !== 'none' && style.visibility !== 'hidden'
    && rect.width > 0 && rect.height > 0
    && rect.bottom > 0 && rect.right > 0
    && rect.top < window.innerHeight && rect.left < window.innerWidth
}

function checkReadEligibility(element, message) {
  if (message.direction !== 'incoming') return
  if (!canMarkMessageRead({
    pageVisible: document.visibilityState === 'visible',
    chatVisible: isChatReadable(),
    messageVisible: Boolean(observedMessageRows.get(element)?.isIntersecting),
    persisted: message.persisted,
    alreadyRead: Boolean(message.readAt),
  })) return
  if (readInFlight.has(message.id)) return
  readInFlight.add(message.id)
  void messageRepository.markRead(message.id, Date.now()).then(updated => {
    if (!updated) return
    Object.assign(message, updated)
    session.value?.sendRead(message.senderPeerId, message.id)
  }).catch(error => {
    storageError.value = `無法保存本機已讀狀態：${error.message}`
  }).finally(() => readInFlight.delete(message.id))
}

function ensureReadObserver() {
  if (readObserver || typeof IntersectionObserver !== 'function') return
  readObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const tracked = observedMessageRows.get(entry.target)
      if (!tracked) continue
      tracked.isIntersecting = entry.isIntersecting && entry.intersectionRatio >= 0.6
      checkReadEligibility(entry.target, tracked.message)
    }
  }, { threshold: [0, 0.6, 1] })
  for (const element of observedMessageRows.keys()) readObserver.observe(element)
}

const vReadEligible = {
  mounted(element, binding) {
    observedMessageRows.set(element, { message: binding.value, isIntersecting: false })
    ensureReadObserver()
    if (readObserver) readObserver.observe(element)
  },
  updated(element, binding) {
    const tracked = observedMessageRows.get(element)
    if (tracked) {
      tracked.message = binding.value
      checkReadEligibility(element, binding.value)
    }
  },
  unmounted(element) {
    readObserver?.unobserve(element)
    observedMessageRows.delete(element)
  },
}

function onVisibilityChange() {
  if (document.visibilityState !== 'visible') return
  for (const [element, tracked] of observedMessageRows) checkReadEligibility(element, tracked.message)
}

function clearRetryTimer(messageId) {
  const timer = retryTimers.get(messageId)
  if (timer) clearTimeout(timer)
  retryTimers.delete(messageId)
}

function startRetryTimer(messageId, delay = 10_000) {
  clearRetryTimer(messageId)
  retryTimers.set(messageId, setTimeout(async () => {
    try {
      const updated = await messageRepository.markTimedOut(messageId)
      if (updated) Object.assign(messages.value.find(item => item.id === messageId) || {}, updated)
    } catch (error) {
      storageError.value = `更新訊息逾時狀態失敗：${error.message}`
    }
    retryTimers.delete(messageId)
  }, delay))
}

function loadRoomList() {
  try {
    const rooms = JSON.parse(localStorage.getItem(ROOM_LIST_STORAGE_KEY) || '[]')
    return Array.isArray(rooms)
      ? rooms.filter(room => room && typeof room.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(room.id)).slice(0, 30)
      : []
  } catch {
    return []
  }
}

function rememberRoom(id) {
  roomList.value = [{ id, lastUsedAt: Date.now() }, ...roomList.value.filter(room => room.id !== id)].slice(0, 30)
  try { localStorage.setItem(ROOM_LIST_STORAGE_KEY, JSON.stringify(roomList.value)) } catch { /* 本機儲存不可用時，仍保留當前頁面清單。 */ }
}

function openRoom(id) {
  viewMode.value = 'focused'
  if (session.value && roomId.value === id) return
  if (session.value) disconnect()
  messages.value = []
  roomId.value = id
  connect()
}

async function restoreRoom(room) {
  try {
    const saved = await messageRepository.loadRoom(room)
    if (roomId.value.trim() !== room) return
    messages.value = saved.messages
    pendingOutbox.value = saved.outbox
    for (const item of saved.outbox) {
      if (item.state !== 'awaiting-confirmation') continue
      startRetryTimer(item.id, Math.max(0, 10_000 - (Date.now() - (item.lastAttemptAt || 0))))
    }
    storageError.value = ''
  } catch (error) {
    if (roomId.value.trim() !== room) return
    messages.value = []
    pendingOutbox.value = []
    storageError.value = `無法讀取此裝置的 IndexedDB 聊天資料：${error.message}`
  }
}

async function persistIncoming(value, targetRoomId) {
  const message = {
    id: value.messageId || crypto.randomUUID(),
    roomId: targetRoomId,
    sender: value.sender,
    senderPeerId: value.senderPeerId,
    text: value.text,
    at: value.at || Date.now(),
    direction: 'incoming',
    persisted: false,
    deliveryStatus: 'received',
    legacy: Boolean(value.legacy),
  }
  try {
    const result = value.messageId
      ? await messageRepository.saveIncomingIfAbsent(message)
      : (await messageRepository.saveMessage(message), { message: { ...message, persisted: true, deliveryStatus: 'persisted' } })
    const existing = messages.value.find(item => item.id === message.id)
    const savedMessage = existing ? Object.assign(existing, result.message) : result.message
    if (!existing) messages.value.push(savedMessage)
    if (value.messageId && value.senderPeerId) session.value?.sendAcknowledgement(value.senderPeerId, value.messageId, 'persisted')
    storageError.value = ''
  } catch (error) {
    message.persistenceError = true
    storageError.value = `收到訊息，但本機保存失敗：${error.message}`
    const existing = messages.value.find(item => item.id === message.id)
    if (existing) Object.assign(existing, message)
    else messages.value.push(message)
  }
}

async function completeOutbox(messageId, recipientPeerIds) {
  const message = messages.value.find(item => item.id === messageId)
  if (!message) return
  const recipientCount = recipientPeerIds.length
  message.recipientCount = recipientCount
  message.recipientPeerIds = recipientPeerIds
  message.recipientStatuses = Object.fromEntries(recipientPeerIds.map(peerId => [peerId, { receivedAt: null, persistedAt: null, readAt: null }]))
  message.deliveryStatus = 'awaiting-confirmation'
  try {
    await messageRepository.markAttempted(message, recipientPeerIds)
    pendingOutbox.value = pendingOutbox.value.map(item => item.id === messageId
      ? { ...item, state: 'awaiting-confirmation', recipientPeerIds, attemptCount: (item.attemptCount || 0) + 1, lastAttemptAt: Date.now() }
      : item)
    startRetryTimer(messageId)
    storageError.value = ''
    return true
  } catch (error) {
    storageError.value = `訊息已交給 DataChannel，但更新本機 outbox 失敗：${error.message}`
    return false
  }
}

async function retryOutboxItem(item) {
  if (!session.value || !item || retriesInFlight.has(item.id)) return
  retriesInFlight.add(item.id)
  try {
    const recipientPeerIds = session.value.getConnectedPeerIds()
    if (recipientPeerIds.length === 0) return
    if (!await completeOutbox(item.id, recipientPeerIds)) return
    const sentPeerIds = session.value.sendText(item.text, item.id)
    if (!sentPeerIds) {
      storageError.value = '訊息尚未交給 DataChannel；outbox 保留待重試。'
      return
    }
    if (sentPeerIds.length < participants.value.remoteCount) {
      storageError.value = `本次送至 ${sentPeerIds.length}/${participants.value.remoteCount} 個在線 Peer；未連線 Peer 不會收到，沒有伺服器離線 queue。`
    }
  } finally {
    retriesInFlight.delete(item.id)
  }
}

function flushPendingOutbox() {
  if (outboxFlushPromise || status.value.state !== 'connected' || !pendingOutbox.value.length) return
  outboxFlushPromise = (async () => {
    for (const item of pendingOutbox.value.filter(entry => entry.state === 'pending')) {
      await retryOutboxItem(item)
      if (status.value.state !== 'connected') break
    }
  })().finally(() => { outboxFlushPromise = null })
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}
const averageLatency = computed(() => {
  const samples = Object.values(metricsByPeer.value)
    .map(metric => metric.candidatePair?.currentRoundTripTime)
    .filter(value => Number.isFinite(value))
  return samples.length ? Math.round(samples.reduce((total, value) => total + value, 0) / samples.length * 1000) : null
})
const totalTraffic = computed(() => Object.values(metricsByPeer.value)
  .reduce((total, metric) => total + (metric.candidatePair?.bytesSent || 0) + (metric.candidatePair?.bytesReceived || 0), 0))

async function connect() {
  if (session.value || isConnecting.value) return
  if (!isLoggedIn.value) { errorMessage.value = '請先使用 dineCore 會員登入 chatCore 實驗。'; return }
  errorMessage.value = ''
  roomNotice.value = ''
  const targetRoomId = roomId.value.trim()
  if (!targetRoomId) {
    errorMessage.value = '請先輸入房間代碼，或建立新聊天室。'
    return
  }
  isConnecting.value = true
  try {
    await restoreRoom(targetRoomId)
    const ticketResult = await chatApi('/api/private-chat/ticket', { method: 'POST', body: { roomId: targetRoomId, deviceId: getDeviceId() } })
    if (!ticketResult.ok || !ticketResult.data?.ticket) throw new Error(ticketResult.data?.error?.message || `無法取得房間 Ticket（${ticketResult.status}）`)
    const next = createPrivateChatLabSession({
      onState: value => {
        status.value = value
        if (value.state === 'connected') flushPendingOutbox()
      },
      onMessage: value => {
        void persistIncoming(value, targetRoomId)
      },
      onAcknowledgement: value => {
        void messageRepository.recordAcknowledgement(value.messageId, value.peerId, value.stage).then(updated => {
          if (!updated) return
          const message = messages.value.find(item => item.id === value.messageId)
          if (message) Object.assign(message, updated)
          if (updated.deliveryStatus === 'persisted') {
            clearRetryTimer(value.messageId)
            pendingOutbox.value = pendingOutbox.value.filter(item => item.id !== value.messageId)
          }
        }).catch(error => {
          storageError.value = `無法保存 ${value.stage} ACK：${error.message}`
        })
      },
      onMetrics: value => { metricsByPeer.value = { ...metricsByPeer.value, [value.peerId]: value } },
      onPeers: value => { participants.value = value },
      onJoined: value => {
        participants.value = { ...participants.value, peerId: value.peerId }
        rememberRoom(value.roomId)
      },
    })
    session.value = next
    next.connect({ roomId: targetRoomId, ticket: ticketResult.data.ticket })
    router.replace({ path: '/console', query: { roomId: targetRoomId } })
  } catch (error) {
    errorMessage.value = error.message
    status.value = { state: 'error', detail: error.message }
    session.value?.dispose()
    session.value = null
  } finally {
    isConnecting.value = false
  }
}

function getDeviceId() {
  const key = 'chatCore.privateChatLab.deviceId.v1'
  let id = localStorage.getItem(key)
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) { id = crypto.randomUUID(); localStorage.setItem(key, id) }
  return id
}

async function login() {
  if (authBusy.value) return
  authBusy.value = true
  authError.value = ''
  try {
    const result = await chatApi('/api/login', { method: 'POST', body: { username: loginUsername.value, password: loginPassword.value }, omitAuth: true })
    if (!result.ok || !result.data?.authenticated || !result.data?.token) authError.value = result.data?.error?.message || '登入失敗；確認帳號已加入 chatCore 實驗名單。'
    else { authStore.login(result.data.user); tokenStore.setToken(result.data.token); loginPassword.value = ''; errorMessage.value = '' }
  } catch (error) { authError.value = `登入服務暫時無法連線：${error.message}` }
  finally { authBusy.value = false }
}

async function logout() {
  if (session.value) disconnect()
  const token = tokenStore.getToken()
  try { await chatApi('/api/logout', { method: 'POST', token }) }
  finally { authStore.logout(); tokenStore.setToken(null) }
}

async function chatApi(path, { method = 'GET', body, token = tokenStore.getToken(), omitAuth = false } = {}) {
  const base = import.meta.env.DEV ? 'http://127.0.0.1:8787' : window.location.origin
  const headers = { 'X-Project': 'chatCore' }
  if (!omitAuth && token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const response = await fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  return { ok: response.ok, status: response.status, data: await response.json().catch(() => ({})) }
}

function disconnect() {
  session.value?.dispose()
  session.value = null
  roomNotice.value = ''
  metricsByPeer.value = {}
  participants.value = { count: 0, connectedCount: 0, remoteCount: 0, peers: [] }
  status.value = { state: 'disconnected', detail: '已中斷連線' }
}

function createRoom() {
  roomId.value = `room-${crypto.randomUUID().slice(0, 12)}`
  connect()
}

async function copyInviteLink() {
  try {
    const inviteUrl = new URL(window.location.href)
    inviteUrl.searchParams.set('roomId', roomId.value)
    await navigator.clipboard.writeText(inviteUrl.toString())
    roomNotice.value = '邀請連結已複製，可以傳給朋友加入。'
  } catch {
    roomNotice.value = '無法複製連結，請從網址列手動複製。'
  }
}

async function sendText() {
  if (isSending.value) return
  const text = draft.value.trim()
  if (!text || !session.value) return
  isSending.value = true
  const message = {
    id: crypto.randomUUID(),
    roomId: roomId.value,
    sender: '我',
    text,
    at: Date.now(),
    direction: 'outgoing',
    recipientCount: 0,
    recipientPeerIds: [],
    recipientStatuses: {},
    persisted: true,
    deliveryStatus: 'pending',
  }
  let savedLocally = false
  try {
    await messageRepository.saveOutgoing(message)
    savedLocally = true
    pendingOutbox.value.push({ id: message.id, roomId: message.roomId, text, at: message.at, state: 'pending', attemptCount: 0 })
    messages.value.push(message)
    storageError.value = ''
    draft.value = ''
    const outboxItem = pendingOutbox.value.find(item => item.id === message.id)
    await retryOutboxItem(outboxItem)
    if (messages.value.find(item => item.id === message.id)?.deliveryStatus === 'pending') {
      storageError.value = '訊息已保存在本機 outbox，等待連線後重試。'
    }
  } catch (error) {
    storageError.value = savedLocally
      ? `訊息已保存在本機 outbox；傳送嘗試失敗：${error.message}`
      : `訊息尚未送出；本機 IndexedDB 保存失敗：${error.message}`
  } finally {
    isSending.value = false
  }
}

onMounted(async () => {
  const token = tokenStore.getToken()
  if (token) {
    try {
      const result = await chatApi('/api/session', { token })
      if (result.data?.authenticated && result.data.user) authStore.login(result.data.user)
      else { authStore.logout(); tokenStore.setToken(null) }
    } catch { authStore.logout(); tokenStore.setToken(null); authError.value = '無法確認登入狀態，請重新登入。' }
  }
  ensureReadObserver()
  document.addEventListener('visibilitychange', onVisibilityChange)
  const initialRoomId = roomId.value.trim()
  if (initialRoomId) void restoreRoom(initialRoomId)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  readObserver?.disconnect()
  readObserver = null
  for (const timer of retryTimers.values()) clearTimeout(timer)
  retryTimers.clear()
  disconnect()
})

function recipientStatusText(message) {
  const statuses = Object.values(message.recipientStatuses || {})
  const total = message.recipientPeerIds?.length || statuses.length
  if (!total) return message.deliveryStatus === 'pending' ? '待送' : '尚無收件 Peer'
  const persisted = statuses.filter(status => status.persistedAt).length
  const received = statuses.filter(status => status.receivedAt).length
  const read = statuses.filter(status => status.readAt).length
  if (message.deliveryStatus === 'timed-out') return `等待 ACK 逾時・已收到 ${received}/${total}・已保存 ${persisted}/${total}`
  if (read) return `已讀 ${read}/${total}・已保存 ${persisted}/${total}`
  if (persisted) return `收件端已保存 ${persisted}/${total}`
  if (received) return `收件端已收到 ${received}/${total}，等待保存確認`
  return message.deliveryStatus === 'pending' ? '待送' : '等待收件端 ACK'
}
</script>

<template lang="pug">
main.chat-shell(:class="`mode-${viewMode}`")
  header.topbar
    .brand-group
      span.brand-mark ◉
      RouterLink.brand-name(to="/") chatCore
      span.experiment-badge M4 實驗環境
      span.version-badge v{{ releaseVersion }}
    .topbar-status
      span.status-indicator(:class="{ active: isActive }")
      span.status-label RTCDataChannel:
      strong(:class="{ active: isActive }") {{ status.state === 'connected' ? 'Connected (Active)' : status.state === 'partial' ? 'Partially connected' : status.state === 'waiting' ? 'Waiting for peers' : ['connecting', 'signaling'].includes(status.state) ? 'Connecting' : 'Not connected' }}
      i.status-divider
      span.status-label 延遲:
      strong {{ averageLatency === null ? '—' : `${averageLatency} ms` }}
      i.status-divider
      span.transport-label(title="僅代表 WebRTC 傳輸通道加密，不代表登入身分驗證或 E2E 加密") 傳輸加密：DTLS/SCTP
    .topbar-actions
      .view-toggle(role="group" aria-label="聊天版面模式")
        button(:class="{ selected: viewMode === 'integrated' }" @click="viewMode = 'integrated'") 整合視圖
        button(:class="{ selected: viewMode === 'focused' }" @click="viewMode = 'focused'") 專注聊天
      form.auth-control(v-if="!isLoggedIn" @submit.prevent="login")
        input(v-model="loginUsername" autocomplete="username" placeholder="dineCore 帳號" aria-label="dineCore 帳號")
        input(v-model="loginPassword" type="password" autocomplete="current-password" placeholder="密碼" aria-label="密碼")
        button(type="submit" :disabled="authBusy") {{ authBusy ? '登入中' : '會員登入' }}
      .auth-control.auth-user(v-else)
        span {{ authUser?.name || authUser?.username }}
        button(type="button" @click="logout") 登出
      span.auth-error(v-if="authError" role="alert") {{ authError }}
      span.avatar(v-if="!isLoggedIn") 訪客

  .workspace
    aside.project-sidebar
      h2 PROJECT DIRECTORY
      .directory-item.current
        span ◉
        strong chatCore
        small 目前
      .directory-item
        span ♧
        span dineCore
      .directory-item
        span ⌘
        span ModuCore 遊戲
        small.demo-tag Demo
      .room-list-section
        .room-list-heading
          strong CHAT ROOMS
          small 本機最近使用
        .room-list-empty(v-if="roomList.length === 0") 建立或加入聊天室後，會列在這裡。
        button.room-list-item(v-for="room in roomList" :key="room.id" type="button" :class="{ active: room.id === roomId }" @click="openRoom(room.id)")
          span.room-list-icon ◉
          span.room-list-name {{ room.id }}
          span.room-list-state(v-if="room.id === roomId && session") 在線
      h2.capability-heading CAPABILITIES 控制台
      .capability-item.active-capability
        span ⌘
        strong 總覽控制台
        span ›
      .capability-item
        span ◉
        span 多人文字聊天室
        small.m1-tag M1b
      .capability-item.muted
        span ♧
        span 聊天室管理
        small.closed-tag 尚未開放
      .capability-item.muted
        span ▣
        span 會員身份授權
        small.closed-tag 尚未開放
      .telemetry-card
        .telemetry-title 連線遙測 (Telemetry)
        .telemetry-row
          span Channel:
          code chat-text
        .telemetry-row
          span 累計流量:
          strong {{ formatBytes(totalTraffic) }}
      .sidebar-foot Staging 實驗環境

    section.dashboard(v-if="viewMode === 'integrated'")
      .dashboard-heading
        div
          .heading-line
            h1 控制台
            span.master-badge Master Hub
          p 這裡集中呈現 chatCore 的實驗入口與 Project 導覽；此視圖提供實驗資訊和聊天入口，不代表管理者身分。
        .environment-chip
          span 本地環境:
          code {{ locationHost }}
      .capabilities-head
        .heading-line
          h2 CAPABILITIES
          span.section-badge 聊天核心能力
        span.module-count 3 項能力
      .capability-cards
        article.capability-card.unavailable
          .card-heading
            h3 會員管理
            span.closed-tag 尚未開放
          p 等待共用會員身份與 Project 授權能力完成後再規劃整合。
          .card-footer 權限授權系統
        article.capability-card.unavailable
          .card-heading
            h3 聊天室管理
            span.closed-tag 尚未開放
          p 多人群組房間、頻道建立與成員權限管理功能尚未開放。
          .card-footer Multi-room Router
        article.capability-card.available
          .card-heading
            h3 多人文字聊天室
            span.m1-tag M1b 實驗
          p 提供最多 20 個在線裝置的 RTCDataChannel 實驗；支援低延遲文字串流與信號除錯。
          .card-footer
            button.text-action(@click="viewMode = 'focused'") 開啟即時傳訊 →
            span.m1-tag 適用測試者

      section.experiment-card
        .experiment-heading
          .experiment-icon ◉
          div
            h2 M1b 文字傳輸實驗室 (WebRTC P2P)
            p 雙向無中介對點通道除錯與模擬
          span.channel-badge RTCDataChannel
        .room-controls
          label.room-field
            span 房間代碼
            input(v-model="roomId" :disabled="Boolean(session)" maxlength="64" autocomplete="off" placeholder="輸入房間代碼")
          button(type="button" :class="roomId.trim() ? 'secondary-button' : 'primary-button'" :disabled="Boolean(session)" @click="createRoom") 建立新聊天室
          button(type="button" :class="roomId.trim() ? 'primary-button' : 'secondary-button'" :disabled="Boolean(session) || !roomId.trim()" @click="connect") 加入聊天室
          button.secondary-button(type="button" :disabled="!session" @click="disconnect") 中斷重連
          button.secondary-button(type="button" :disabled="!session || !roomId" @click="copyInviteLink") 複製邀請連結
        p.inline-notice(v-if="roomNotice") {{ roomNotice }}
        p.error-message(v-if="errorMessage") {{ errorMessage }}
        .connection-banner(:data-state="status.state")
          span.state-dot
          strong {{ status.detail || status.state }}
          span {{ participants.count }} / 20 位參與者
        .metrics-grid
          .metric-card
            span Local Peer ID
            code {{ participants.peerId || '等待加入房間' }}
          .metric-card
            span Remote Peer IDs
            code {{ participants.peers.length ? participants.peers.map(peer => peer.peerId.slice(0, 12)).join(', ') : '尚無遠端 Peer' }}
          .metric-card
            span ICE Candidate
            strong {{ candidateSummary }}
          .metric-card
            span Channel State
            strong {{ Math.max(0, participants.connectedCount - 1) }} / {{ participants.remoteCount }} Open
        .peer-list(v-if="participants.peers.length")
          article.peer-row(v-for="peer in participants.peers" :key="peer.peerId")
            span.peer-dot(:class="{ active: peer.state === 'connected' }")
            strong Peer {{ peer.peerId.slice(0, 12) }}
            span {{ metricsByPeer[peer.peerId]?.candidatePair ? `${metricsByPeer[peer.peerId].candidatePair.path} · ${Math.round((metricsByPeer[peer.peerId].candidatePair.currentRoundTripTime || 0) * 1000)} ms` : peer.state }}
        .experiment-footer
          span 合成文字測試；此實驗尚無登入、歷史紀錄或 E2E 加密。
          span 累計流量 {{ formatBytes(totalTraffic) }}

    section.chat-pane(ref="chatPaneRef")
      .chat-header
        .room-avatar ◉
        .chat-room-title
          .title-line
            h2 {{ session ? `Room ${roomId}` : '聊天室' }}
            span.online-badge(:class="{ connected: isActive }") {{ participants.count }} 在線
          p {{ session ? 'M1b RTCDataChannel 實驗室頻道' : '建立或加入房間開始測試' }}
        .chat-header-actions
          button.icon-button(type="button" :disabled="!session || !roomId" title="複製邀請連結" @click="copyInviteLink") ↗
          button.icon-button(type="button" :disabled="!session" title="離開聊天室" @click="disconnect") ⏻
      .chat-notice(v-if="roomNotice") {{ roomNotice }}
      .chat-warning 知道房間連結的測試者都可以加入；請只傳送合成測試文字。
      .storage-warning(v-if="storageError") {{ storageError }}
      .room-entry(v-if="viewMode === 'focused' && !session")
        label.room-entry-field
          span 房間代碼
          input(v-model="roomId" maxlength="64" autocomplete="off" placeholder="輸入朋友提供的房間代碼")
        .room-entry-actions
          button(type="button" :class="roomId.trim() ? 'secondary-button' : 'primary-button'" @click="createRoom") 建立新聊天室
          button(type="button" :class="roomId.trim() ? 'primary-button' : 'secondary-button'" :disabled="!roomId.trim()" @click="connect") 加入聊天室
      p.error-message(v-if="errorMessage && viewMode === 'focused'") {{ errorMessage }}
      .message-list(aria-live="polite" aria-relevant="additions")
        .connection-pill(v-if="session") ▣ 對點傳輸通道 {{ isActive ? '已就緒' : status.detail }}
        p.empty-state(v-if="messages.length === 0") {{ session ? '連線後從任一 Peer 傳送合成測試文字。' : '先建立新聊天室，或輸入房間代碼加入朋友的聊天室。' }}
        article.message-row(v-for="(message, index) in messages" :key="message.id || `${message.at}-${index}`" v-read-eligible="message" :class="{ 'is-mine': message.sender === '我' }")
          .message-meta
            strong {{ message.sender }}
            time {{ new Date(message.at).toLocaleTimeString() }}
          p {{ message.text }}
          small.message-state(v-if="message.persistenceError") 尚未保存在此裝置
          small.message-state(v-else-if="message.persisted && message.sender !== '我'") {{ message.readAt ? '已保存在此裝置・你已讀' : '已保存在此裝置' }}
          small.message-state(v-else-if="message.deliveryStatus === 'pending'") 已保存在此裝置・待送
          small.message-state(v-else-if="message.sender === '我'") {{ recipientStatusText(message) }}
          button.message-retry(v-if="pendingOutbox.some(item => item.id === message.id)" type="button" :disabled="!session" @click="retryOutboxItem(pendingOutbox.find(item => item.id === message.id))") 重試未確認訊息
      .chat-composer-area
        .quick-actions
          span 快捷資訊:
          span.quick-pill ▣ 合成文字模式
          span.quick-pill ◉ {{ status.state }}
          span.quick-pill ▥ {{ participants.connectedCount }} / {{ participants.count }} 連線
        form.message-form(@submit.prevent="sendText")
          textarea(v-model="draft" :disabled="isSending || !['connected', 'partial'].includes(status.state)" rows="1" maxlength="2000" placeholder="輸入合成測試訊息，按 Enter 傳送…" @keydown.enter.exact.prevent="sendText")
          button.send-button(type="submit" :disabled="!canSend" aria-label="傳送訊息") ➤
        .composer-footer
          span 支援純文字與 RTCDataChannel 傳輸
          span Enter 傳送
</template>

<style lang="sass">
.chat-shell
  --bg: #090e19
  --surface: #0e1524
  --surface-raised: #111b2c
  --line: #202c40
  --text: #e4eaf4
  --muted: #8391a8
  --blue: #2563eb
  min-height: 100vh
  color: var(--text)
  background: var(--bg)
  font-family: Inter, "Segoe UI", "Noto Sans TC", sans-serif
  font-size: 14px
  overflow: hidden

.chat-shell *
  scrollbar-color: #34435b #0b1220
  scrollbar-width: thin

html, body, #app
  scrollbar-color: #34435b #0b1220
  scrollbar-width: thin

::-webkit-scrollbar
  width: 8px
  height: 8px

::-webkit-scrollbar-track
  border-radius: 8px
  background: #0b1220

::-webkit-scrollbar-thumb
  border: 2px solid #0b1220
  border-radius: 8px
  background: #34435b

::-webkit-scrollbar-thumb:hover
  background: #4b6385

.topbar
  position: sticky
  z-index: 2
  top: 0
  display: flex
  min-height: 72px
  align-items: center
  justify-content: space-between
  gap: 20px
  padding: 0 24px
  border-bottom: 1px solid var(--line)
  background: #0d1321

.brand-group, .topbar-status, .topbar-actions, .heading-line, .capabilities-head, .card-heading, .experiment-heading, .title-line, .chat-header, .quick-actions, .experiment-footer, .message-meta
  display: flex
  align-items: center

.brand-group
  gap: 12px
  flex-shrink: 0

.brand-mark, .room-avatar, .experiment-icon
  display: grid
  width: 44px
  height: 44px
  place-items: center
  border-radius: 13px
  color: white
  background: linear-gradient(145deg, #3985ff, #5649df)
  font-size: 23px
  box-shadow: 0 6px 20px #2458dd45

.brand-name
  color: var(--text)
  font-size: 18px
  font-weight: 750
  text-decoration: none

.experiment-badge, .master-badge, .section-badge, .channel-badge, .m1-tag, .online-badge, .closed-tag, .demo-tag, .version-badge
  padding: 5px 9px
  border: 1px solid #254578
  border-radius: 7px
  color: #67a8ff
  background: #10203a
  font-size: 11px
  font-weight: 700

.version-badge
  padding: 5px 8px
  border-color: #34435b
  color: #b6c6db
  background: #182338
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace

.topbar-status
  gap: 10px
  color: #aab5c7
  white-space: nowrap

.status-indicator, .state-dot, .peer-dot
  width: 9px
  height: 9px
  border-radius: 50%
  background: #667085

.status-indicator.active, .peer-dot.active
  background: #10b981
  box-shadow: 0 0 10px #10b98166

.topbar-status strong.active
  color: #10d99a

.status-label, .transport-label
  color: #9aa8bb

.status-divider
  height: 22px
  margin: 0 12px
  border-left: 1px solid #263247

.topbar-actions
  gap: 10px

.auth-control
  display: flex
  align-items: center
  gap: 6px

.auth-control input
  width: 120px
  padding: 8px 9px
  border: 1px solid #2b3950
  border-radius: 7px
  color: var(--text)
  background: #0b1120

.auth-control button
  padding: 8px 10px
  border: 1px solid #2b579a
  border-radius: 7px
  color: #dbe9ff
  background: #1b4e9b
  cursor: pointer

.auth-error
  max-width: 200px
  color: #ff9b9b
  font-size: 11px

.auth-user span
  color: #dbe4f2
  max-width: 100px
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap

.view-toggle
  display: flex
  padding: 3px
  border: 1px solid #28354a
  border-radius: 10px
  background: #151e2e

.view-toggle button, .icon-button
  border: 0
  color: #a9b5c6
  background: transparent
  cursor: pointer

.view-toggle button
  padding: 9px 13px
  border-radius: 7px
  font-weight: 650

.view-toggle button.selected
  color: #fff
  background: var(--blue)

.avatar
  display: grid
  width: 40px
  height: 40px
  place-items: center
  border: 2px solid #3a475d
  border-radius: 50%
  color: #dbe4f2
  background: #2b374a
  font-weight: 700

.workspace
  display: grid
  min-height: calc(100vh - 72px)
  grid-template-columns: 270px minmax(430px, 1fr) minmax(390px, 35vw)

.project-sidebar
  position: relative
  display: flex
  flex-direction: column
  gap: 8px
  padding: 26px 18px 20px
  border-right: 1px solid var(--line)
  background: #0c1320

.project-sidebar h2
  margin: 0 0 8px 9px
  color: #74839a
  font-size: 11px
  letter-spacing: .12em

.directory-item, .capability-item
  display: flex
  min-height: 44px
  align-items: center
  gap: 11px
  padding: 0 12px
  border-radius: 9px
  color: #95a3b7

.directory-item.current
  border: 1px solid #244d8c
  color: #d9e8ff
  background: #101f3b

.directory-item small, .capability-item small
  margin-left: auto

.directory-item.current small, .closed-tag, .demo-tag
  padding: 3px 7px
  border-color: #293a55
  color: #9daec3
  background: #1d293c

.directory-item .demo-tag
  color: #c18cf0
  background: #241937

.capability-heading
  margin-top: 28px !important

.capability-item.active-capability
  color: #d8e5f6
  background: #1b273a

.capability-item.muted
  color: #6e7e95

.m1-tag
  padding: 3px 7px
  border-color: #14594d
  color: #55d5b1
  background: #0d302c

.telemetry-card
  display: grid
  gap: 12px
  margin-top: 26px
  padding: 15px
  border: 1px solid var(--line)
  border-radius: 13px
  background: #101929

.telemetry-title
  color: #a9b7c9
  font-weight: 650

.telemetry-row
  display: flex
  justify-content: space-between
  color: var(--muted)
  font-size: 12px

.telemetry-row code, code
  color: #c0cce0
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace

.telemetry-row strong
  color: #19d6a1

.telemetry-meter
  height: 6px
  overflow: hidden
  border-radius: 9px
  background: #263348

.telemetry-meter span
  display: block
  height: 100%
  border-radius: inherit
  background: #4388ff
  transition: width .3s

.sidebar-foot
  margin-top: auto
  padding: 18px 4px 0
  border-top: 1px solid var(--line)
  color: #65748a
  font-size: 12px

.room-list-section
  display: grid
  gap: 5px
  margin-top: 18px

.room-list-heading
  display: flex
  justify-content: space-between
  align-items: center
  padding: 0 7px 5px
  color: #8291a8
  font-size: 10px
  letter-spacing: .08em

.room-list-heading small
  color: #66758c
  font-size: 9px
  letter-spacing: 0

.room-list-empty
  padding: 8px
  color: #68778e
  font-size: 11px
  line-height: 1.5

.room-list-item
  display: flex
  min-width: 0
  min-height: 38px
  align-items: center
  gap: 9px
  padding: 0 10px
  border: 1px solid transparent
  border-radius: 8px
  color: #9ba9bd
  background: transparent
  text-align: left
  cursor: pointer

.room-list-item:hover
  background: #131e30

.room-list-item.active
  border-color: #244d8c
  color: #d9e8ff
  background: #101f3b

.room-list-icon
  color: #5598ff

.room-list-name
  min-width: 0
  flex: 1
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap

.room-list-state
  color: #35cda5
  font-size: 10px

.dashboard
  min-width: 0
  padding: 30px clamp(20px, 2vw, 38px)
  overflow-y: auto
  max-height: calc(100vh - 72px)

.dashboard-heading
  display: flex
  align-items: start
  justify-content: space-between
  gap: 20px

.heading-line
  gap: 12px

.dashboard h1
  margin: 0
  font-size: 36px
  letter-spacing: -.035em

.master-badge
  font-size: 13px

.dashboard-heading p
  max-width: 700px
  margin: 8px 0 0
  color: #96a4b8
  font-size: 14px
  line-height: 1.7

.environment-chip
  display: grid
  gap: 6px
  flex-shrink: 0
  color: #8392a8
  text-align: right

.environment-chip code
  padding: 8px 11px
  border: 1px solid #28364b
  border-radius: 7px
  background: #111a29

.capabilities-head
  justify-content: space-between
  margin: 36px 0 14px

.capabilities-head h2
  margin: 0
  color: #a6b4c8
  font-size: 13px
  letter-spacing: .1em

.section-badge
  border-color: #284e8c

.module-count
  color: #75849a

.capability-cards
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 15px

.capability-card
  display: flex
  min-height: 230px
  flex-direction: column
  padding: 19px
  border: 1px solid #233149
  border-radius: 18px
  background: #101827

.capability-card.available
  border-color: #23519a
  background: linear-gradient(150deg, #101d32, #111726)
  box-shadow: inset 0 0 0 1px #173260

.card-heading
  justify-content: space-between
  gap: 8px

.card-heading h3
  margin: 0
  font-size: 16px

.capability-card p
  margin: 17px 0
  color: #93a1b5
  line-height: 1.75

.closed-tag
  flex-shrink: 0
  border: 0
  border-radius: 99px
  font-weight: 500

.card-footer
  display: flex
  align-items: center
  justify-content: space-between
  gap: 8px
  margin-top: auto
  padding-top: 13px
  border-top: 1px solid #202d41
  color: #697990

.text-action
  border: 0
  color: #5ca2ff
  background: transparent
  font-weight: 700
  cursor: pointer

.experiment-card
  margin-top: 24px
  padding: 24px
  border: 1px solid #202d42
  border-radius: 18px
  background: #101827

.experiment-heading
  gap: 13px

.experiment-icon
  flex: 0 0 44px
  border: 1px solid #176453
  color: #26c69c
  background: #102d2b
  box-shadow: none

.experiment-heading h2
  margin: 0
  font-size: 17px

.experiment-heading p
  margin: 5px 0 0
  color: #8a99ad
  font-size: 12px

.channel-badge
  margin-left: auto
  border-color: #135a4e
  color: #49d2ac
  background: #10342e

.room-controls
  display: flex
  flex-wrap: wrap
  align-items: end
  gap: 9px
  margin-top: 18px

.room-field, .room-entry-field
  display: grid
  min-width: 150px
  flex: 1
  gap: 5px
  color: #8090a7
  font-size: 11px

.room-field input, .room-entry-field input
  box-sizing: border-box
  width: 100%
  min-height: 38px
  padding: 0 10px
  border: 1px solid #2a3850
  border-radius: 8px
  color: var(--text)
  background: #090f1d

.primary-button, .secondary-button
  min-height: 38px
  padding: 0 12px
  border: 1px solid transparent
  border-radius: 8px
  font-size: 12px
  font-weight: 700
  cursor: pointer

.primary-button
  color: white
  background: var(--blue)

.secondary-button
  border-color: #2b394e
  color: #b3bfd0
  background: #1c293b

.primary-button:disabled, .secondary-button:disabled, .send-button:disabled, .icon-button:disabled
  cursor: not-allowed
  opacity: .45

.inline-notice, .chat-notice
  color: #60d9b0
  font-size: 12px

.error-message
  color: #ff8f88
  font-size: 12px

.connection-banner
  display: flex
  align-items: center
  gap: 10px
  margin-top: 18px
  padding: 11px 13px
  border: 1px solid #2a374d
  border-radius: 10px
  color: #abb8c9
  background: #151f30
  font-size: 12px

.connection-banner[data-state="connected"] .state-dot
  background: #12bf87

.connection-banner > span:last-child
  margin-left: auto

.metrics-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 10px
  margin-top: 12px

.metric-card
  display: grid
  min-width: 0
  gap: 8px
  padding: 13px
  border: 1px solid #1d293b
  border-radius: 12px
  background: #0a1020

.metric-card span
  color: #73839b
  font-size: 11px

.metric-card strong, .metric-card code
  overflow-wrap: anywhere
  color: #65aaff
  font-size: 12px

.metric-card strong
  color: #2bd09d

.peer-list
  display: grid
  gap: 8px
  margin-top: 12px

.peer-row
  display: flex
  align-items: center
  gap: 9px
  padding: 10px 12px
  border: 1px solid #202c40
  border-radius: 9px
  color: #9aa9bc
  font-size: 11px

.peer-row span:last-child
  margin-left: auto

.experiment-footer
  justify-content: space-between
  gap: 12px
  margin-top: 16px
  padding-top: 13px
  border-top: 1px solid #202b3e
  color: #75849a
  font-size: 11px

.chat-pane
  position: sticky
  top: 72px
  display: flex
  height: calc(100vh - 72px)
  min-height: 480px
  flex-direction: column
  border-left: 1px solid var(--line)
  background: #0d1422

.chat-header
  min-height: 90px
  gap: 14px
  padding: 0 20px
  border-bottom: 1px solid var(--line)

.room-avatar
  position: relative
  width: 48px
  height: 48px
  flex: 0 0 48px
  border-radius: 14px
  background: linear-gradient(145deg, #08a9cf, #3264ea)
  box-shadow: none

.chat-room-title
  min-width: 0

.title-line
  gap: 8px

.title-line h2
  overflow: hidden
  margin: 0
  font-size: 16px
  text-overflow: ellipsis
  white-space: nowrap

.online-badge
  flex-shrink: 0
  padding: 3px 7px
  border: 0
  color: #8694a7
  background: #1c293b

.online-badge.connected
  color: #4ad4ab
  background: #10342d

.chat-room-title p
  margin: 5px 0 0
  color: #8190a6
  font-size: 12px

.chat-header-actions
  display: flex
  gap: 8px
  margin-left: auto

.icon-button
  width: 35px
  height: 35px
  border-radius: 8px
  font-size: 20px

.icon-button:hover
  background: #1b2739

.chat-warning
  margin: 12px 16px 0
  padding: 9px 11px
  border: 1px solid #493b28
  border-radius: 8px
  color: #c4a978
  background: #292216
  font-size: 11px
  line-height: 1.5

.storage-warning
  margin: 8px 16px 0
  padding: 9px 11px
  border: 1px solid #70453c
  border-radius: 8px
  color: #ffb0a5
  background: #2c1b1c
  font-size: 11px
  line-height: 1.5

.chat-notice
  margin: 8px 16px 0

.room-entry
  display: grid
  gap: 10px
  margin: 12px 16px 0
  padding: 13px
  border: 1px solid #26344a
  border-radius: 12px
  background: #111b2c

.room-entry-field
  display: grid
  gap: 6px
  color: #8c9bb0
  font-size: 11px
  font-weight: 650

.room-entry-field input
  min-height: 40px
  padding: 0 11px
  border: 1px solid #2a3850
  border-radius: 8px
  color: var(--text)
  background: #090f1d

.room-entry-actions
  display: flex
  gap: 8px

.room-entry-actions button
  flex: 1

.message-list
  display: flex
  min-height: 0
  flex: 1
  flex-direction: column
  gap: 14px
  overflow-y: auto
  padding: 18px 16px

.connection-pill
  align-self: center
  padding: 8px 12px
  border: 1px solid #29364a
  border-radius: 99px
  color: #a5b3c7
  background: #182337
  font-size: 11px

.empty-state
  margin: auto
  padding: 16px
  color: #7c8ba1
  line-height: 1.7
  text-align: center

.message-row
  width: fit-content
  max-width: 88%
  padding: 11px 13px
  border: 1px solid #2b374a
  border-radius: 4px 14px 14px 14px
  color: #d4ddea
  background: #1d293a

.message-row.is-mine
  align-self: flex-end
  border-color: #285bd0
  border-radius: 14px 4px 14px 14px
  background: #245fe0
  box-shadow: 0 5px 15px #164cc533

.message-meta
  gap: 8px
  color: #aebbd0
  font-size: 11px

.message-row.is-mine .message-meta
  justify-content: flex-end
  color: #d1defa

.message-row p
  margin: 6px 0 0
  overflow-wrap: anywhere
  line-height: 1.65
  white-space: pre-wrap

.message-row small
  display: block
  margin-top: 6px
  color: #c8d7f7
  font-size: 10px

.message-row .message-state
  color: #b8c8e3

.message-row .message-retry
  margin-top: 7px
  padding: 4px 8px
  border: 1px solid #496baf
  border-radius: 6px
  color: #e3edff
  background: #1c3970
  font-size: 10px
  cursor: pointer

.message-row .message-retry:disabled
  cursor: not-allowed
  opacity: .5

.chat-composer-area
  border-top: 1px solid var(--line)
  background: #101827

.quick-actions
  flex-wrap: wrap
  gap: 7px
  padding: 9px 13px
  color: #77879d
  font-size: 11px

.quick-pill
  padding: 6px 9px
  border: 1px solid #29364a
  border-radius: 99px
  color: #b1bdce
  background: #1b2739

.message-form
  display: grid
  grid-template-columns: 1fr 44px
  align-items: center
  gap: 9px
  margin: 0 13px
  padding: 8px
  border: 1px solid #29364a
  border-radius: 13px
  background: #080e1c

.message-form textarea
  box-sizing: border-box
  width: 100%
  max-height: 110px
  resize: vertical
  padding: 9px
  border: 0
  outline: 0
  color: var(--text)
  background: transparent
  font: inherit

.message-form textarea::placeholder
  color: #65748b

.send-button
  width: 42px
  height: 42px
  border: 0
  border-radius: 10px
  color: white
  background: #2563eb
  font-size: 20px
  cursor: pointer

.composer-footer
  display: flex
  justify-content: space-between
  padding: 10px 17px 13px
  color: #68778e
  font-size: 10px

.mode-focused .workspace
  grid-template-columns: 250px minmax(0, 1fr)
  min-height: calc(100vh - 72px)

.mode-focused .chat-pane
  position: relative
  top: auto
  width: 100%
  height: calc(100vh - 72px)
  border-right: 1px solid var(--line)

@media (max-width: 1250px)
  .workspace
    grid-template-columns: 225px minmax(360px, 1fr) minmax(340px, 38vw)
  .capability-cards
    grid-template-columns: 1fr
  .capability-card
    min-height: 0
  .topbar-status
    font-size: 12px

@media (max-width: 900px)
  .topbar
    flex-wrap: wrap
    padding: 12px 16px
  .topbar-status
    order: 3
    width: 100%
    overflow-x: auto
  .workspace
    grid-template-columns: minmax(0, 1fr) minmax(320px, 42vw)
  .project-sidebar
    display: none
  .mode-focused .workspace
    grid-template-columns: 210px minmax(0, 1fr)
  .mode-focused .project-sidebar
    display: flex
  .dashboard
    padding: 22px 18px
  .dashboard-heading
    flex-direction: column
  .environment-chip
    text-align: left

@media (max-width: 650px)
  .brand-mark
    width: 36px
    height: 36px
  .brand-name
    font-size: 16px
  .experiment-badge
    display: none
  .version-badge
    padding: 4px 6px
    font-size: 10px
  .topbar-actions
    gap: 8px
  .avatar
    display: none
  .view-toggle button
    padding: 8px
    font-size: 11px
  .workspace
    display: flex
    min-height: calc(100vh - 100px)
    flex-direction: column
  .project-sidebar
    display: none
  .mode-focused .project-sidebar
    display: flex
    width: 100%
    max-height: 190px
    overflow-y: auto
    padding: 14px 16px
  .mode-focused .project-sidebar .capability-heading
    margin-top: 8px !important
  .mode-focused .project-sidebar .telemetry-card
    margin-top: 8px
  .dashboard
    max-height: none
    overflow: visible
  .dashboard h1
    font-size: 30px
  .capability-cards
    grid-template-columns: 1fr
  .experiment-card
    padding: 16px
  .room-controls
    align-items: stretch
  .room-field, .room-entry-field
    min-width: 100%
  .experiment-heading
    flex-wrap: wrap
  .channel-badge
    margin-left: 57px
  .experiment-footer
    align-items: start
    flex-direction: column
  .chat-pane, .mode-focused .chat-pane
    position: relative
    top: auto
    width: 100%
    height: min(78vh, 720px)
    min-height: 500px
    border-top: 1px solid var(--line)
    border-left: 0
  .mode-focused .workspace
    min-height: calc(100vh - 100px)
  .mode-focused .chat-pane
    height: calc(100vh - 100px)
    max-height: 900px
</style>
