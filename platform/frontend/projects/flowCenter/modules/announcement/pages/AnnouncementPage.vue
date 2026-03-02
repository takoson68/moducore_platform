<script setup>
import { computed, onMounted, watch } from 'vue'
import world from '@/world.js'
import { useFlowCenterAuth } from '@project/services/flowCenterAuthService.js'

const auth = useFlowCenterAuth()
const announcementStore = world.store('flowCenterAnnouncementStore')
const state = announcementStore.state
const form = state.form

const selectedId = computed({
  get: () => state.selectedId,
  set: (value) => announcementStore.selectRecord(value)
})

const summary = computed(() => {
  const total = state.records.length
  const published = state.records.filter((item) => item.published_at).length
  const drafts = state.records.filter((item) => !item.published_at).length
  return { total, published, drafts }
})

const selectedRecord = computed(() =>
  state.records.find((item) => item.id === selectedId.value) || state.records[0] || null
)

const isEditing = computed(() => Boolean(state.editingId))

function loadAnnouncements() {
  return announcementStore.load()
}

function submitAnnouncement() {
  return announcementStore.submit()
}

function deleteAnnouncement() {
  return announcementStore.removeSelected()
}

function resetForm() {
  return announcementStore.clearForm()
}

onMounted(loadAnnouncements)
watch(() => auth.isLoggedIn.value, loadAnnouncements)
</script>

<template lang="pug">
.announcement-page
  .hero.flow-glass
    .hero-copy
      p.eyebrow Announcement Module
      h2 公告管理
      p.summary-text 公告清單與明細已接上後端。所有登入角色都可查看，但建立與刪除公告只允許 manager。
    .hero-note
      span.note-label 權限
      strong.note-value {{ auth.role.value || 'guest' }}
  .panel.flow-glass(v-if="!auth.isLoggedIn.value")
    .panel-head
      h3 尚未登入
      span.panel-meta login required
    p.form-note 請先登入才能查看公告內容。
  template(v-else)
    .summary-grid
      article.summary-card.flow-glass
        p.card-label 全部公告
        p.card-value {{ summary.total }}
      article.summary-card.flow-glass
        p.card-label 已發布
        p.card-value {{ summary.published }}
      article.summary-card.flow-glass
        p.card-label 草稿
        p.card-value {{ summary.drafts }}
    .content-grid
      section.panel.flow-glass
        .panel-head
          h3 {{ isEditing ? '編輯公告' : '新增公告' }}
          span.panel-meta manager only
        .form-grid
          label.field.is-wide
            span.label 標題
            input(type="text" v-model="form.title" :disabled="auth.role.value !== 'manager'")
          label.field.is-wide
            span.label 內容
            textarea(rows="5" v-model="form.content" :disabled="auth.role.value !== 'manager'")
          label.field
            span.label 發布狀態
            select(v-model="form.publishNow" :disabled="auth.role.value !== 'manager'")
              option(:value="true") 立即發布
              option(:value="false") 存為草稿
        p.form-note(v-if="state.error") {{ state.error }}
        .form-actions
          button.action-button(
            type="button"
            @click="submitAnnouncement"
            :disabled="auth.role.value !== 'manager' || state.saving"
          ) {{ isEditing ? '更新公告' : '建立公告' }}
          button.action-button.secondary(
            type="button"
            @click="resetForm"
            :disabled="auth.role.value !== 'manager' || state.saving"
          ) 切換為新增
          button.action-button.secondary(
            type="button"
            @click="deleteAnnouncement"
            :disabled="auth.role.value !== 'manager' || !selectedRecord || state.saving"
          ) 刪除選取公告
      section.panel.flow-glass
        .panel-head
          h3 公告清單
          span.panel-meta {{ state.loading ? 'loading' : 'list' }}
        p.form-note(v-if="!state.records.length") 目前沒有公告資料。
        .record-list(v-else)
          button.record-row(
            v-for="record in state.records"
            :key="record.id"
            type="button"
            :class="{ 'is-active': selectedId === record.id }"
            @click="selectedId = record.id"
          )
            .record-main
              strong {{ record.title }}
              span {{ record.published_at || '草稿' }}
            .record-side
              span.status-chip(:class="record.published_at ? 'is-published' : 'is-draft'") {{ record.published_at ? '已發布' : '草稿' }}
              span.code {{ `#${record.id}` }}
    section.detail-panel.flow-glass(v-if="selectedRecord")
      .panel-head
        h3 公告內容
        span.panel-meta {{ `#${selectedRecord.id}` }}
      .detail-grid
        .detail-item
          span.detail-label 標題
          strong {{ selectedRecord.title }}
        .detail-item
          span.detail-label 狀態
          strong {{ selectedRecord.published_at ? '已發布' : '草稿' }}
        .detail-item
          span.detail-label 建立時間
          strong {{ selectedRecord.created_at }}
        .detail-item
          span.detail-label 發布時間
          strong {{ selectedRecord.published_at || '尚未發布' }}
      .detail-content
        span.detail-label 內容
        p {{ selectedRecord.content }}
