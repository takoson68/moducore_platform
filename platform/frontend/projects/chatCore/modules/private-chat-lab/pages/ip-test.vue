<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import world from '@/world.js'
import iDB_box from '@/components/iDB_box.vue'
import { createPrivateChatLabSession } from '../runtime.js'
import { createPrivateChatMessageRepository } from '../messageRepository.js'
import { randomId } from '../randomId.js'

// 僅供開發測試：使用另一位合成會員，完成測試後移除預填密碼。
const TEST_USERNAME = 'admin2'
const TEST_PASSWORD = import.meta.env.DEV ? 'chatcore-test-2-2026' : ''
const authStore = world.store('auth')
const tokenStore = world.store('token')
const chatStore = world.store('chatCorePrivateChatLabStore')
const backupStore = world.hasStore('chatCoreBackup') ? world.store('chatCoreBackup') : null
const repository = createPrivateChatMessageRepository()

const loggedIn = computed(() => authStore.isLoggedIn())
const user = computed(() => authStore.state.user)
const sharedRooms = ref([])
const rooms = computed(() => {
  const merged = new Map()
  for (const room of [...sharedRooms.value, ...chatStore.state.roomList]) merged.set(room.id, room)
  return [...merged.values()].sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0))
})
const messages = ref([])
const username = ref(TEST_USERNAME)
const password = ref(TEST_PASSWORD)
const roomCode = ref('')
const draft = ref('')
const status = ref('尚未連線')
const statusKind = ref('idle')
const error = ref('')
const authError = ref('')
const busy = ref(false)
const authBusy = ref(false)
const backupState = computed(() => backupStore?.state || {})
const origin = typeof window === 'undefined' ? '' : window.location.origin
const session = shallowRef(null)
const currentRoom = ref('')
const messageListRef = ref(null)

watch([messageListRef, () => messages.value.at(-1)?.id], ([messageList]) => {
  if (messageList) messageList.scrollTop = messageList.scrollHeight
}, { flush: 'post' })

function apiBase() {
  return import.meta.env.DEV
    ? `${window.location.protocol}//${window.location.hostname}:8787`
    : window.location.origin
}

