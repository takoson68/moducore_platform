<script setup>
import { computed, onMounted, ref } from 'vue'
import { useIdentity } from '@project/composables/useIdentity.js'
import { useTasks } from '../composables/useTasks.js'

const newTitle = ref('')
const formError = ref('')
const { isLoggedIn, identity, ensureHydrated } = useIdentity()
const {
  activeTasks,
  doneTasks,
  total,
  done,
  active,
  loading,
  error,
  loaded,
  load,
  addTask,
  toggleTask,
  removeTask,
  clearDoneTasks
} = useTasks()

const mergedError = computed(() => formError.value || error.value)

onMounted(async () => {
  await Promise.allSettled([ensureHydrated(), load()])
})

async function handleAdd() {
  formError.value = ''
  try {
    await addTask({ title: newTitle.value })
    newTitle.value = ''
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '新增 Task 失敗'
  }
}

async function handleToggle(id) {
  formError.value = ''
  try {
    await toggleTask(id)
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '切換 Task 失敗'
  }
}

async function handleRemove(id) {
  formError.value = ''
  try {
    await removeTask(id)
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '刪除 Task 失敗'
  }
}

async function handleClearDone() {
  formError.value = ''
  try {
    await clearDoneTasks()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '清空已完成失敗'
  }
}
</script>

<template lang="pug">
.tasks-home
  section.hero-board
    .hero-main.panel
      .hero-head
        div
          h2.panel-title 我的任務
          p.panel-desc(v-if="isLoggedIn && identity") {{ identity.displayName }}，今天先完成 1 件最重要的事。
          p.panel-desc(v-else) 未登入也可使用，任務仍會保留在本機。
        span.login-hint 使用右上固定登入元件
      .composer
        input.input(
          v-model="newTitle"
          type="text"
          placeholder="新增一個今天要完成的任務..."
          :disabled="loading"
          @keydown.enter.prevent="handleAdd"
        )
        button.btn(type="button" :disabled="loading" @click="handleAdd") 新增
      p.error(v-if="mergedError") {{ mergedError }}

    section.panel.stats-panel
      .stats-head
        h3.section-title 任務統計
        button.btn.btn-secondary(
          type="button"
          :disabled="loading || done === 0"
          @click="handleClearDone"
        ) 清空已完成
      ul.stats
        li.stat-item
          span.label total
          strong.value {{ total }}
        li.stat-item
          span.label active
          strong.value {{ active }}
        li.stat-item
          span.label done
          strong.value {{ done }}

  .dashboard-grid
    section.panel.list-panel
      .panel-bar
        h3.section-title 未完成
        span.panel-badge {{ activeTasks.length }}
      p.empty(v-if="loaded && activeTasks.length === 0") 目前沒有未完成任務。
      ul.task-list(v-else)
        li.task-item(v-for="task in activeTasks" :key="task.id")
          label.checkbox-wrap
            input(
              type="checkbox"
              :checked="task.done"
              :disabled="loading"
              @change="handleToggle(task.id)"
            )
            span.task-title {{ task.title }}
          button.icon-btn(type="button" :disabled="loading" @click="handleRemove(task.id)") 刪除

    section.panel.list-panel
      .panel-bar
        h3.section-title 已完成
        span.panel-badge.is-soft {{ doneTasks.length }}
      p.empty(v-if="loaded && doneTasks.length === 0") 目前沒有已完成任務。
      ul.task-list(v-else)
        li.task-item.is-done(v-for="task in doneTasks" :key="task.id")
          label.checkbox-wrap
            input(
              type="checkbox"
              :checked="task.done"
              :disabled="loading"
              @change="handleToggle(task.id)"
            )
            span.task-title {{ task.title }}
          button.icon-btn(type="button" :disabled="loading" @click="handleRemove(task.id)") 刪除

    section.panel.mini-panel
      h3.section-title 使用說明
      p.note-line 新增／勾選／刪除／清空已完成都會即時寫入 local-first storage。
      p.note-line 重新整理頁面後，Tasks 與 Identity（未登出時）都會保留。
      p.note-line 本階段不依賴後端 API，僅透過 `world.services.storage()`。
</template>

<style lang="sass">
.tasks-home
  --space-1: 0.5rem
  --space-2: 0.75rem
  --space-3: 1rem
  --space-4: 1.25rem
  --space-5: 1.5rem
  --radius-1: 0.9rem
  --radius-2: 1rem
  --border-color: rgba(36, 42, 54, 0.08)
  display: grid
  gap: var(--space-3)
  max-width: 100%
  margin: 0 auto

