<script setup>
import { computed, ref } from 'vue'
import world from '@/world.js'

const props = defineProps({
  module: { type: String, required: true },
  categories: { type: Array, required: true },
  upload: { type: Function, required: true },
  disabled: { type: Boolean, default: false }
})

const busy = ref(false)
const message = ref('')
const error = ref('')

// 讓自訂按鈕和連結共用觸發方式，避免連結在備份時跳頁。
async function open(event) {
  event?.preventDefault()
  if (props.disabled || busy.value) return
  busy.value = true
  message.value = ''
  error.value = ''

  try {
    const result = await world.iDB.upload({
      module: props.module,
      categories: props.categories,
      upload: props.upload
    })
    switch (result.status) {
      case 'busy':
        message.value = '已有備份操作進行中。'
        break
      case 'uploaded':
        message.value = '備份已上傳。'
        break
      case 'uploaded-and-cleaned':
        message.value = `備份已上傳，已清除 ${result.cleared} 筆本機資料。`
        break
      case 'uploaded-cleanup-failed':
        error.value = '備份已上傳，但本機資料清除失敗。'
        break
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '備份上傳失敗。'
  } finally {
    busy.value = false
  }
}

const trigger = computed(() => ({
  onClick: open,
  'aria-disabled': props.disabled || busy.value
}))
</script>

<template lang="pug">
slot(:trigger="trigger" :busy="busy")
  button(type="button" v-bind="trigger" :disabled="disabled || busy") {{ busy ? '備份處理中…' : '上傳備份' }}
span(v-if="message" role="status") {{ message }}
span(v-if="error" role="alert") {{ error }}
</template>
