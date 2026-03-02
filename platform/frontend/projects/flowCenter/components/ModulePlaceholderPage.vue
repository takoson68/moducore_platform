<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: 'flowCenter Phase 1'
  },
  title: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  bullets: {
    type: Array,
    default: () => []
  }
})
</script>

<template lang="pug">
.placeholder
  .hero.flow-glass
    p.eyebrow {{ eyebrow }}
    h2.title {{ title }}
    p.summary {{ summary }}
  .grid
    .card.flow-glass
      h3 模組定位
      p 此頁目前只驗證 route 掛載、layout 渲染與模組註冊是否正常。
    .card.flow-glass
      h3 下一步範圍
      ul
        li(v-for="item in bullets" :key="item") {{ item }}
</template>

<style lang="sass">
.placeholder
  display: grid
  gap: 18px

.hero
  border-radius: 24px
  padding: 28px

.eyebrow
  margin: 0 0 8px
  font-size: 12px
  text-transform: uppercase
  letter-spacing: 0.08em
  color: rgba(90, 79, 116, 0.58)

.title
  margin: 0 0 10px
  font-size: 30px
  color: #241b31

.summary
  margin: 0
  max-width: 60ch
  color: rgba(63, 54, 79, 0.72)

.grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 18px

.card
  border-radius: 22px
  padding: 22px

.card h3
  margin: 0 0 10px

.card p, .card ul
  margin: 0
  color: rgba(63, 54, 79, 0.72)

.card ul
  padding-left: 18px
  display: grid
  gap: 8px

@media (max-width: 960px)
  .grid
    grid-template-columns: 1fr
</style>