.panel
  background: rgba(255, 255, 255, 0.76)
  border: 1px solid var(--border-color)
  border-radius: var(--radius-2)
  padding: var(--space-4)
  display: grid
  gap: var(--space-2)
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75)

.hero-board
  display: grid
  grid-template-columns: 1.25fr 0.75fr
  gap: var(--space-3)

.hero-main
  align-content: start

.stats-panel
  align-content: start

.dashboard-grid
  display: grid
  grid-template-columns: 1.1fr 1fr 0.8fr
  gap: var(--space-3)
  min-height: 0

.list-panel
  min-height: 20rem
  align-content: start

.mini-panel
  align-content: start
  gap: 0.65rem

.hero-head
  display: flex
  justify-content: space-between
  align-items: flex-start
  gap: var(--space-3)

.panel-title, .section-title
  margin: 0
  color: #242938

.panel-desc
  margin: 0.25rem 0 0
  color: #6c7387

.login-hint
  color: #6f5d98
  background: rgba(183, 155, 213, 0.14)
  border-radius: 999px
  padding: 0.45rem 0.75rem
  font-size: 0.85rem

.composer
  display: grid
  grid-template-columns: minmax(0, 1fr) auto
  gap: var(--space-2)

.input
  width: 100%
  border: 1px solid rgba(36, 42, 54, 0.09)
  background: rgba(255, 255, 255, 0.8)
  border-radius: 0.9rem
  padding: 0.8rem 0.9rem
  font: inherit

.btn
  border: 0
  background: linear-gradient(135deg, #c7b4e2, #b59bda)
  color: #fff
  border-radius: 999px
  padding: 0.55rem 0.95rem
  cursor: pointer
  box-shadow: 0 8px 18px rgba(181, 155, 218, 0.24)

.btn:disabled, .icon-btn:disabled
  opacity: 0.6
  cursor: not-allowed

.btn-secondary
  background: rgba(255, 255, 255, 0.85)
  color: #283044
  border: 1px solid var(--border-color)
  box-shadow: none

.error
  margin: 0
  color: #b42318

.stats-head
  display: flex
  justify-content: space-between
  align-items: center
  gap: var(--space-2)

.stats
  list-style: none
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: var(--space-2)
  margin: 0
  padding: 0

.stat-item
  border: 1px solid rgba(36, 42, 54, 0.06)
  background: rgba(255, 255, 255, 0.78)
  border-radius: 0.9rem
  padding: 0.85rem
  display: grid
  gap: 0.25rem

.label
  color: #7c8498
  text-transform: uppercase
  font-size: 0.75rem

.value
  font-size: 1.2rem
  color: #2a3040

.panel-bar
  display: flex
  justify-content: space-between
  align-items: center
  gap: var(--space-2)

.panel-badge
  min-width: 1.75rem
  height: 1.75rem
  border-radius: 999px
  display: grid
  place-items: center
  padding: 0 0.45rem
  font-size: 0.8rem
  color: #5e4f7f
  background: rgba(183, 155, 213, 0.18)

.panel-badge.is-soft
  background: rgba(183, 155, 213, 0.1)
  color: #7a7090

.empty
  margin: 0
  color: #7a8193

.task-list
  list-style: none
  margin: 0
  padding: 0
  display: grid
  gap: var(--space-2)

.task-item
  display: flex
  justify-content: space-between
  align-items: center
  gap: var(--space-2)
  border: 1px solid rgba(36, 42, 54, 0.05)
  background: rgba(255, 255, 255, 0.76)
  border-radius: 0.85rem
  padding: 0.7rem 0.8rem

.task-item.is-done .task-title
  text-decoration: line-through
  color: #81889a

.checkbox-wrap
  display: flex
  align-items: center
  gap: var(--space-2)
  min-width: 0

.task-title
  overflow-wrap: anywhere
  color: #2e3546

.icon-btn
  border: 1px solid rgba(36, 42, 54, 0.08)
  background: rgba(255, 255, 255, 0.82)
  color: #394055
  border-radius: 999px
  padding: 0.375rem 0.625rem
  cursor: pointer

.note-line
  margin: 0
  color: #70788c
  line-height: 1.5

@media (max-width: 1100px)
  .hero-board
    grid-template-columns: 1fr

  .dashboard-grid
    grid-template-columns: 1fr

@media (max-width: 640px)
  .hero-head
    flex-direction: column

  .composer
    grid-template-columns: 1fr

  .stats
    grid-template-columns: 1fr

  .task-item
    align-items: flex-start
    flex-direction: column
</style>
