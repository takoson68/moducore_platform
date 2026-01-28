<script setup>
</script>

<template lang="pug">
.temp-info
  h2 模組範例次頁
  p 這是 moduleTemp 的第二個頁面，用來示範多分頁配置。
  ul
    li 調整 routes.js 新增路由即可
    li 可放置更進階的範例或設定說明
    li 返回上一頁可使用瀏覽器返回或導覽列
</template>

<style scoped lang="sass">
@use '/src/styles/sass/vars' as *

.temp-info
  padding: 20px
  background: $sys_1
  border-radius: 14px
  border: 1px solid $borderColor
  box-shadow: 0 12px 24px rgba(16,40,89,0.08)
  display: flex
  flex-direction: column
  gap: 10px

ul
  padding-left: 18px
  margin: 0

li
  margin: 4px 0
</style>
