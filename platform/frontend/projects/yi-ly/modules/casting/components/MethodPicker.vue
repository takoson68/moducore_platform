<script setup>
const props = defineProps({
  activeMethod: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['select-method'])

const methods = [
  {
    id: 'coin',
    name: '金錢卦',
  },
  {
    id: 'meihua',
    name: '梅花易數',
  },
]

function selectMethod(methodId) {
  emit('select-method', methodId)
}
</script>

<template lang="pug">
section.yi-method-picker(aria-label="卜算方式建議")
  .yi-method-picker__heading
    h2 選擇卜算方式
    p 依你想探問的方向，挑選合適的起卦方法。
  .yi-method-picker__options(role="tablist" aria-label="選擇卜卦方法")
    button(v-for="method in methods" :key="method.id" type="button" role="tab" :aria-selected="props.activeMethod === method.id" :class="{ 'is-active': props.activeMethod === method.id }" @click="selectMethod(method.id)")
      strong {{ method.name }}
</template>

<style lang="sass" scoped>
@use '../../../styles/sass/variables' as *

.yi-method-picker
  display: flex
  flex-direction: column
  gap: $space-3

  &__heading
    display: flex
    flex-direction: column
    gap: $space-1

    h2, p
      margin: 0

    h2
      font-size: $font-size-md

    p
      color: $ink-secondary
      font-size: $font-size-xs

  &__options
    display: grid
    grid-template-columns: repeat(2, minmax(0, 1fr))
    gap: $space-3

    button
      display: flex
      min-width: 0
      min-height: 48px
      flex-direction: column
      align-items: center
      justify-content: center
      padding: $space-3 $space-4
      border: $border-thin
      border-radius: 999px
      background: transparent
      color: $ink-primary
      text-align: center
      cursor: pointer

      &.is-active
        border-color: $vermilion
        background: $vermilion
        color: $bg-card

      &:focus-visible
        outline: 2px solid $vermilion
        outline-offset: 2px

      strong
        font-size: $font-size-base
</style>
