<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { createPrivateChatLabSession } from '../runtime.js'

const route = useRoute()
const router = useRouter()
const roomId = ref(String(route.query.roomId || ''))
const draft = ref('')
const status = ref({ state: 'disconnected', detail: '尚未連線' })
const messages = ref([])
const metrics = ref(null)
const session = ref(null)
const errorMessage = ref('')
const canSend = computed(() => status.value.state === 'connected' && Boolean(draft.value.trim()))
const connectLabel = computed(() => session.value ? '已加入房間，等待 Peer' : '加入聊天室')

function connect() {
  if (session.value) return
  errorMessage.value = ''
  try {
    const next = createPrivateChatLabSession({
      onState: value => { status.value = value },
      onMessage: value => messages.value.push(value),
      onMetrics: value => { metrics.value = value },
    })
    session.value = next
    next.connect({ roomId: roomId.value.trim() })
    router.replace({ path: '/lab', query: { roomId: roomId.value.trim() } })
  } catch (error) {
    errorMessage.value = error.message
    status.value = { state: 'error', detail: error.message }
    session.value?.dispose()
    session.value = null
  }
}

function disconnect() {
  session.value?.dispose()
  session.value = null
  metrics.value = null
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
    errorMessage.value = '聊天室連結已複製，可以傳給朋友加入。'
  } catch {
    errorMessage.value = '無法複製連結，請從網址列手動複製。'
  }
}

function sendText() {
  const text = draft.value.trim()
  if (!text || !session.value?.sendText(text)) return
  draft.value = ''
}

onBeforeUnmount(disconnect)
</script>

<template lang="pug">
main.lab-page
  header.lab-header
    RouterLink.lab-brand(to="/console") chatCore 控制台
    span M1 · Private Chat Lab

  section.lab-intro
    p.lab-eyebrow TWO PEER EXPERIMENT
    h1 RTCDataChannel
    p.lab-lead
      | 建立新聊天室後複製連結給朋友，或輸入朋友提供的房間代碼加入。兩端交換 offer、answer、ICE candidate 後，純文字會走 Peer 間的 DataChannel。
    p.lab-warning 僅輸入合成測試文字；每房最多兩個 Peer。目前沒有 E2E 加密、會員登入或聊天紀錄。

  section.lab-panel
    .lab-controls
      label.room-field
        span 房間代碼
        input(v-model="roomId" :disabled="Boolean(session)" maxlength="64" autocomplete="off" placeholder="建立新聊天室或貼上代碼")
      button.primary-button(type="button" :disabled="Boolean(session)" @click="createRoom") 建立新聊天室
      button.secondary-button(type="button" :disabled="Boolean(session) || !roomId.trim()" @click="connect") {{ connectLabel }}
      button.secondary-button(type="button" :disabled="!session" @click="disconnect") 中斷並釋放
      button.secondary-button(type="button" :disabled="!session || !roomId" @click="copyInviteLink") 複製邀請連結
    p.error-message(v-if="errorMessage") {{ errorMessage }}
    .connection-state(:data-state="status.state")
      span.state-dot
      div
        strong {{ status.state }}
        p {{ status.detail }}

    .metrics-grid(v-if="session")
      .metric-card
        span Signaling events
        strong {{ metrics?.signalingEvents ?? 0 }}
      .metric-card
        span ICE connection
        strong {{ metrics?.iceState || 'gathering' }}
      .metric-card
        span Candidate pair
        strong {{ metrics?.candidatePair ? `${metrics.candidatePair.path} · ${metrics.candidatePair.local}/${metrics.candidatePair.remote}` : '尚未選定' }}
      .metric-card
        span RTT / DataChannel bytes
        strong {{ metrics?.candidatePair ? `${Math.round((metrics.candidatePair.currentRoundTripTime || 0) * 1000)} ms · ↑${metrics.candidatePair.bytesSent} / ↓${metrics.candidatePair.bytesReceived}` : '—' }}

  section.lab-panel.message-panel
    .section-head
      div
        p.lab-eyebrow SYNTHETIC TEXT ONLY
        h2 雙向文字測試
      span.channel-state {{ status.state === 'connected' ? 'DataChannel 已開啟' : '等待連線' }}
    .message-list(aria-live="polite" aria-relevant="additions")
      p.empty-state(v-if="messages.length === 0") 連線後從任一端送出測試文字。
      article.message-row(v-for="(message, index) in messages" :key="`${message.at}-${index}`" :class="{ 'is-mine': message.sender === '我' }")
        strong {{ message.sender }}
        p {{ message.text }}
        time {{ new Date(message.at).toLocaleTimeString() }}
    form.message-form(@submit.prevent="sendText")
      textarea(v-model="draft" :disabled="status.state !== 'connected'" rows="2" maxlength="2000" placeholder="輸入合成測試文字")
      button.primary-button(type="submit" :disabled="!canSend") 傳送

  footer.lab-footnote
    p ICE server：{{ session?.iceServersConfigured ? '使用環境設定' : '未設定；目前只會嘗試可用的 host candidate' }}
    p 目前使用 STUN 進行直連協商；TURN relay 尚未設定，遇到嚴格 NAT 或網路限制時可能無法連線。
