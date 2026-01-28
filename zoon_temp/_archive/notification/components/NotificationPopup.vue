<script setup>
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'
import { container } from '@/container/container.js'

const emit = defineEmits(['close'])
const notificationStore = container.resolve('notificationStore')

const list = computed(() => notificationStore.state.list)

const pos = reactive({ left: 64, top: 120 })
const drag = reactive({ active: false, startX: 0, startY: 0, baseLeft: 0, baseTop: 0 })

function initPosition() {
  pos.top = Math.max((window.innerHeight || 500) - 420, 20)
}

function markRead(id) {
  notificationStore.markAsRead(id)
}

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleString()
}

function onDragStart(e) {
  if (e.button !== 0) return
  drag.active = true
  drag.startX = e.clientX
  drag.startY = e.clientY
  drag.baseLeft = pos.left
  drag.baseTop = pos.top
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', onDragEnd)
}

function onDragMove(e) {
  if (!drag.active) return
  pos.left = Math.max(8, drag.baseLeft + (e.clientX - drag.startX))
  pos.top = Math.max(8, drag.baseTop + (e.clientY - drag.startY))
}

function onDragEnd() {
  drag.active = false
  window.removeEventListener('pointermove', onDragMove)
  window.removeEventListener('pointerup', onDragEnd)
}

onMounted(initPosition)
onBeforeUnmount(() => onDragEnd())
</script>

<template lang="pug">
.popup(:style="{ left: `${pos.left}px`, top: `${pos.top}px` }")
  header.head(@pointerdown="onDragStart")
    span.title 通知
    button.close(@click="emit('close')") ✕
  .list
    template(v-if="list.length")
      .item(v-for="n in list" :key="n.id" :class="{ unread: !n.read }" @click="markRead(n.id)")
        .icon
          span(v-if="n.type === 'task'") ✅
          span(v-else-if="n.type === 'member'") 👥
          span(v-else-if="n.type === 'booking'") 📅
          span(v-else-if="n.type === 'ads'") 📣
          span(v-else) 🔔
        .info
          p.title {{ n.title }}
          p.content {{ n.content }}
          p.time {{ formatTime(n.created_at) }}
    .empty(v-else) 暫無通知
</template>

<style scoped lang="sass">
.popup
  position: fixed
  width: 300px
  height: 360px
  border-radius: 14px
  background: #fff
  box-shadow: 0 16px 32px rgba(15,27,61,0.25)
  border: 1px solid #e4e8f2
  display: flex
  flex-direction: column
  overflow: hidden
  z-index: 51

.head
  display: flex
  justify-content: space-between
  align-items: center
  padding: 10px 12px
  background: linear-gradient(135deg, #0f1b3d, #1c3f8c)
  border-bottom: 1px solid #10274f
  color: #fff
  cursor: grab
  user-select: none

.head:active
  cursor: grabbing

.title
  font-weight: 700
  color: #fff

.close
  border: none
  background: transparent
  font-size: 16px
  cursor: pointer
  color: #fff

.list
  flex: 1
  overflow: auto
  display: flex
  flex-direction: column
  gap: 8px
  padding: 10px

.item
  display: grid
  grid-template-columns: auto 1fr
  gap: 8px
  padding: 8px 10px
  border-radius: 10px
  border: 1px solid #e4e8f2
  cursor: pointer
  transition: 0.12s ease

.item.unread
  background: #eef4ff
  border-color: #d6e4ff

.item:hover
  box-shadow: 0 10px 18px rgba(15,27,61,0.08)

.icon
  width: 32px
  height: 32px
  border-radius: 10px
  background: #f0f3fa
  display: grid
  place-items: center
  font-size: 16px

.info .title
  margin: 0
  font-weight: 700
  color: #0f1b3d

.info .content
  margin: 2px 0
  color: #5f6c88
  font-size: 13px

.info .time
  margin: 0
  color: #8a94aa
  font-size: 12px

.empty
  flex: 1
  display: grid
  place-items: center
  color: #7a859e
</style>
