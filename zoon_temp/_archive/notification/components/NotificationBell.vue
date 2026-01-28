<script setup>
import { computed, ref } from 'vue'
import { container } from '@/container/container.js'
import NotificationPopup from './NotificationPopup.vue'

const props = defineProps({
  placement: { type: String, default: 'fixed' } // fixed | sidebar
})

const notificationStore = container.resolve('notificationStore')
const open = ref(false)

const unread = computed(() => notificationStore.state.unread)

function toggle() {
  open.value = !open.value
}
</script>

<template lang="pug">
.bell-wrap(:class="placement")
  button.bell(type="button" @click="toggle")
    img.icon(src="/assets/icons/bell.svg")
    span.badge(v-if="unread > 0") {{ unread }}
  NotificationPopup(v-if="open" @close="toggle")
</template>

<style scoped lang="sass">
.bell-wrap
  position: relative
  z-index: 50
  height: 6em
  z-index: 2000
.bell-wrap.fixed
  // position: fixed
  // left: 24px
  // bottom: 24px

.bell-wrap.sidebar-bell
  margin-top: auto
  padding: 12px 0
  display: flex
  justify-content: center
  align-items: center
.bell
  width: 56px
  height: 56px
  border-radius: 50%
  border: none
  background: linear-gradient(135deg, #0f1b3d, #1c3f8c)
  color: #fff
  display: grid
  place-items: center
  font-size: 24px
  box-shadow: 0 12px 26px rgba(12,27,61,0.3)
  cursor: pointer
  position: relative

.badge
  position: absolute
  top: -6px
  right: -3px
  min-width: 24px
  height: 24px
  // padding: 0 6px
  border-radius: 999px
  background: #f76b8a
  color: #fff
  font-size: 12px
  display: grid
  place-items: center

.icon
  transform: translateY(-1px)
</style>
