<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  chat: { type: Object, required: true },
})

// 預設收合，避免初次進入時遮住塔防地圖與控制按鈕。
const collapsed = ref(true)
const content = ref('')
const state = computed(() => props.chat.store('messages').state)

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
.platform-chat-panel(:class="{ collapsed }")
  button.platform-chat-toggle(type="button" @click="collapsed = !collapsed")
    span 公共聊天室
    span {{ collapsed ? '展開' : '收合' }}
  template(v-if="!collapsed")
    .platform-chat-identity(v-if="state.identity") 你的編號：{{ state.identity.displayName }}
    .platform-chat-status(:class="state.connectionStatus") {{ state.connectionStatus === 'connected' ? '已連線' : '連線中／重試中' }}
    .platform-chat-messages(aria-live="polite")
      p(v-if="state.messages.length === 0") 尚無訊息
      p.platform-chat-message(v-for="message in state.messages" :key="message.messageId" :class="{ own: message.sender?.id === state.identity?.playerId }")
        strong {{ message.sender?.displayName || '玩家' }}：
        span {{ message.content }}
    form.platform-chat-form(@submit.prevent="send")
      input(v-model="content" maxlength="300" placeholder="輸入訊息" :disabled="state.connectionStatus !== 'connected'")
      button(type="submit" :disabled="!content.trim() || state.connectionStatus !== 'connected'") 送出
</template>

<style lang="sass">
.platform-chat-panel
  position: fixed
  z-index: 20
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
.platform-chat-message strong
  color: #6edcff
.platform-chat-message.own
  padding: 3px 5px
  border-radius: 5px
  background: rgba(110, 220, 255, .1)
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
