<script setup>
import { reactive, ref } from 'vue'

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  activeTaskId: Number,
  search: { type: String, default: '' },
  filterStatus: { type: String, default: 'all' }
})

const emit = defineEmits(['select-task', 'update:search', 'update:filter-status', 'create-task'])

const statusLabels = {
  todo: '待處理',
  doing: '進行中',
  done: '已完成'
}

const statusColors = {
  todo: '#f5a524',
  doing: '#5a8bff',
  done: '#4bcf8a'
}

const showNew = ref(false)
const form = reactive({
  title: '',
  desc: '',
  priority: 'medium',
  due_date: '',
  membersText: ''
})

function toggleNew() {
  showNew.value = !showNew.value
}

function submitNew() {
  if (!form.title.trim()) return
  const payload = {
    title: form.title.trim(),
    desc: form.desc.trim(),
    priority: form.priority,
    due_date: form.due_date,
    status: 'todo',
    members: form.membersText
      ? form.membersText.split(',').map(m => m.trim()).filter(Boolean)
      : []
  }
  emit('create-task', payload)
  form.title = ''
  form.desc = ''
  form.priority = 'medium'
  form.due_date = ''
  form.membersText = ''
  showNew.value = false
}
</script>

<template lang="pug">
.pane.left
  .toolbar
    div
      input.search(
        type="text"
        :value="search"
        placeholder="搜尋任務"
        @input="e => emit('update:search', e.target.value)"
      )
      select.filter(:value="filterStatus" @change="e => emit('update:filter-status', e.target.value)")
        option(value="all") 全部
        option(value="todo") 待處理
        option(value="doing") 進行中
        option(value="done") 已完成
    button.new-btn(type="button" @click="toggleNew") {{ showNew ? '關閉' : '＋ 新任務' }}

  form.new-task(v-if="showNew" @submit.prevent="submitNew")
    input(type="text" v-model="form.title" placeholder="任務標題" required)
    textarea(rows="4" v-model="form.desc" placeholder="描述（選填）")
    .row
      label
        span.label 優先
        select(v-model="form.priority")
          option(value="low") 低
          option(value="medium") 中
          option(value="high") 高
      label
        span.label 截止日
        input(type="date" v-model="form.due_date")
    label
      span.label 成員（以逗號分隔）
      input(type="text" v-model="form.membersText" placeholder="如：cody, esther")
    button.submit(type="submit") 建立

  .list
    .task-item(
      v-for="task in tasks"
      :key="task.id"
      :class="{ active: task.id === activeTaskId }"
      @click="emit('select-task', task.id)"
    )
      .top
        h4 {{ task.title }}
        span.status(:style="{ background: statusColors[task.status] || '#d2d8e8' }") {{ statusLabels[task.status] || task.status }}
      p.desc {{ task.desc }}
      .meta
        span.badge(priority)
          | 優先：{{ task.priority }}
        span.badge(due)
          | 截止：{{ task.due_date || '未設定' }}
        span.badge(members)
          | 成員：{{ task.members?.length || 0 }}
</template>

<style scoped lang="sass">
.toolbar
  display: flex
  flex-direction: column
  gap: 8px
  & > div 
    display: flex
    gap: 8px
.search
  flex: 1
  padding: 10px 12px
  border-radius: 10px
  border: 1px solid #d7dded
  background: #fff

.filter
  padding: 10px 12px
  border-radius: 10px
  border: 1px solid #d7dded
  background: #fff

.new-btn
  padding: 10px 12px
  border-radius: 10px
  border: 1px solid #d7dded
  background: linear-gradient(135deg, #0f1b3d, #1c3f8c)
  color: #fff
  cursor: pointer
  font-weight: 700
  width: 100%
  // height: 3em

.new-task
  margin-top: 10px
  display: flex
  flex-direction: column
  gap: 8px
  padding: 10px
  border: 1px solid #e4e8f2
  border-radius: 12px
  background: #f7f9ff
*
  box-sizing: border-box
.new-task input,
.new-task textarea,
.new-task select
  width: 100%
  padding: 10px 12px
  border-radius: 10px
  border: 1px solid #d7dded
  background: #fff

.new-task .row
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 8px

.new-task .label
  display: block
  margin-bottom: 4px
  color: #5f6c88
  font-weight: 700

.submit
  align-self: flex-end
  padding: 10px 14px
  border-radius: 10px
  border: none
  background: linear-gradient(135deg, #3a7afe, #1d4ba1)
  color: #fff
  font-weight: 700
  cursor: pointer

.list
  margin-top: 10px
  display: flex
  flex-direction: column
  gap: 10px
  overflow: auto

.task-item
  border: 1px solid #e4e8f2
  border-radius: 12px
  padding: 10px 12px
  background: #f9fbff
  cursor: pointer
  transition: 0.15s ease

  &:hover
    box-shadow: 0 8px 16px rgba(15,30,72,0.08)
    transform: translateY(-1px)

  &.active
    border-color: #3a7afe
    box-shadow: 0 10px 20px rgba(58,122,254,0.2)

.top
  display: flex
  justify-content: space-between
  align-items: center
  gap: 8px

h4
  margin: 0
  color: #0f1b3d

.desc
  margin: 4px 0 8px 0
  color: #5f6c88
  font-size: 14px

.status
  padding: 6px 10px
  border-radius: 10px
  color: #fff
  font-weight: 700
  font-size: 12px

.meta
  display: flex
  gap: 8px
  flex-wrap: wrap

.badge
  padding: 6px 10px
  border-radius: 10px
  background: #eef1f8
  color: #415073
  font-weight: 700
  font-size: 12px
</style>
