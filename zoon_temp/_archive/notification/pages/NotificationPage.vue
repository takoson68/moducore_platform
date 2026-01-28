<script setup>
import { computed, ref } from 'vue'
import { container } from '@/container/container.js'

const notificationStore = container.resolve('notificationStore')
const eventBus = container.resolve('eventBus')

const filterType = ref('all')

const types = [
  { value: 'all', label: '全部' },
  { value: 'system', label: '系統' },
  { value: 'task', label: '任務' },
  { value: 'member', label: '會員' },
  { value: 'booking', label: '預約' },
  { value: 'ads', label: '行銷' }
]

const list = computed(() => {
  if (filterType.value === 'all') return notificationStore.state.list
  return notificationStore.state.list.filter(n => n.type === filterType.value)
})

function markAll() {
  notificationStore.markAllAsRead()
}

function markRead(id) {
  notificationStore.markAsRead(id)
}

function sendTest(type) {
  const payloads = {
    task: { title: '範例任務', content: '任務建立完成' },
    member: { name: 'New User' },
    booking: { content: '預約已建立' },
    system: { title: '系統訊息', content: '背景工作完成' }
  }
  eventBus.emit(
    type === 'task' ? 'task.created' :
    type === 'member' ? 'member.added' :
    type === 'booking' ? 'booking.completed' :
    'system.info',
    payloads[type]
  )
}

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleString()
}
</script>

<template lang="pug">
.notification-page
  .header
    //- h2 通知中心
    .actions
      select(v-model="filterType")
        option(v-for="t in types" :key="t.value" :value="t.value") {{ t.label }}
      button.mark(@click="markAll") 全部已讀
  .tester
    span 測試派發：
    button(@click="sendTest('task')") 任務
    button(@click="sendTest('member')") 會員
    button(@click="sendTest('booking')") 預約
    button(@click="sendTest('system')") 系統

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
.notification-page
  padding: 18px
  background: linear-gradient(160deg, #f6f8ff, #eef1f8)
  height: 100%
  box-sizing: border-box
  width: 100%
  display: flex 
  flex-direction: column
.header
  display: flex
  justify-content: end
  align-items: center
  margin-bottom: 12px

h2
  margin: 0
  color: #0f1b3d

.actions
  display: flex
  gap: 8px
  align-items: center

select
  padding: 8px 10px
  border-radius: 10px
  border: 1px solid #d7dded

.mark
  padding: 8px 12px
  border-radius: 10px
  border: none
  background: linear-gradient(135deg, #0f1b3d, #1c3f8c)
  color: #fff
  cursor: pointer
  font-weight: 700

.tester
  display: flex
  align-items: center
  gap: 6px
  margin-bottom: 12px

.tester button
  padding: 6px 10px
  border-radius: 8px
  border: 1px solid #d7dded
  background: #fff
  cursor: pointer

.list
  display: flex
  flex-direction: column
  gap: 10px
  flex: 1
  overflow: auto
.item
  display: grid
  grid-template-columns: auto 1fr
  gap: 10px
  padding: 10px 12px
  border-radius: 12px
  border: 1px solid #e4e8f2
  background: #fff
  cursor: pointer
  transition: 0.12s ease

.item.unread
  background: #eef4ff
  border-color: #d6e4ff

.item:hover
  box-shadow: 0 10px 18px rgba(15,27,61,0.08)

.icon
  width: 36px
  height: 36px
  border-radius: 12px
  background: #f0f3fa
  display: grid
  place-items: center

.info .title
  margin: 0
  font-weight: 700
  color: #0f1b3d

.info .content
  margin: 2px 0
  color: #5f6c88
  font-size: 14px

.info .time
  margin: 0
  color: #8a94aa
  font-size: 12px

.empty
  color: #7a859e
</style>