</template>

<style lang="sass">
.lab-page
  min-height: 100vh
  padding: clamp(20px, 4vw, 48px)
  color: #172a3b
  font-family: "Segoe UI", "Noto Sans TC", sans-serif
  background: linear-gradient(145deg, #f7f9fd, #edf3fa)

.lab-header, .lab-intro, .lab-panel, .lab-footnote
  width: min(100%, 960px)
  margin-right: auto
  margin-left: auto

.lab-header
  display: flex
  justify-content: space-between
  color: #6a7b90
  font-size: 13px

.lab-brand
  color: #285ca8
  font-weight: 700
  text-decoration: none

.lab-intro
  margin-top: 50px

.lab-eyebrow
  margin: 0 0 8px
  color: #4168a0
  font-size: 11px
  font-weight: 800
  letter-spacing: .13em

.lab-intro h1
  margin: 0
  font-size: clamp(34px, 6vw, 54px)
  letter-spacing: -.04em

.lab-lead, .lab-warning
  max-width: 740px
  color: #596b80
  line-height: 1.75

.lab-warning
  color: #9a5b16
  font-size: 13px

.lab-panel
  margin-top: 24px
  padding: clamp(18px, 3vw, 26px)
  border: 1px solid #dce4ef
  border-radius: 18px
  background: #ffffffd9
  box-shadow: 0 8px 26px #253b580a

.lab-controls
  display: flex
  flex-wrap: wrap
  align-items: end
  gap: 12px

.room-field
  display: grid
  min-width: 200px
  flex: 1
  gap: 7px
  color: #53677f
  font-size: 12px
  font-weight: 700

.room-field input, .message-form textarea
  box-sizing: border-box
  width: 100%
  padding: 12px
  border: 1px solid #d4deeb
  border-radius: 10px
  color: #172a3b
  background: #fbfcfe

.primary-button, .secondary-button
  min-height: 42px
  padding: 0 15px
  border: 0
  border-radius: 10px
  font-weight: 700
  cursor: pointer

.primary-button
  color: #fff
  background: #285ca8

.secondary-button
  color: #34516f
  background: #e9eff7

.primary-button:disabled, .secondary-button:disabled
  cursor: not-allowed
  opacity: .5

.connection-state
  display: flex
  align-items: center
  gap: 12px
  margin-top: 24px

.connection-state strong
  text-transform: uppercase
  font-size: 12px

.connection-state p
  margin: 4px 0 0
  color: #66778c
  font-size: 13px

.state-dot
  width: 10px
  height: 10px
  border-radius: 50%
  background: #9aa8b8

.connection-state[data-state="connected"] .state-dot
  background: #2a9a68

.connection-state[data-state="error"] .state-dot, .connection-state[data-state="failed"] .state-dot
  background: #c84848

.metrics-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))
  gap: 10px
  margin-top: 22px

.metric-card
  display: grid
  gap: 7px
  padding: 12px
  border-radius: 11px
  background: #f1f5fa

.metric-card span
  color: #708097
  font-size: 11px

.metric-card strong
  overflow-wrap: anywhere
  font-size: 13px

.section-head
  display: flex
  flex-wrap: wrap
  align-items: center
  justify-content: space-between
  gap: 12px

.section-head h2
  margin: 0
  font-size: 20px

.channel-state
  padding: 7px 10px
  border-radius: 99px
  color: #63758a
  background: #f1f5fa
  font-size: 11px

.message-list
  display: grid
  max-height: 320px
  gap: 10px
  overflow: auto
  margin: 20px 0

.empty-state
  color: #8090a4
  font-size: 13px

.message-row
  width: fit-content
  max-width: min(86%, 620px)
  padding: 11px 13px
  border-radius: 12px 12px 12px 4px
  background: #edf2f8

.message-row.is-mine
  justify-self: end
  border-radius: 12px 12px 4px 12px
  background: #dceaff

.message-row strong, .message-row time
  color: #61748b
  font-size: 11px

.message-row p
  margin: 5px 0
  overflow-wrap: anywhere
  white-space: pre-wrap

.message-form
  display: grid
  grid-template-columns: 1fr auto
  align-items: end
  gap: 10px

.message-form textarea
  resize: vertical
  font: inherit

.lab-footnote
  display: grid
  gap: 4px
  margin-top: 18px
  color: #77879a
  font-size: 11px
  line-height: 1.6

.lab-footnote p
  margin: 0

.lab-dev-warning, .error-message
  color: #b34a3e
  font-size: 13px

@media (max-width: 560px)
  .message-form
    grid-template-columns: 1fr
</style>
