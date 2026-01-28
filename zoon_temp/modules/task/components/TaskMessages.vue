<script setup>
const props = defineProps({
  task: { type: Object, default: null },

  // v0：輸入中的回報內容
  composer: { type: String, default: "" },
});

const emit = defineEmits([
  "send",
  "update:composer",
]);

/**
 * Enter = 送出
 * Shift+Enter = 換行
 */
function handleKeydown(e) {
  if (e.isComposing) return;

  const isSubmit =
    e.key === "Enter" &&
    !e.shiftKey &&
    !e.altKey &&
    !e.metaKey &&
    !e.ctrlKey;

  if (isSubmit) {
    e.preventDefault();
    emit("send");
  }
}
</script>

<template lang="pug">
.pane.right
  // =====================
  // Header
  // =====================
  .head
    h4 任務紀錄
    span.mini(v-if="task") {{ `#${task.id}` }}

  // =====================
  // Event List
  // =====================
  .events(v-if="task")
    .event(
      v-for="(e, idx) in task.events"
      :key="idx"
      :class="e.type || 'note'"
    )
      .meta
        span.user {{ e.user || '系統' }}
        span.time {{ e.created_at }}

      p.text {{ e.text }}

  .empty(v-else)
    | 請先選擇任務

  // =====================
  // Composer
  // =====================
  .composer(v-if="task")
    textarea(
      rows="3"
      :value="composer"
      placeholder="新增進度說明（Enter 送出，Shift+Enter 換行）"
      @input="e => emit('update:composer', e.target.value)"
      @keydown="handleKeydown"
    )

    button.send(@click="emit('send')")
      | 新增紀錄
</template>

<style scoped lang="sass">
.head
  display: flex
  justify-content: space-between
  align-items: center

h4
  margin: 0
  color: #0f1b3d

.mini
  color: #6f7992
  font-size: 12px

.events
  flex: 1
  display: flex
  flex-direction: column
  gap: 10px
  overflow: auto
  padding-right: 4px

// =====================
// Event Item
// =====================
.event
  padding: 10px 12px
  border-radius: 12px
  background: #f7f9ff
  border: 1px solid #e5eaf8

// 系統事件（之後用）
.event.system
  background: #eef1f8
  color: #5f6c88

.meta
  display: flex
  justify-content: space-between
  color: #5f6c88
  font-size: 12px
  margin-bottom: 4px

.text
  margin: 0
  color: #1b2742
  line-height: 1.4

.empty
  flex: 1
  display: grid
  place-items: center
  color: #7a859e

// =====================
// Composer
// =====================
.composer
  display: flex
  gap: 8px
  margin-top: auto

textarea
  flex: 1
  border-radius: 12px
  border: 1px solid #d7dded
  padding: 10px 12px
  resize: none
  font-family: inherit

.send
  padding: 10px 14px
  border-radius: 12px
  border: none
  background: linear-gradient(135deg, #0f1b3d, #1c3f8c)
  color: #fff
  cursor: pointer
  font-weight: 700
</style>
