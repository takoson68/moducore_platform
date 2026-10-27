<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getDineCoreStaffToken } from '@project/services/dineCoreStaffAuthService.js'
import { Chat } from './chat.js'
import ChatPanel from './ChatPanel.vue'

const props = defineProps({
  apiOrigin: {
    type: String,
    default: 'https://moducore-chat-poc-staging.takoson68.workers.dev'
  }
})

const rooms = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const newRoomId = ref('')
const newDisplayName = ref('')
const activeChat = ref(null)
const activeRoom = ref(null)

function endpoint(path) {
  return `${props.apiOrigin.replace(/\/$/, '')}${path}`
}

function websocketEndpoint() {
  return props.apiOrigin.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws/chat'
}

function enterRoom(room) {
  activeChat.value?.dispose()
  activeRoom.value = room
  activeChat.value = new Chat({ url: websocketEndpoint(), roomId: room.roomId })
}

function authHeaders(withBody = false) {
  const headers = {}
  const token = getDineCoreStaffToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (withBody) headers['Content-Type'] = 'application/json'
  return headers
}

async function request(path, options = {}) {
  const response = await fetch(endpoint(path), {
    ...options,
    headers: { ...authHeaders(Boolean(options.body)), ...(options.headers || {}) }
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const code = data?.error?.code || data?.error || `HTTP_${response.status}`
    throw new Error(String(code))
  }
  return data
}

async function loadRooms() {
  loading.value = true
  error.value = ''
  try {
    const data = await request('/api/chat/rooms')
    rooms.value = Array.isArray(data.rooms) ? data.rooms : []
  } catch (cause) {
    error.value = `聊天室清單載入失敗：${cause.message}`
  } finally {
    loading.value = false
  }
}

async function createRoom() {
  const roomId = newRoomId.value.trim()
  const displayName = newDisplayName.value.trim()
  if (!roomId || !displayName) {
    error.value = '請填寫聊天室編號與顯示名稱。'
    return
  }

  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    await request('/api/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({ roomId, displayName })
    })
    newRoomId.value = ''
    newDisplayName.value = ''
    notice.value = '聊天室已建立。'
    await loadRooms()
  } catch (cause) {
    error.value = `建立失敗：${cause.message}`
  } finally {
    saving.value = false
  }
}

