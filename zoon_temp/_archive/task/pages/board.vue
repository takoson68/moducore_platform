<script setup>
import { computed, ref } from 'vue'
import { container } from '@/container/container.js'
import TaskList from '../components/TaskList.vue'
import TaskDetail from '../components/TaskDetail.vue'
import TaskMessages from '../components/TaskMessages.vue'

const taskStore = container.resolve('taskStore')
const search = ref('')
const filterStatus = ref('all')
const composer = ref('')

const tasks = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return taskStore.state.tasks.filter(t => {
    const hit = !keyword ||
      t.title.toLowerCase().includes(keyword) ||
      t.desc.toLowerCase().includes(keyword)
    const statusOk = filterStatus.value === 'all' || t.status === filterStatus.value
    return hit && statusOk
  })
})

const activeTask = computed(() =>
  taskStore.state.tasks.find(t => t.id === taskStore.state.activeTaskId)
)

function selectTask(id) {
  taskStore.selectTask(id)
  composer.value = ''
}

function updateStatus(status) {
  if (!activeTask.value) return
  taskStore.updateTask(activeTask.value.id, { status })
}

function createTask(payload) {
  taskStore.addTask(payload)
}

function sendMessage() {
  if (!composer.value.trim() || !activeTask.value) return
  taskStore.addMessage({
    taskId: activeTask.value.id,
    user: 'you',
    text: composer.value
  })
  composer.value = ''
}
</script>

<template lang="pug">
.task-board
  .board-shell
    TaskList(
      :tasks="tasks"
      :active-task-id="taskStore.state.activeTaskId"
      v-model:search="search"
      v-model:filter-status="filterStatus"
      @create-task="createTask"
      @select-task="selectTask"
    )

    TaskDetail(
      :task="activeTask"
      @update-status="updateStatus"
    )

    TaskMessages(
      :task="activeTask"
      v-model:composer="composer"
      @send="sendMessage"
    )
</template>

<style scoped lang="sass">
.task-board
  flex: 1
  width: 100%
  height: 100%
  background: linear-gradient(160deg, #f6f8ff, #eef1f8)
  padding: 18px
  box-sizing: border-box
  overflow: hidden

.board-shell
  display: grid
  grid-template-columns: 28% 40% 30%
  gap: 1%
  height: 100%
  min-height: 560px
  box-sizing: border-box !important

:deep(.pane)
  background: rgba(255,255,255,0.9)
  border-radius: 14px
  box-shadow: 0 10px 26px rgba(15, 30, 72, 0.08)
  border: 1px solid #e6e8f1
  padding: 16px
  display: flex
  flex-direction: column
  gap: 12px
  min-height: 0

:deep(.pane.left)
  overflow: hidden

:deep(.pane.middle)
  overflow: hidden

:deep(.pane.right)
  overflow: auto
</style>
