<script setup>
import { computed, ref, nextTick } from "vue";
import { container } from "@/app/container";
import NotificationPopup from "./NotificationPopup.vue";

const props = defineProps({
  placement: { type: String, default: "fixed" }, // fixed | sidebar
});

const notificationStore = container.resolve("notificationStore");
const authStore = container.resolve("auth");
const open = ref(false);
const buttonRef = ref(null);
const anchorRect = ref(null);

const unread = computed(() => notificationStore.state.unread);
const isAuth = computed(() => authStore.isLoggedIn());

function toggle() {
  open.value = !open.value;
  if (open.value) {
    nextTick(() => {
      anchorRect.value = buttonRef.value?.getBoundingClientRect() || null;
    });
  }
}
</script>

<template lang="pug">
.bell-wrap(:class="placement")
  button.bell(
    type="button"
    @click="toggle"
    ref="buttonRef"
    :disabled="!isAuth"
    :class="{ disabled: !isAuth }"
  )
    img.icon(src="/assets/icons/bell.svg")
    span.badge(v-if="unread > 0") {{ unread }}
  NotificationPopup(v-if="open" :anchor-rect="anchorRect" @close="toggle")
</template>

<style scoped lang="sass">
.bell-wrap
  position: relative
  z-index: 50
  // height: 6em
  z-index: 2000
  margin-right: 1em
  
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
  width: 40px
  height: 40px
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
  transform: scale(.75)

.bell.disabled
  cursor: not-allowed
  opacity: 0.6

.badge
  position: absolute
  top: -3px
  right: -.85rem
  min-width: 20px
  height: 20px
  // padding: 0 6px
  border-radius: 999px
  background: #f76b8a
  color: #fff
  font-size: 12px
  display: grid
  place-items: center

.icon
  transform: translateY(-1px)
  width: 70%
</style>
