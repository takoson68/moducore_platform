<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template lang="pug">
.mobile-page
  section.scope-card
    p.eyebrow 入口狀態
    h2 桌號暫不可用
    p.lead 此入口預留給桌號停用、非營業中或暫停接單的狀態提示。
    p.meta-code(v-if="route.params.tableCode") 桌號：{{ route.params.tableCode }}
</template>

<style lang="sass">
.mobile-page
  display: grid

.scope-card
  padding: 18px
  border-radius: 20px
  background: rgba(255, 255, 255, 0.84)
  border: 1px solid rgba(140, 90, 31, 0.12)

.eyebrow
  margin: 0 0 8px
  color: #8c5a1f
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase

.scope-card h2
  margin: 0 0 10px

.lead, .meta-code
  margin: 0
  color: #6f5b43
  line-height: 1.6
</style>
