<script setup>
import { computed } from 'vue'

/**
 * Props
 */
const props = defineProps({
  task: { type: Object, default: null },

  // 當前登入者（v0 用字串即可）
  currentUser: { type: String, required: true }
})

/**
 * Emits
 */
const emit = defineEmits(['update-status'])

/**
 * 標籤對照
 */
const statusLabels = {
  todo: '待處理',
  doing: '進行中',
  done: '已完成'
}

const priorityLabels = {
  low: '低',
  medium: '中',
  high: '高'
}

/**
 * 是否為任務負責人
 * - 只有負責人可以切狀態
 */
const isAssignee = computed(() => {
  return props.task?.assignee === props.currentUser
})
</script>

<template lang="pug">
.pane.middle(v-if="task")
  // ========================
  // Header
  // ========================
  .head
    h3 {{ task.title }}

    //- ✳️ 只有負責人才能看到狀態操作
    .status-actions(v-if="isAssignee")
      select(
        :value="task.status"
        @change="e => emit('update-status', e.target.value)"
      )
        option(value="todo") 待處理
        option(value="doing") 進行中
        option(value="done") 已完成

    //- 其他人只能查看狀態
    .status-readonly(v-else)
      span.pill
        strong 狀態：
        | {{ statusLabels[task.status] || task.status }}

  // ========================
  // Description
  // ========================
  p.desc {{ task.desc || '尚未填寫描述' }}

  // ========================
  // Meta Info
  // ========================
  .pill-row
    span.pill
      strong 負責人：
      | {{ task.assignee || '未指派' }}

    span.pill
      strong 建立者：
      | {{ task.issuer || '—' }}

    span.pill
      strong 優先：
      | {{ priorityLabels[task.priority] || task.priority }}

    span.pill
      strong 截止：
      | {{ task.due_date || '未設定' }}

  // ========================
  // Participants
  // ========================
  .members
    h4 參與成員
    .chips
      span.chip(
        v-for="m in task.members"
        :key="m"
      ) {{ m }}
</template>

<style scoped lang="sass">
.head
  display: flex
  justify-content: space-between
  align-items: center
  gap: 10px

h3
  margin: 0
  color: #0f1b3d

.status-actions select
  padding: 8px 10px
  border-radius: 10px
  border: 1px solid #d7dded
  background: #fff
  cursor: pointer

.status-readonly .pill
  background: #e3e7f3

.desc
  margin: 6px 0 10px 0
  color: #5f6c88
  line-height: 1.5

.pill-row
  display: flex
  gap: 8px
  flex-wrap: wrap

.pill
  padding: 8px 10px
  border-radius: 10px
  background: #eef1f8
  color: #415073
  font-weight: 700
  font-size: 12px

.members h4
  margin: 0 0 6px 0
  color: #0f1b3d

.chips
  display: flex
  gap: 8px
  flex-wrap: wrap

.chip
  padding: 6px 10px
  border-radius: 10px
  background: #f7f9ff
  border: 1px solid #e4e8f2
  color: #415073
  font-weight: 700
</style>