async function chatApi(path, { method = 'GET', body } = {}) {
  const headers = { 'X-Project': 'chatCore' }
  const token = tokenStore.getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const response = await fetch(`${apiBase()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { ok: response.ok, status: response.status, data: await response.json().catch(() => ({})) }
}

async function login() {
  if (authBusy.value) return
  authBusy.value = true
  authError.value = ''
  try {
    const result = await chatApi('/api/login', {
      method: 'POST',
      body: { username: username.value, password: password.value },
    })
    if (!result.ok || !result.data?.authenticated || !result.data?.token) {
      throw new Error(result.data?.error?.message || '登入失敗，請確認帳號已加入 chatCore 實驗名單。')
    }
    authStore.login(result.data.user)
    tokenStore.setToken(result.data.token)
    try { await refreshRooms() } catch (cause) { error.value = cause.message }
  } catch (cause) {
    authError.value = cause instanceof TypeError
      ? `連不到 ChatCore Worker（${apiBase()}）：請啟動 8787 後端服務。`
      : cause.message
  } finally {
    authBusy.value = false
  }
}

async function refreshRooms() {
  const result = await chatApi('/api/private-chat/rooms')
  if (!result.ok) throw new Error(result.data?.error?.message || '無法載入聊天室清單。')
  sharedRooms.value = Array.isArray(result.data?.rooms) ? result.data.rooms : []
}

function rememberRoom(id) {
  void chatStore.rememberRoom(id).catch(cause => { error.value = `保存聊天室清單失敗：${cause.message}` })
}

async function connect(id = roomCode.value) {
  if (busy.value || backupState.value.busy) return
  const target = String(id || '').trim()
  if (!target) { error.value = '請輸入房間號碼。'; return }
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(target)) { error.value = '房間號碼限 1–64 個英數字、底線或連字號。'; return }
  if (!loggedIn.value) { error.value = '請先登入 chatCore 測試帳號。'; return }
  disconnect()
  busy.value = true
  error.value = ''
  currentRoom.value = target
  roomCode.value = target
  try {
    const deviceId = await chatStore.getDeviceId()
    const saved = await repository.loadRoom(target)
    messages.value = saved.messages
    const ticket = await chatApi('/api/private-chat/ticket', {
      method: 'POST',
      body: { roomId: target, deviceId },
    })
    if (!ticket.ok || !ticket.data?.ticket) {
      throw new Error(ticket.data?.error?.message || `取得房間連線憑證失敗（${ticket.status}）`)
    }
    session.value = createPrivateChatLabSession({
      onState(value) {
        status.value = value.detail || value.state
        statusKind.value = value.state
      },
      onJoined(value) { rememberRoom(value.roomId) },
      onMessage(value) {
        const message = {
          id: value.messageId || randomId(),
          roomId: target,
          sender: value.sender || '其他參與者',
          senderPeerId: value.senderPeerId,
          text: value.text,
          at: value.at || Date.now(),
          direction: 'incoming',
          persisted: true,
        }
        void repository.saveIncomingIfAbsent(message).then(() => {
          if (!messages.value.some(item => item.id === message.id)) messages.value.push(message)
          if (value.messageId) session.value?.sendAcknowledgement(value.senderPeerId, value.messageId, 'persisted')
        }).catch(cause => { error.value = `保存收到的訊息失敗：${cause.message}` })
      },
      onAcknowledgement(value) {
        void repository.recordAcknowledgement(value.messageId, value.peerId, value.stage)
      },
    })
    session.value.connect({ roomId: target, ticket: ticket.data.ticket })
    rememberRoom(target)
    await refreshRooms()
  } catch (cause) {
    error.value = cause.message
    status.value = '連線失敗'
    statusKind.value = 'error'
    disconnect()
  } finally {
    busy.value = false
  }
}

function disconnect() {
  session.value?.dispose()
  session.value = null
  if (statusKind.value !== 'error') {
    status.value = '已中斷連線'
    statusKind.value = 'idle'
  }
}

function createRoom() {
  const id = `room-${randomId().slice(0, 12)}`
  roomCode.value = id
  void connect(id)
}

async function sendMessage() {
  const text = draft.value.trim()
  if (!text || !session.value || busy.value) return
  busy.value = true
  const message = {
    id: randomId(), roomId: currentRoom.value, sender: '我', text,
    at: Date.now(), direction: 'outgoing', persisted: true,
  }
  try {
    await repository.saveOutgoing(message)
    messages.value.push(message)
    const recipients = session.value.sendText(text, message.id)
    if (recipients) await repository.markAttempted(message, recipients)
    else await repository.removeOutbox(message.id)
    draft.value = ''
  } catch (cause) {
    error.value = `訊息處理失敗：${cause.message}`
  } finally {
    busy.value = false
  }
}

function restoreBackup(entry) {
  if (session.value || busy.value) return
  void backupStore?.requestRestore(entry)
}

function formatTime(value) {
  return new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit' }).format(value)
}

onMounted(async () => {
  try { await chatStore.hydrate() } catch (cause) { error.value = `讀取本機聊天室清單失敗：${cause.message}` }
  const token = tokenStore.getToken()
  if (token) {
    try {
      const result = await chatApi('/api/session')
      if (result.data?.authenticated && result.data.user) {
        authStore.login(result.data.user)
        await refreshRooms()
      }
      else { authStore.logout(); tokenStore.setToken(null) }
    } catch { error.value = '無法確認登入狀態，請重新登入。' }
  }
})

onBeforeUnmount(disconnect)
</script>

<template lang="pug">
main.ip-test
  header.topbar
    div.brand
      span.brand-mark C
      div
        strong chatCore
        small 多裝置聊天測試
    div.origin
      span 目前網址
      code {{ origin }}
  section.layout
    aside.sidebar
      div.sidebar-heading
        div
          h1 聊天室
          p 各網址的本機資料彼此獨立
        button.icon-button(type="button" aria-label="建立聊天室" @click="createRoom") ＋
      form.join-form(@submit.prevent="connect()")
        label(for="room-code") 輸入房間號碼
        div.join-row
          input#room-code(v-model="roomCode" placeholder="例如 room-ab12cd" autocomplete="off")
          button.primary(type="submit" :disabled="busy") 進入
      div.room-list
        p.list-label 已建立／加入的聊天室
        button.room-item(
          v-for="room in rooms"
          :key="room.id"
          type="button"
          :class="{ selected: room.id === currentRoom }"
          @click="connect(room.id)"
        )
          span.room-avatar {{ room.id.slice(0, 1).toUpperCase() }}
          span.room-name {{ room.id }}
          span.room-arrow ›
        p.empty(v-if="!rooms.length") 尚無聊天室，輸入房號或建立新房間。
      div.sidebar-footer
        div.account(v-if="loggedIn")
          span.account-dot
          span {{ user?.username || '本機測試帳號' }}
        div.account(v-else)
          span.account-dot.offline
          span 尚未登入
        iDB_box(
          v-if="loggedIn && backupStore"
          :state="backupState"
          :restore-disabled="Boolean(session) || busy"
          restore-disabled-reason="請先離開聊天室再還原。"
          @upload="backupStore.requestUpload()"
          @list="backupStore.requestList()"
          @restore="restoreBackup"
          @close="backupStore.closeList()"
        )
    section.chat-panel
      template(v-if="loggedIn")
        header.chat-header
          div.room-title
            span.room-avatar.large {{ (currentRoom || roomCode || 'C').slice(0, 1).toUpperCase() }}
            div
              h2 {{ currentRoom || '選擇聊天室' }}
              p(:class="['connection-status', statusKind]") {{ status }}
          button.text-button(v-if="session" type="button" @click="disconnect") 離開房間
        div.chat-content(v-if="currentRoom")
          div.messages(ref="messageListRef")
            div.welcome
              span.welcome-symbol ✦
              h3 {{ currentRoom }}
              p 直接分享房間號碼，與同一區域網路中的另一個瀏覽器測試聊天。
            article.message-row(v-for="message in messages" :key="message.id" :class="message.direction")
              span.message-avatar {{ message.direction === 'outgoing' ? '我' : (message.sender || '友').slice(0, 1) }}
              div.message-body
                div.message-meta
                  strong {{ message.sender || (message.direction === 'outgoing' ? '我' : '參與者') }}
                  time {{ formatTime(message.at) }}
                p.bubble {{ message.text }}
          form.composer(@submit.prevent="sendMessage")
            input(v-model="draft" placeholder="傳送訊息…" :disabled="!session" maxlength="2000")
            button.primary(type="submit" :disabled="!session || !draft.trim() || busy") 傳送
        div.empty-chat(v-else)
          span.empty-chat-icon ◌
          h3 從左側選擇聊天室
          p 輸入房間號碼加入，或建立新房間開始測試。
      form.login-card(v-else @submit.prevent="login")
        span.login-icon ◉
        h2 登入 chatCore
        p 測試帳密已預填，按登入即可開始測試。
        label(for="test-username") 帳號
        input#test-username(v-model="username" autocomplete="username" required)
        label(for="test-password") 密碼
        input#test-password(v-model="password" type="password" autocomplete="current-password" required)
        button.primary.login-submit(type="submit" :disabled="authBusy") {{ authBusy ? '登入中…' : '登入' }}
        p.auth-error(v-if="authError") {{ authError }}
  div.notice(v-if="error")
    span.notice-dot
    span {{ error }}
</template>

<style lang="sass" scoped>
:global(*)
  box-sizing: border-box

.ip-test
  --ink: #243334
  --muted: #879394
  --line: #e9eeee
  --accent: #20a889
  display: flex
  flex-direction: column
  width: 100%
  height: 100vh
  min-height: 520px
  color: var(--ink)
  background: #f6f8f8
  font-family: Inter, "Noto Sans TC", sans-serif

.topbar
  height: 68px
  flex: 0 0 68px
  display: flex
  align-items: center
  justify-content: space-between
  padding: 0 28px
  border-bottom: 1px solid var(--line)
  background: white

.brand, .origin, .sidebar-heading, .join-row, .room-title, .message-meta, .account
  display: flex
  align-items: center

.brand
  gap: 11px
  strong, small
    display: block
  strong
    font-size: 15px
  small
    margin-top: 3px
    color: var(--muted)
    font-size: 11px

.brand-mark, .room-avatar
  display: grid
  place-items: center
  width: 36px
  height: 36px
  border-radius: 12px
  color: white
  background: var(--accent)
  font-weight: 700

.origin
  gap: 9px
  color: var(--muted)
  font-size: 12px
  code
    padding: 7px 10px
    border: 1px solid var(--line)
    border-radius: 7px
    color: #536465
    background: #fafcfc

.layout
  display: grid
  grid-template-columns: 310px minmax(0, 1fr)
  flex: 1
  min-height: 0
  max-width: 1440px
  width: 100%
  margin: 0 auto
  background: white
  box-shadow: 0 8px 40px #2234340a

.sidebar
  display: flex
  flex-direction: column
  min-height: 0
  border-right: 1px solid var(--line)

.sidebar-heading
  justify-content: space-between
  padding: 25px 22px 19px
  h1
    margin: 0
    font-size: 19px
  p
    margin: 6px 0 0
    color: var(--muted)
    font-size: 11px

.icon-button
  width: 34px
  height: 34px
  border: 0
  border-radius: 10px
  color: #14866d
  background: #eaf8f4
  font-size: 22px
  cursor: pointer

.join-form
  margin: 0 16px 20px
  padding: 14px
  border: 1px solid var(--line)
  border-radius: 11px
  background: #fbfcfc
  label, input
    display: block
  label
    margin-bottom: 9px
    color: #697778
    font-size: 11px
  input
    min-width: 0
    flex: 1

.join-row
  gap: 7px

input
  width: 100%
  height: 38px
  padding: 0 11px
  border: 1px solid #e1e8e7
  border-radius: 7px
  outline: none
  color: var(--ink)
  background: white
  font: inherit
  font-size: 12px
  &:focus
    border-color: #58c3a8

.primary
  height: 38px
  padding: 0 15px
  border: 0
  border-radius: 7px
  color: white
  background: var(--accent)
  font: inherit
  font-size: 12px
  font-weight: 600
  cursor: pointer
  &:disabled
    opacity: .5
    cursor: not-allowed

.room-list
  flex: 1
  overflow: auto
  padding: 0 10px

.list-label
  margin: 0 10px 9px
  color: #a0aaaa
  font-size: 10px
  font-weight: 700
  letter-spacing: .08em

.room-item
  display: flex
  align-items: center
  width: 100%
  gap: 10px
  padding: 10px
  border: 0
  border-radius: 9px
  text-align: left
  background: transparent
  cursor: pointer
  &:hover, &.selected
    background: #f1f8f6
  .room-avatar
    width: 34px
    height: 34px
    border-radius: 50%
    font-size: 12px

.room-name
  flex: 1
  overflow: hidden
  color: #475758
  font-size: 12px
  text-overflow: ellipsis

.room-arrow
  color: #abb7b7
  font-size: 20px

.empty
  padding: 9px 11px
  color: #a0aaaa
  font-size: 12px
  line-height: 1.7

.sidebar-footer
  display: grid
  gap: 13px
  padding: 16px 19px 20px
  border-top: 1px solid var(--line)

.account
  gap: 8px
  color: #667374
  font-size: 12px

.account-dot, .notice-dot
  width: 8px
  height: 8px
  border-radius: 50%
  background: #2bbb8e
  &.offline
    background: #c2cbca

.text-button
  padding: 0
  border: 0
  color: #16896f
  background: transparent
  font: inherit
  font-size: 12px
  font-weight: 600
  text-align: left
  cursor: pointer
  &:disabled
    opacity: .5

.chat-panel
  display: flex
  flex-direction: column
  min-width: 0
  min-height: 0

.chat-header
  display: flex
  align-items: center
  justify-content: space-between
  height: 76px
  flex: 0 0 76px
  padding: 0 27px
  border-bottom: 1px solid var(--line)

.room-title
  gap: 12px
  h2
    margin: 0
    font-size: 15px
  p
    margin: 5px 0 0
    color: var(--muted)
    font-size: 11px

.room-avatar.large
  width: 40px
  height: 40px
  border-radius: 13px

.connection-status
  &.connected, &.partial
    color: #1a9b76
  &.error, &.failed
    color: #d36a5c

.chat-content
  display: flex
  flex: 1
  flex-direction: column
  min-height: 0

.messages
  flex: 1
  overflow: auto
  padding: 28px clamp(18px, 6vw, 72px)

.welcome
  margin: 7px 0 32px
  text-align: center
  h3
    margin: 9px 0 5px
    font-size: 15px
  p
    margin: 0
    color: var(--muted)
    font-size: 11px

.welcome-symbol, .empty-chat-icon, .login-icon
  color: #37b394
  font-size: 25px

.message-row
  display: flex
  align-items: flex-start
  gap: 9px
  margin: 16px 0
  &.outgoing
    flex-direction: row-reverse
    .message-meta
      justify-content: flex-end
    .bubble
      border-color: #d9f0e9
      border-top-right-radius: 3px
      background: #e9f8f3
  &.incoming .bubble
    border-top-left-radius: 3px

.message-avatar
  display: grid
  place-items: center
  width: 30px
  height: 30px
  flex: 0 0 30px
  border-radius: 50%
  color: #348e7a
  background: #eaf5f2
  font-size: 10px

.message-body
  max-width: min(75%, 520px)

.message-meta
  gap: 8px
  margin: 0 3px 5px
  strong
    color: #697778
    font-size: 10px
  time
    color: #a4adad
    font-size: 9px

.bubble
  margin: 0
  padding: 10px 13px
  border: 1px solid #edf0f0
  border-radius: 12px
  color: #384647
  background: #f8f9f9
  font-size: 13px
  line-height: 1.6
  overflow-wrap: anywhere

.composer
  display: flex
  gap: 9px
  margin: 0 clamp(18px, 6vw, 72px) 22px
  padding: 9px
  border: 1px solid var(--line)
  border-radius: 11px
  background: white
  box-shadow: 0 4px 15px #233a3508
  input
    height: 38px
    border: 0
    &:focus
      border: 0

.empty-chat
  display: flex
  flex: 1
  flex-direction: column
  align-items: center
  justify-content: center
  color: var(--muted)
  h3
    margin: 15px 0 5px
    color: var(--ink)
    font-size: 15px
  p
    margin: 0
    font-size: 12px

.login-card
  width: min(350px, calc(100% - 40px))
  margin: auto
  padding: 30px
  border: 1px solid var(--line)
  border-radius: 15px
  background: white
  box-shadow: 0 12px 36px #233a350b
  h2
    margin: 10px 0 7px
    font-size: 19px
  p
    margin: 0 0 22px
    color: var(--muted)
    font-size: 12px
    line-height: 1.7
  label
    display: block
    margin: 13px 0 7px
    color: #667374
    font-size: 11px

.login-submit
  width: 100%
  margin-top: 19px

.auth-error
  color: #c25248 !important

.notice
  display: flex
  align-items: center
  gap: 9px
  min-height: 38px
  padding: 8px 20px
  border-top: 1px solid var(--line)
  color: #617070
  background: #fff
  font-size: 11px
  .notice-dot
    flex: 0 0 8px

@media (max-width: 700px)
  .topbar
    height: 58px
    flex-basis: 58px
    padding: 0 14px
  .origin
    gap: 0
    span
      display: none
    code
      max-width: 48vw
      overflow: hidden
      text-overflow: ellipsis
  .layout
    grid-template-columns: 118px minmax(0, 1fr)
  .sidebar-heading
    padding: 17px 10px 14px
    h1
      font-size: 15px
    p
      font-size: 9px
  .icon-button
    width: 29px
    height: 29px
  .join-form
    margin: 0 7px 12px
    padding: 8px
    label
      font-size: 9px
    .join-row
      align-items: stretch
      flex-direction: column
    input, .primary
      width: 100%
      height: 34px
      padding: 0 7px
      font-size: 10px
  .room-list
    padding: 0 5px
  .list-label
    margin: 0 4px 8px
    font-size: 8px
  .room-item
    gap: 5px
    padding: 7px 4px
    .room-avatar
      width: 26px
      height: 26px
  .room-name
    font-size: 9px
  .room-arrow
    display: none
  .empty
    padding: 5px
    font-size: 10px
  .sidebar-footer
    gap: 10px
    padding: 12px 8px
  .account, .text-button
    font-size: 9px
  .chat-header
    height: 65px
    flex-basis: 65px
    padding: 0 12px
  .room-title
    gap: 8px
    h2
      max-width: 36vw
      overflow: hidden
      font-size: 12px
      text-overflow: ellipsis
  .room-avatar.large
    width: 34px
    height: 34px
  .messages
    padding: 19px 10px
  .welcome p
    line-height: 1.7
  .message-body
    max-width: 83%
  .composer
    gap: 5px
    margin: 0 9px 12px
    padding: 6px
    .primary
      padding: 0 10px
  .empty-chat
    padding: 10px
    text-align: center
    p
      font-size: 10px
</style>
