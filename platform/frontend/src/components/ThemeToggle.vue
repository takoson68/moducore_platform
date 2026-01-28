<script setup>
import { computed, onMounted } from 'vue'
import { container } from '@/app/container'

const uiShellStore = container.resolve('uiShell')
const isDark = computed(() => uiShellStore.state.theme === 'dark')

function onToggle() {
  uiShellStore.toggleTheme()
}

onMounted(() => {
  uiShellStore.syncTheme()
})
</script>

<template lang="pug">
button(@click="onToggle") {{ isDark ? '亮色模式' : '深色模式' }}
</template>

<style lang="sass" scoped>
button
  padding: 0.5em 1.1em
  background-color: var(--sys-4, #9333ea)
  color: #fff
  border: none
  border-radius: 6px
  cursor: pointer
  font-weight: 600
  transition: transform 0.2s ease, box-shadow 0.2s ease
  margin: 0 .5em

  &:hover
    transform: translateY(-1px)
    box-shadow: 0 10px 24px rgba(37,99,235,0.28)

  &:active
    transform: translateY(1px)
</style>
