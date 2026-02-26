<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useQuickNote } from '@project/composables/useQuickNote.js'
import { useTasks } from '@project/modules/tasks/composables/useTasks.js'
import { todayStr } from '@project/modules/tasks/utils/date.js'

const {
  content,
  loading,
  error,
  saveState,
  date,
  setContent,
  load,
  reset,
  requestSave,
  flushSave,
} = useQuickNote()
const { addTask } = useTasks()

onMounted(() => {
  load().catch(() => {})
})

onBeforeUnmount(() => {
  flushSave().catch(() => {})
})

const statusText = computed(() => {
  if (error.value) return 'error'
  if (saveState.value === 'saving') return 'saving...'
  if (saveState.value === 'saved') return 'saved'
  return ''
})

async function handleConvertToTask() {
  const title = content.value.trim()
  if (!title) return

  try {
    await addTask({
      title,
      dueDate: todayStr(),
      priority: 'normal',
    })
    await reset()
  } catch {
    // 錯誤已由 useTasks / useQuickNote 在各自 UI 顯示
  }
}

async function handleClear() {
  try {
    await reset()
  } catch {
    // error shown by composable
  }
}

function handleInput(event) {
  setContent(event.target.value)
  requestSave()
}
</script>

<template lang="pug">
.quick-note-widget.notes-card
  .quick-note-head
    h3.notes-title Quick Note (Today)
    span.quick-note-date {{ date }}
  textarea.quick-note-input(
    :value="content"
    :disabled="loading"
    placeholder="把想法先丟這裡…"
    @input="handleInput"
  )
  .quick-note-foot
    span.quick-note-status(:class="{ 'is-error': !!error }") {{ statusText }}
    .quick-note-actions
      button.quick-note-btn(type="button" :disabled="loading" @click="handleConvertToTask") 轉成任務
      button.quick-note-btn.is-secondary(type="button" :disabled="loading" @click="handleClear") 清空
  p.quick-note-error(v-if="error") {{ error }}
</template>

<style lang="sass">
.quick-note-widget
  display: flex
  flex-direction: column
  gap: 0.65rem

.quick-note-head
  display: flex
  justify-content: space-between
  align-items: baseline
  gap: 0.5rem

.quick-note-date
  color: #7a8194
  font-size: 0.8rem

.quick-note-input
  width: 100%
  min-height: 7.25rem
  resize: vertical
  border: 1px solid rgba(36, 42, 54, 0.08)
  background: rgba(255, 255, 255, 0.84)
  color: #2a3040
  border-radius: 0.9rem
  padding: 0.75rem 0.85rem
  font: inherit
  line-height: 1.45

.quick-note-foot
  display: flex
  justify-content: space-between
  align-items: center
  gap: 0.5rem
  flex-wrap: wrap

.quick-note-status
  color: #7a8194
  font-size: 0.8rem

.quick-note-status.is-error
  color: #b42318

.quick-note-actions
  display: inline-flex
  gap: 0.4rem
  flex-wrap: wrap

.quick-note-btn
  border: 0
  border-radius: 999px
  background: rgba(183, 155, 213, 0.16)
  color: #5f4f80
  padding: 0.42rem 0.7rem
  cursor: pointer

.quick-note-btn.is-secondary
  background: rgba(36, 42, 54, 0.06)
  color: #5f6679

.quick-note-btn:disabled
  opacity: 0.6
  cursor: not-allowed

.quick-note-error
  margin: 0
  color: #b42318
  font-size: 0.85rem
</style>