</template>

<style lang="sass">
.announcement-page
  display: grid
  gap: 20px

.hero, .panel, .detail-panel
  border-radius: 26px
  padding: 22px

.hero
  display: flex
  justify-content: space-between
  gap: 20px

.hero-copy
  max-width: 64ch

.eyebrow
  margin: 0 0 8px
  font-size: 12px
  letter-spacing: 0.08em
  text-transform: uppercase
  color: rgba(90, 79, 116, 0.58)

.hero-copy h2
  margin: 0 0 10px
  font-size: 32px

.summary-text
  margin: 0
  color: rgba(63, 54, 79, 0.72)
  line-height: 1.7

.hero-note
  min-width: 140px
  padding: 18px
  border-radius: 24px
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 244, 229, 0.98))
  display: grid
  gap: 8px

.summary-grid
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 18px

.summary-card
  border-radius: 24px
  padding: 20px
  display: grid
  gap: 8px

.content-grid
  display: grid
  grid-template-columns: 1.1fr 1fr
  gap: 20px

.panel-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  margin-bottom: 16px

.form-grid, .detail-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 14px

.field, .detail-item
  display: grid
  gap: 8px

.field.is-wide
  grid-column: 1 / -1

.field input, .field select, .field textarea
  width: 100%
  border: 0
  border-radius: 16px
  padding: 14px 16px
  background: rgba(255, 255, 255, 0.72)

.form-actions
  margin-top: 18px
  display: flex
  gap: 12px

.action-button
  border: 0
  border-radius: 999px
  padding: 12px 18px
  background: linear-gradient(135deg, #ffae63 0%, #ff7f7d 100%)
  color: #fff
  font-weight: 700
  cursor: pointer

.action-button.secondary
  background: rgba(255, 255, 255, 0.84)
  color: #241b31

.form-note
  margin: 0
  color: rgba(63, 54, 79, 0.66)

.record-list
  display: grid
  gap: 12px

.record-row
  border: 0
  width: 100%
  text-align: left
  border-radius: 18px
  padding: 16px
  background: rgba(255, 255, 255, 0.62)
  display: flex
  align-items: center
  justify-content: space-between
  gap: 16px
  cursor: pointer

.record-row.is-active
  box-shadow: inset 0 0 0 1px rgba(255, 173, 95, 0.35)
  background: rgba(255, 255, 255, 0.88)

.record-main
  display: grid
  gap: 6px

.record-side
  display: grid
  justify-items: end
  gap: 8px

.status-chip
  padding: 6px 10px
  border-radius: 999px
  font-size: 12px
  font-weight: 700

.status-chip.is-published
  background: rgba(209, 250, 229, 0.8)
  color: #166534

.status-chip.is-draft
  background: rgba(226, 232, 240, 0.8)
  color: #475569

.detail-item, .detail-content
  padding: 14px 16px
  border-radius: 18px
  background: rgba(255, 255, 255, 0.62)

.detail-content p
  margin: 10px 0 0

@media (max-width: 960px)
  .hero, .content-grid, .summary-grid, .form-grid, .detail-grid
    grid-template-columns: 1fr
</style>