async function renameRoom(room) {
  const displayName = window.prompt('輸入新的聊天室名稱', room.displayName)
  if (displayName === null || !displayName.trim()) return
  error.value = ''
  notice.value = ''
  try {
    await request(`/api/chat/rooms/${encodeURIComponent(room.roomId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ displayName: displayName.trim() })
    })
    notice.value = '聊天室名稱已更新。'
    await loadRooms()
  } catch (cause) {
    error.value = `更新失敗：${cause.message}`
  }
}

async function deactivateRoom(room) {
  if (!window.confirm(`確定停用「${room.displayName}」嗎？`)) return
  error.value = ''
  notice.value = ''
  try {
    await request(`/api/chat/rooms/${encodeURIComponent(room.roomId)}`, { method: 'DELETE' })
    notice.value = '聊天室已停用。'
    await loadRooms()
  } catch (cause) {
    error.value = `停用失敗：${cause.message}`
  }
}

onMounted(loadRooms)
onBeforeUnmount(() => activeChat.value?.dispose())
</script>

<template lang="pug">
.chat-room-admin
  section.chat-room-admin__intro
    p.eyebrow Platform Chat
    h2 聊天室管理
    p.lead 這裡管理平台共用的公共聊天室；新專案第一次連線時也會自動出現在清單。

  section.chat-room-admin__create
    h3 建立聊天室
    .chat-room-admin__form
      label
        span 聊天室編號
        input(v-model="newRoomId" maxlength="50" placeholder="例如 game-demo")
      label
        span 顯示名稱
        input(v-model="newDisplayName" maxlength="80" placeholder="例如 Game Demo 公共頻道")
      button(type="button" :disabled="saving" @click="createRoom") {{ saving ? '建立中…' : '建立' }}

  p.chat-room-admin__notice(v-if="notice") {{ notice }}
  p.chat-room-admin__error(v-if="error") {{ error }}

  section.chat-room-admin__list
    .chat-room-admin__list-head
      h3 目前聊天室
      button.chat-room-admin__refresh(type="button" :disabled="loading" @click="loadRooms") {{ loading ? '載入中…' : '重新整理' }}
    p.chat-room-admin__empty(v-if="!loading && rooms.length === 0") 目前尚未註冊聊天室。
    .chat-room-admin__room(v-for="room in rooms" :key="room.roomId")
      .chat-room-admin__room-copy
        strong {{ room.displayName }}
        code {{ room.roomId }}
        small 建立於 {{ new Date(room.createdAt).toLocaleString() }}
      .chat-room-admin__room-actions
        span.chat-room-admin__status {{ room.status === 'active' ? '啟用中' : '已停用' }}
        button(type="button" :disabled="room.status !== 'active'" @click="enterRoom(room)") 進入聊天室
        button(type="button" @click="renameRoom(room)") 改名
        button.chat-room-admin__danger(type="button" @click="deactivateRoom(room)") 停用

  p.chat-room-admin__selected(v-if="activeRoom") 目前測試聊天室：{{ activeRoom.displayName }}（{{ activeRoom.roomId }}）
  ChatPanel(v-if="activeChat" :chat="activeChat")
</template>

<style lang="sass">
.chat-room-admin
  display: grid
  gap: 18px

.chat-room-admin__intro,
.chat-room-admin__create,
.chat-room-admin__list
  padding: 22px
  border: 1px solid rgba(140, 90, 31, .12)
  border-radius: 22px
  background: rgba(255, 255, 255, .92)

.chat-room-admin__intro h2,
.chat-room-admin__create h3,
.chat-room-admin__list h3
  margin: 0
  color: #243a3e

.chat-room-admin__intro
  display: grid
  gap: 8px

.eyebrow
  margin: 0
  color: #8c5a1f
  font-size: 12px
  font-weight: 700
  letter-spacing: .08em
  text-transform: uppercase

.lead
  margin: 0
  color: #6f5b43
  line-height: 1.7

.chat-room-admin__create
  display: grid
  gap: 14px

.chat-room-admin__form
  display: grid
  grid-template-columns: minmax(120px, 1fr) minmax(180px, 2fr) auto
  gap: 10px
  align-items: end

.chat-room-admin__form label
  display: grid
  gap: 6px
  color: #6f5b43
  font-size: 13px

.chat-room-admin input
  min-width: 0
  padding: 10px 12px
  border: 1px solid rgba(45, 111, 109, .24)
  border-radius: 10px
  background: #fff
  color: #243a3e

.chat-room-admin button
  border: 0
  border-radius: 10px
  padding: 10px 14px
  background: #17383f
  color: #fff
  font-weight: 700
  cursor: pointer

.chat-room-admin button:disabled
  cursor: wait
  opacity: .55

.chat-room-admin__notice
  margin: 0
  color: #2d6f6d

.chat-room-admin__error
  margin: 0
  color: #a43c32

.chat-room-admin__list
  display: grid
  gap: 12px

.chat-room-admin__list-head
  display: flex
  justify-content: space-between
  gap: 12px
  align-items: center

.chat-room-admin__refresh
  padding: 7px 10px !important
  background: rgba(121, 214, 207, .2) !important
  color: #2d6f6d !important
  font-size: 12px

.chat-room-admin__empty
  margin: 0
  color: #6e8083

.chat-room-admin__room
  display: flex
  justify-content: space-between
  gap: 14px
  align-items: center
  padding: 14px 0
  border-top: 1px solid rgba(45, 111, 109, .12)

.chat-room-admin__room-copy
  display: grid
  gap: 4px

.chat-room-admin__room-copy strong
  color: #243a3e

.chat-room-admin__room-copy code
  color: #2d6f6d
  font-size: 12px

.chat-room-admin__room-copy small
  color: #8a9696

.chat-room-admin__room-actions
  display: flex
  flex-wrap: wrap
  gap: 7px
  justify-content: flex-end
  align-items: center

.chat-room-admin__status
  color: #2d6f6d
  font-size: 12px

.chat-room-admin__selected
  margin: 0
  color: #2d6f6d
  font-size: 13px

.chat-room-admin__danger
  background: #9b4b43 !important

@media (max-width: 680px)
  .chat-room-admin__form
    grid-template-columns: 1fr
  .chat-room-admin__room
    align-items: flex-start
    flex-direction: column
  .chat-room-admin__room-actions
    justify-content: flex-start
</style>
