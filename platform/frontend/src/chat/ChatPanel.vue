<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  chat: { type: Object, required: true },
  startExpanded: { type: Boolean, default: false },
})

// 預設收合，避免初次進入時遮住塔防地圖與控制按鈕。
const collapsed = ref(!props.startExpanded)
const content = ref('')
const messagesEl = ref(null)
const unreadCount = ref(0)
const seenMessageCount = ref(0)
const panelWidth = ref(300)
const resizing = ref(false)
let resizeStartX = 0
let resizeStartWidth = 300
const state = computed(() => props.chat.store('messages').state)
const title = computed(() => `聊天室・${props.chat.roomId || 'public'}`)
const connectionIndicator = computed(() => {
  if (state.value.connectionStatus === 'connected') return { tone: 'online', label: '線上' }
  if (state.value.connectionStatus === 'connecting') return { tone: 'connecting', label: '連線中' }
  if (state.value.connectionStatus === 'reconnecting') return { tone: 'connecting', label: '重新連線中' }
  return { tone: 'offline', label: '離線' }
})

function formatMessageTime(message) {
  const timestamp = message?.serverTime || message?.timestamp
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

async function scrollMessagesToBottom() {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

function startResize(event) {
  if (collapsed.value) return
  resizing.value = true
  resizeStartX = event.clientX
  resizeStartWidth = panelWidth.value
  window.addEventListener('pointermove', resizePanel)
  window.addEventListener('pointerup', stopResize)
}

function resizePanel(event) {
  if (!resizing.value) return
  panelWidth.value = Math.min(520, Math.max(240, resizeStartWidth + event.clientX - resizeStartX))
}

function stopResize() {
  resizing.value = false
  window.removeEventListener('pointermove', resizePanel)
  window.removeEventListener('pointerup', stopResize)
}

onBeforeUnmount(stopResize)

watch(() => state.value.messages.length, messageCount => {
  const delta = Math.max(0, messageCount - seenMessageCount.value)
  seenMessageCount.value = messageCount
  if (collapsed.value) unreadCount.value += delta
  else scrollMessagesToBottom()
})

function toggle() {
  collapsed.value = !collapsed.value
  if (!collapsed.value) {
    unreadCount.value = 0
    seenMessageCount.value = state.value.messages.length
    props.chat.start()
    scrollMessagesToBottom()
  }
}

function ensureConnection() {
  if (state.value.connectionStatus === 'idle') props.chat.start()
}

function send() {
  const value = content.value.trim()
  if (!value || state.value.connectionStatus !== 'connected') return
  try {
    props.chat.service('messages').sendMessage(value)
    content.value = ''
  } catch (error) {
    props.chat.store('messages').addError(error)
  }
}
</script>

<template lang="pug">
  .platform-chat-panel(:class="{ collapsed }" :style="!collapsed ? { width: `${panelWidth}px` } : undefined")
    .platform-chat-resize-handle(v-if="!collapsed" role="separator" aria-label="拖曳調整聊天視窗寬度" @pointerdown="startResize")
    button.platform-chat-toggle(type="button" @click="toggle")
      span.platform-chat-toggle__title
        span.platform-chat-connection-indicator(:class="connectionIndicator.tone" role="status" :aria-label="connectionIndicator.label" :title="connectionIndicator.label")
        span {{ title }}
      span.platform-chat-toggle__action
        span(v-if="collapsed && unreadCount > 0") {{ unreadCount > 99 ? '99+' : unreadCount }} 則未讀
        span {{ collapsed ? '展開' : '收合' }}
    template(v-if="!collapsed")
      .platform-chat-identity(v-if="state.identity") 你的編號：{{ state.identity.displayName }}
      .platform-chat-status(:class="state.connectionStatus") {{ state.connectionStatus === 'connected' ? '已連線' : '連線中／重試中' }}
      .platform-chat-messages(ref="messagesEl" aria-live="polite")
        p(v-if="state.messages.length === 0") 尚無訊息
        p.platform-chat-message(v-for="message in state.messages" :key="message.messageId" :class="{ own: message.sender?.id === state.identity?.playerId }")
          strong {{ message.sender?.displayName || '玩家' }}：
          span {{ message.content }}
          time(v-if="message.serverTime || message.timestamp") {{ formatMessageTime(message) }}
      form.platform-chat-form(@submit.prevent="send")
        input(v-model="content" maxlength="300" placeholder="輸入訊息" :disabled="state.connectionStatus === 'stopped'" @focus="ensureConnection")
        button(type="submit" :disabled="!content.trim() || state.connectionStatus !== 'connected'") 送出
</template>

<style lang="sass">
.platform-chat-panel
  position: fixed
  z-index: 20
  display: block
  box-sizing: border-box
  min-height: 0
  top: 76px
  left: 12px
  width: min(300px, calc(100vw - 24px))
  padding: 8px
  border: 1px solid #315477
  border-radius: 10px
  background: rgba(7, 16, 30, .94)
  color: #dcecff
  box-shadow: 0 8px 24px rgba(0, 0, 0, .28)
  &.collapsed
    width: auto
.platform-chat-resize-handle
  position: absolute
  top: 14px
  right: -5px
  bottom: 14px
  width: 10px
  border-right: 2px solid rgba(110, 220, 255, .7)
  cursor: ew-resize
  opacity: .7
  &:hover
    opacity: 1
.platform-chat-toggle
  display: flex
  justify-content: space-between
  gap: 18px
  width: 100%
  border: 0
  background: transparent
  color: inherit
  cursor: pointer
  font-size: 14px
.platform-chat-toggle__title
  display: inline-flex
  align-items: center
  gap: 6px
.platform-chat-connection-indicator
  display: inline-block
  width: 8px
  height: 8px
  flex: 0 0 8px
  border-radius: 50%
  background: #8b98a8
  box-shadow: 0 0 0 1px rgba(255, 255, 255, .18)
  &.online
    background: #4ce39b
    box-shadow: 0 0 7px rgba(76, 227, 155, .72)
  &.connecting
    background: #f1c75b
    box-shadow: 0 0 7px rgba(241, 199, 91, .62)
.platform-chat-toggle__action
  display: inline-flex
  align-items: center
  gap: 8px
.platform-chat-toggle__action span:first-child
  border-radius: 999px
  padding: 2px 6px
  background: #d95d5d
  color: #fff
  font-size: 10px
.platform-chat-status
  padding: 5px 2px
  color: #9eb2c9
  font-size: 11px
  &.connected
    color: #56e0b6
.platform-chat-identity
  color: #ffd76e
  font-size: 12px
.platform-chat-messages
  display: flex
  flex-direction: column
  gap: 4px
  max-height: 180px
  overflow-y: auto
  padding: 6px 2px
  font-size: 12px
  p
    margin: 0
.platform-chat-message
  display: flex
  align-items: baseline
.platform-chat-message strong
  color: #6edcff
.platform-chat-message.own
  padding: 3px 5px
  border-radius: 5px
  background: rgba(70, 180, 225, .22)
.platform-chat-message time
  margin-left: auto
  padding-left: 8px
  color: rgba(220, 236, 255, .58)
  font-size: 10px
  white-space: nowrap
.platform-chat-form
  display: flex
  gap: 5px
  margin-top: 6px
  input
    min-width: 0
    flex: 1
    border: 1px solid #315477
    border-radius: 5px
    background: #101f33
    color: #fff
    padding: 6px
  button
    border: 1px solid #4cecff
    border-radius: 5px
    background: #1479a9
    color: #fff
    padding: 0 8px
@media (max-width: 600px)
  .platform-chat-panel
    top: 54px
    left: 8px
    width: min(280px, calc(100vw - 16px))
</style>
