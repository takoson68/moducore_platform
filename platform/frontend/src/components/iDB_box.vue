<script setup>
import { ref, useId } from 'vue'

defineProps({
  state: { type: Object, required: true },
  restoreDisabled: { type: Boolean, default: false },
  restoreDisabledReason: { type: String, default: '目前無法還原備份。' }
})

const emit = defineEmits(['upload', 'list', 'restore', 'close'])
const dialog = ref(null)
const showingList = ref(false)
const titleId = useId()
const dateFormat = new Intl.DateTimeFormat('zh-TW', { dateStyle: 'short', timeStyle: 'medium' })

function openList() {
  showingList.value = true
  emit('list')
}

function onClose() {
  showingList.value = false
  emit('close')
}
</script>

<template lang="pug">
button(type="button" aria-haspopup="dialog" :disabled="state.busy" @click="dialog?.showModal()") IndexedDB 備份
Teleport(to="body")
  dialog.idb-box(ref="dialog" :aria-labelledby="titleId" @close="onClose" @cancel="state.busy && $event.preventDefault()")
    header.idb-box__header
      h2(:id="titleId") {{ showingList ? '選擇備份檔案' : 'IndexedDB 備份' }}
      button.idb-box__close(type="button" :disabled="state.busy" @click="dialog?.close()") 關閉
    .idb-box__actions(v-if="!showingList")
      button.idb-box__option(type="button" :disabled="state.busy" @click="emit('upload')") 上傳 IndexedDB 備份
      button.idb-box__option(type="button" :disabled="state.busy" @click="openList") 下載備份檔案
    template(v-else)
      p(v-if="restoreDisabled") {{ restoreDisabledReason }}
      p(v-if="state.backups?.length === 0") 目前沒有備份檔案。
      ul.idb-box__list(v-if="state.backups?.length")
        li(v-for="entry in state.backups" :key="entry.id")
          button.idb-box__option(type="button" :disabled="state.busy || restoreDisabled" @click="emit('restore', entry)")
            | 還原 {{ dateFormat.format(new Date(entry.savedAt)) }}（{{ Math.ceil(entry.size / 1024) }} KB）
            | {{ entry.uploader ? ' · ' + entry.uploader : '' }}
      button.idb-box__close(type="button" :disabled="state.busy" @click="showingList = false") 返回選項
    p(v-if="state.busy" role="status") 備份處理中…
    p(v-if="state.error" role="alert") {{ state.error }}
    p(v-if="state.status" role="status") {{ state.status }}
</template>

<style lang="sass">
.idb-box
  box-sizing: border-box
  inline-size: min(28rem, calc(100% - 2rem))
  max-block-size: calc(100% - 2rem)
  margin: auto
  padding: 1.25rem
  border: 1px solid #dbe8e3
  border-radius: .75rem
  background: #fff
  color: #203b32

  &::backdrop
    background: rgb(13 34 27 / 52%)

  .idb-box__header
    display: flex
    justify-content: space-between
    align-items: center
    gap: 1rem
    margin-block-end: 1rem

  h2
    margin: 0
    font-size: 1.125rem

  .idb-box__actions, .idb-box__list
    display: grid
    gap: .5rem

  .idb-box__list
    max-block-size: 14rem
    overflow-y: auto
    padding: 0
    list-style: none

  .idb-box__option, .idb-box__close
    padding: .625rem .75rem
    border: 0
    border-radius: .375rem
    background: #eef8f4
    color: #116953
    font: inherit
    cursor: pointer

    &:disabled
      opacity: .6
      cursor: default

  .idb-box__option
    inline-size: 100%
    text-align: start
    overflow-wrap: anywhere
</style>
