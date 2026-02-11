<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, watch } from "vue";
import world from '@/world.js'
import { notificationService } from "../services/notificationService.js";

const emit = defineEmits(["close"]);
const props = defineProps({
  anchorRect: { type: Object, default: null },
});
const notificationStore = world.store("notificationStore");

const list = computed(() => notificationStore.state.list);

const pos = reactive({ left: 64, top: 120 });
const POPUP_WIDTH = 300;
const POPUP_HEIGHT = 360;
const EDGE = 8;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setPosition(rect) {
  if (!rect) return;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxLeft = Math.max(EDGE, viewportWidth - POPUP_WIDTH - EDGE);
  const maxTop = Math.max(EDGE, viewportHeight - POPUP_HEIGHT - EDGE);
  const left = clamp(rect.right - POPUP_WIDTH, EDGE, maxLeft);
  const preferredBelow = rect.bottom + 8;
  const preferredAbove = rect.top - POPUP_HEIGHT - 8;
  const fitsBelow = preferredBelow + POPUP_HEIGHT + EDGE <= viewportHeight;
  const top = fitsBelow ? preferredBelow : preferredAbove;
  pos.left = left;
  pos.top = clamp(top, EDGE, maxTop);
}

async function markRead(id) {
  if (!id) return;
  try {
    await notificationService.markRead(id);
  } catch (err) {
    console.error("[notification] mark read failed", err);
  }
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function onResize() {
  setPosition(props.anchorRect);
}

watch(
  () => props.anchorRect,
  (rect) => {
    setPosition(rect);
  },
  { immediate: true }
);

onMounted(() => {
  setPosition(props.anchorRect);
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onResize, true);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  window.removeEventListener("scroll", onResize, true);
});
</script>

<template lang="pug">
.popup(:style="{ left: `${pos.left}px`, top: `${pos.top}px` }")
  header.head
    span.title 通知
    button.close(@click="emit('close')") 關閉
  .list
    template(v-if="list.length")
      .item(v-for="n in list" :key="n.id" :class="{ unread: !n.read }" @click="markRead(n.id)")
        .icon
          span(v-if="n.type === 'task'") 任
          span(v-else-if="n.type === 'member'") 員
          span(v-else-if="n.type === 'booking'") 預
          span(v-else-if="n.type === 'ads'") 廣
          span(v-else) 系
        .info
          p.title {{ n.title }}
          p.content {{ n.content }}
          p.time {{ formatTime(n.created_at) }}
    .empty(v-else) 尚無通知
</template>

<style scoped lang="sass">
.popup
  position: fixed
  width: 300px
  height: 360px
  border-radius: 14px
  background: #fff
  box-shadow: 0 16px 32px rgba(15,27,61,0.25)
  border: 1px solid #e4e8f2
  display: flex
  flex-direction: column
  overflow: hidden
  z-index: 51
  left: 0
  font-size: 14px
  line-height: 1.4
.head
  display: flex
  justify-content: space-between
  align-items: center
  padding: 10px 12px
  background: linear-gradient(135deg, #0f1b3d, #1c3f8c)
  border-bottom: 1px solid #10274f
  color: #fff
  cursor: grab
  user-select: none

.head:active
  cursor: grabbing

.title
  font-weight: 700
  color: #fff
  font-size: 16px

.close
  border: none
  background: transparent
  font-size: 16px
  cursor: pointer
  color: #fff

.list
  flex: 1
  overflow: auto
  display: flex
  flex-direction: column
  gap: 8px
  padding: 10px

.item
  display: grid
  grid-template-columns: auto 1fr
  gap: 8px
  padding: 8px 10px
  border-radius: 10px
  border: 1px solid #e4e8f2
  cursor: pointer
  transition: 0.12s ease

.item.unread
  background: #eef4ff
  border-color: #d6e4ff

.item:hover
  box-shadow: 0 10px 18px rgba(15,27,61,0.08)

.icon
  width: 32px
  height: 32px
  border-radius: 10px
  background: #f0f3fa
  display: grid
  place-items: center
  font-size: 16px

.info .title
  margin: 0
  font-weight: 700
  color: #0f1b3d
  font-size: 14px

.info .content
  margin: 2px 0
  color: #5f6c88
  font-size: 13px
  padding: 0em



.info .time
  margin: 0
  color: #8a94aa
  font-size: 12px

.empty
  flex: 1
  display: grid
  place-items: center
  color: #7a859e
</style>
