<!-- projects/project-a/modules/knowledge-base/pages/KnowledgeBasePage.vue -->
<script setup>
import LayoutRoot from '../../../layout/LayoutRoot.vue'

const title = 'Knowledge Base'
const subtitle = 'Content governance module'

const domainCards = [
  { label: '治理章節', value: '12', note: '結構章節已對齊' },
  { label: '待整理條目', value: '7', note: '待歸檔與命名校準' },
  { label: '最近更新', value: '2d', note: '維持低變動節奏' }
]

const reviewQueue = [
  { topic: '索引規範命名', owner: 'Editor-A', state: '審核中' },
  { topic: '術語對照表', owner: 'Editor-B', state: '待確認' },
  { topic: '模組責任邊界', owner: 'Editor-C', state: '已對齊' }
]
</script>

<template lang="pug">
LayoutRoot(:title="title" :subtitle="subtitle")
  section.pa-kb
    .pa-kb__hero
      p.pa-kb__lead 知識治理視圖
      p.pa-kb__desc 以可追蹤、可審核的方式維持知識一致性與結構穩定。
    .pa-kb__metrics
      article.pa-kb__metric(v-for="card in domainCards" :key="card.label")
        p.pa-kb__metric-label {{ card.label }}
        p.pa-kb__metric-value {{ card.value }}
        p.pa-kb__metric-note {{ card.note }}
    .pa-kb__panel
      h2.pa-kb__panel-title 內容校準佇列
      ul.pa-kb__list
        li.pa-kb__item(v-for="item in reviewQueue" :key="item.topic")
          span.pa-kb__topic {{ item.topic }}
          span.pa-kb__owner {{ item.owner }}
          span.pa-kb__state(:class="`pa-kb__state--${item.state}`") {{ item.state }}
</template>

<style lang="sass" scoped>
.pa-kb
  --pa-kb-bg: #f6f9ff
  --pa-kb-surface: #ffffff
  --pa-kb-surface-soft: #f1f5ff
  --pa-kb-border: #dfe7ff
  --pa-kb-border-soft: #e6edff
  --pa-kb-text-main: #1f2d4f
  --pa-kb-text-sub: #60719a
  --pa-kb-text-muted: #8a99bb
  --pa-kb-accent: #5f72ff
  display: grid
  gap: 16px
  padding: 18px
  border: 1px solid var(--pa-kb-border)
  border-radius: 14px
  background: var(--pa-kb-bg)

.pa-kb__hero
  display: grid
  gap: 6px
  padding-bottom: 10px
  border-bottom: 1px solid var(--pa-kb-border)

.pa-kb__lead
  margin: 0
  font-size: 11px
  letter-spacing: 0.08em
  text-transform: uppercase
  color: var(--pa-kb-accent)
  font-weight: 700

.pa-kb__desc
  margin: 0
  font-size: 14px
  line-height: 1.6
  color: var(--pa-kb-text-sub)

.pa-kb__metrics
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))
  gap: 12px

.pa-kb__metric
  padding: 14px
  border: 1px solid var(--pa-kb-border)
  border-radius: 12px
  background: var(--pa-kb-surface)
  transition: border-color 120ms ease, background-color 120ms ease

.pa-kb__metric:hover
  border-color: #c5d5ff
  background: var(--pa-kb-surface-soft)

.pa-kb__metric-label
  margin: 0
  font-size: 11px
  color: var(--pa-kb-text-muted)

.pa-kb__metric-value
  margin: 8px 0 4px
  font-size: 26px
  font-weight: 700
  color: var(--pa-kb-text-main)
  line-height: 1

.pa-kb__metric-note
  margin: 0
  font-size: 12px
  color: var(--pa-kb-text-sub)

.pa-kb__panel
  padding: 14px
  border: 1px solid var(--pa-kb-border)
  border-radius: 12px
  background: var(--pa-kb-surface)

.pa-kb__panel-title
  margin: 0 0 12px
  font-size: 13px
  letter-spacing: 0.02em
  color: var(--pa-kb-text-main)

.pa-kb__list
  list-style: none
  margin: 0
  padding: 0
  display: grid
  gap: 8px

.pa-kb__item
  display: grid
  grid-template-columns: 2fr 1fr 1fr
  gap: 10px
  font-size: 13px
  align-items: center
  padding: 10px 12px
  border: 1px solid var(--pa-kb-border-soft)
  border-radius: 8px
  background: #fafcff
  transition: border-color 120ms ease, background-color 120ms ease

.pa-kb__item:hover
  border-color: #ccd9ff
  background: #f3f7ff

.pa-kb__topic
  color: var(--pa-kb-text-main)
  font-weight: 600

.pa-kb__owner
  color: var(--pa-kb-text-sub)
  font-size: 12px

.pa-kb__state
  justify-self: end
  display: inline-flex
  align-items: center
  justify-content: center
  min-width: 64px
  padding: 4px 8px
  border-radius: 999px
  font-size: 11px
  border: 1px solid #d0dcff
  color: var(--pa-kb-text-sub)
  background: #f2f6ff

.pa-kb__state--審核中
  border-color: #c9d6ff
  color: #5065ff
  background: #edf1ff

.pa-kb__state--待確認
  border-color: #ddd7ff
  color: #7364c5
  background: #f5f2ff

.pa-kb__state--已對齊
  border-color: #cbe6da
  color: #2d8a6e
  background: #effaf5
</style>
