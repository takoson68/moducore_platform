<script setup>
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import world from '@/world.js'

const menuAdminStore = world.store('dineCoreMenuAdminStore')
const state = computed(() => menuAdminStore.state)

const createPanelOpen = ref(false)
const createPreviewUrl = ref('')
const createForm = reactive({
  title: '',
  categoryId: '',
  price: '0',
  description: '',
  imageUrl: ''
})

const categoryCreateName = ref('')
const categoryDraftNames = reactive({})
const draftCategoryIds = reactive({})
const draftPrices = reactive({})
const draftImages = reactive({})
const optionGroupCreateForms = reactive({})
const optionCreateForms = reactive({})
const optionGroupEditForms = reactive({})
const optionEditForms = reactive({})

watchEffect(() => {
  menuAdminStore.load()
})

watch(
  () => state.value.categories,
  categories => {
    if (!createForm.categoryId && categories.length > 0) {
      createForm.categoryId = categories[0].id
    }

    categories.forEach(category => {
      categoryDraftNames[category.id] = category.name
    })
  },
  { immediate: true, deep: true }
)

watch(
  () => state.value.items,
  items => {
    items.forEach(item => {
      draftCategoryIds[item.id] = item.categoryId || draftCategoryIds[item.id] || ''
      draftPrices[item.id] = String(item.price)
      draftImages[item.id] = item.imageUrl || ''

      optionGroupCreateForms[item.id] ||= {
        label: '',
        type: 'single',
        required: true
      }

      ;(item.optionGroups || []).forEach(group => {
        const groupKey = buildGroupKey(item.id, group.id)
        const optionIds = group.options.map(option => option.id)
        const defaultOptionIds = (item.defaultOptionIds || []).filter(optionId =>
          optionIds.includes(optionId)
        )

        optionGroupEditForms[groupKey] = {
          label: group.label,
          type: group.type,
          required: Boolean(group.required),
          defaultOptionIds
        }

        optionCreateForms[groupKey] ||= {
          label: '',
          priceDelta: '0'
        }

        group.options.forEach(option => {
          optionEditForms[buildOptionKey(item.id, group.id, option.id)] = {
            label: option.label,
            priceDelta: String(option.priceDelta || 0)
          }
        })
      })
    })
  },
  { immediate: true, deep: true }
)

function buildGroupKey(itemId, groupId) {
  return `${itemId}:${groupId}`
}

function buildOptionKey(itemId, groupId, optionId) {
  return `${itemId}:${groupId}:${optionId}`
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('IMAGE_READ_FAILED'))
    reader.readAsDataURL(file)
  })
}

async function runSafely(task) {
  try {
    await task()
  } catch (error) {
    const message = String(error?.message || '')

    if (message === 'MENU_CATEGORY_IN_USE') {
      window.alert('此分類仍有商品使用中，請先移動或處理商品後再刪除。')
      return
    }

    if (message === 'MENU_CATEGORY_ALREADY_EXISTS') {
      window.alert('分類名稱已存在，請改用其他名稱。')
      return
    }

    if (message === 'MENU_CATEGORY_NAME_REQUIRED') {
      window.alert('請輸入分類名稱。')
      return
    }

    if (message === 'MENU_ITEM_TITLE_REQUIRED') {
      window.alert('請輸入商品名稱。')
      return
    }

    window.alert('操作失敗，請稍後再試。')
    console.error(error)
  }
}

function toggleCreatePanel() {
  createPanelOpen.value = !createPanelOpen.value
}

async function handleCreateImageChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const dataUrl = await readFileAsDataUrl(file)
  createForm.imageUrl = dataUrl
  createPreviewUrl.value = dataUrl
}

async function handleItemImageChange(item, event) {
  const file = event.target.files?.[0]
  if (!file) return

  const dataUrl = await readFileAsDataUrl(file)
  draftImages[item.id] = dataUrl

  await runSafely(async () => {
    await menuAdminStore.updateItemImage({
      itemId: item.id,
      imageUrl: dataUrl
    })
  })
}

async function createCategory() {
  await runSafely(async () => {
    await menuAdminStore.createCategory({
      name: categoryCreateName.value
    })
    categoryCreateName.value = ''
  })
}

async function saveCategory(category) {
  await runSafely(async () => {
    await menuAdminStore.updateCategory({
      categoryId: category.id,
      name: categoryDraftNames[category.id]
    })
  })
}

async function moveCategory(category, direction) {
  await runSafely(async () => {
    await menuAdminStore.reorderCategories({
      categoryId: category.id,
      direction
    })
  })
}

async function removeCategory(category) {
  await runSafely(async () => {
    await menuAdminStore.deleteCategory({
      categoryId: category.id
    })

    if (createForm.categoryId === category.id) {
      createForm.categoryId = state.value.categories[0]?.id || ''
    }
  })
}

async function createItem() {
  await runSafely(async () => {
    await menuAdminStore.createItem({
      title: createForm.title,
      categoryId: createForm.categoryId,
      price: Number(createForm.price || 0),
      description: createForm.description,
      imageUrl: createForm.imageUrl
    })

    createForm.title = ''
    createForm.price = '0'
    createForm.description = ''
    createForm.imageUrl = ''
    createPreviewUrl.value = ''
    createPanelOpen.value = false
  })
}

async function savePrice(item) {
  await runSafely(async () => {
    await menuAdminStore.updateItemPrice({
      itemId: item.id,
      price: Number(draftPrices[item.id] || item.price)
    })
  })
}

async function saveItemCategory(item) {
  await runSafely(async () => {
    await menuAdminStore.updateItemCategory({
      itemId: item.id,
      categoryId: draftCategoryIds[item.id]
    })
  })
}

async function updateItemStatus(item, patch) {
  await runSafely(async () => {
    await menuAdminStore.updateItemStatus({
      itemId: item.id,
      soldOut: patch.soldOut,
      hidden: patch.hidden
    })
  })
}

async function createOptionGroup(item) {
  const form = optionGroupCreateForms[item.id]

  await runSafely(async () => {
    await menuAdminStore.addOptionGroup({
      itemId: item.id,
      label: form.label,
      type: form.type,
      required: Boolean(form.required)
    })

    optionGroupCreateForms[item.id] = {
      label: '',
      type: 'single',
      required: true
    }
  })
}

async function saveOptionGroup(item, group) {
  const groupKey = buildGroupKey(item.id, group.id)
  const form = optionGroupEditForms[groupKey]

  await runSafely(async () => {
    await menuAdminStore.updateOptionGroup({
      itemId: item.id,
      groupId: group.id,
      label: form.label,
      type: form.type,
      required: Boolean(form.required)
    })

    await menuAdminStore.updateDefaultOptions({
      itemId: item.id,
      selectedOptionIds: collectDefaultOptionIds(item)
    })
  })
}

async function removeOptionGroup(item, group) {
  await runSafely(async () => {
    await menuAdminStore.deleteOptionGroup({
      itemId: item.id,
      groupId: group.id
    })
  })
}

async function createOption(item, group) {
  const groupKey = buildGroupKey(item.id, group.id)
  const form = optionCreateForms[groupKey]

  await runSafely(async () => {
    await menuAdminStore.addOption({
      itemId: item.id,
      groupId: group.id,
      label: form.label,
      priceDelta: Number(form.priceDelta || 0)
    })

    optionCreateForms[groupKey] = {
      label: '',
      priceDelta: '0'
    }
  })
}

async function saveOption(item, group, option) {
  const optionKey = buildOptionKey(item.id, group.id, option.id)
  const form = optionEditForms[optionKey]

  await runSafely(async () => {
    await menuAdminStore.updateOption({
      itemId: item.id,
      groupId: group.id,
      optionId: option.id,
      label: form.label,
      priceDelta: Number(form.priceDelta || 0)
    })
  })
}

async function removeOption(item, group, option) {
  await runSafely(async () => {
    await menuAdminStore.deleteOption({
      itemId: item.id,
      groupId: group.id,
      optionId: option.id
    })
  })
}

async function saveDefaultOptions(item) {
  await runSafely(async () => {
    await menuAdminStore.updateDefaultOptions({
      itemId: item.id,
      selectedOptionIds: collectDefaultOptionIds(item)
    })
  })
}

function collectDefaultOptionIds(item) {
  return (item.optionGroups || []).flatMap(group => {
    const groupKey = buildGroupKey(item.id, group.id)
    const form = optionGroupEditForms[groupKey]
    const selectedOptionIds = Array.isArray(form?.defaultOptionIds) ? form.defaultOptionIds : []
    const validOptionIds = group.options
      .map(option => option.id)
      .filter(optionId => selectedOptionIds.includes(optionId))

    if (form?.type === 'single') {
      return validOptionIds.slice(0, 1)
    }

    return validOptionIds
  })
}

function isDefaultSelected(item, group, optionId) {
  const form = optionGroupEditForms[buildGroupKey(item.id, group.id)]
  return Array.isArray(form?.defaultOptionIds) && form.defaultOptionIds.includes(optionId)
}

function toggleDefaultOption(item, group, optionId, checked) {
  const form = optionGroupEditForms[buildGroupKey(item.id, group.id)]
  if (!form) return

  if (form.type === 'single') {
    form.defaultOptionIds = checked ? [optionId] : []
    return
  }

  const current = new Set(form.defaultOptionIds || [])
  if (checked) {
    current.add(optionId)
  } else {
    current.delete(optionId)
  }
  form.defaultOptionIds = [...current]
}
</script>

<template lang="pug">
.menu-admin-page
  section.menu-admin-card
    .menu-admin-card__head
      div
        p.eyebrow 分類管理
        h2.menu-admin-card__title 菜單分類
        p.menu-admin-card__lead 先把分類排好，商品新增與菜單顯示才會穩定。
    .category-create
      input.form-field__input(
        v-model="categoryCreateName"
        type="text"
        placeholder="輸入新分類名稱"
      )
      button.action-chip(type="button" @click="createCategory()") 新增分類
    .category-list
      article.category-row(v-for="category in state.categories" :key="category.id")
        .category-row__main
          input.category-row__input(
            v-model="categoryDraftNames[category.id]"
            type="text"
          )
          span.category-row__meta 排序 {{ category.sortOrder }}
        .category-row__actions
          button.action-chip.is-muted(type="button" @click="moveCategory(category, 'up')") 上移
          button.action-chip.is-muted(type="button" @click="moveCategory(category, 'down')") 下移
          button.action-chip.is-muted(type="button" @click="saveCategory(category)") 儲存名稱
          button.action-chip.is-danger(type="button" @click="removeCategory(category)") 刪除

  section.menu-admin-card
    .menu-admin-card__head
      div
        p.eyebrow 商品管理
        h2.menu-admin-card__title 商品與客製規則
        p.menu-admin-card__lead
          | 可管理商品圖片、價格、上下架、售完狀態，以及單選、多選、必選與預設值。
      button.create-button(type="button" @click="toggleCreatePanel()")
        | {{ createPanelOpen ? '收起新增表單' : '新增商品' }}

    form.create-panel(v-if="createPanelOpen" @submit.prevent="createItem()")
      label.form-field
        span.form-field__label 商品名稱
        input.form-field__input(v-model="createForm.title" type="text" placeholder="例：招牌海藻涼麵")
      label.form-field
        span.form-field__label 所屬分類
        select.form-field__input(v-model="createForm.categoryId")
          option(v-for="category in state.categories" :key="category.id" :value="category.id") {{ category.name }}
      label.form-field
        span.form-field__label 售價
        input.form-field__input(v-model="createForm.price" type="number" min="0" step="1")
      label.form-field.form-field--wide
        span.form-field__label 商品描述
        textarea.form-field__input.form-field__textarea(
          v-model="createForm.description"
          rows="3"
          placeholder="簡短說明商品內容與特色"
        )
      label.form-field.form-field--wide
        span.form-field__label 商品圖片
        input.form-field__input(type="file" accept="image/*" @change="handleCreateImageChange")
      .create-preview(v-if="createPreviewUrl")
        img.create-preview__image(:src="createPreviewUrl" alt="商品預覽")
      .create-panel__actions
        button.action-chip(type="submit") 建立商品

  section.menu-admin-table
    article.menu-admin-row(v-for="item in state.items" :key="item.id")
      .menu-admin-row__image
        img.menu-admin-row__preview(v-if="draftImages[item.id]" :src="draftImages[item.id]" :alt="item.title")
        .menu-admin-row__preview.is-empty(v-else) 尚未設定圖片
        label.upload-chip
          span 更換圖片
          input.upload-chip__input(type="file" accept="image/*" @change="handleItemImageChange(item, $event)")

      .menu-admin-row__main
        .menu-admin-row__title-wrap
          strong.menu-admin-row__title {{ item.title }}
          span.menu-admin-row__category {{ item.categoryName }}
        p.menu-admin-row__description(v-if="item.description") {{ item.description }}
        .menu-admin-row__meta
          label.price-editor
            span.price-editor__label 分類
            select.price-editor__input(v-model="draftCategoryIds[item.id]")
              option(v-for="category in state.categories" :key="category.id" :value="category.id") {{ category.name }}
            button.price-editor__save(type="button" @click="saveItemCategory(item)") 儲存分類
          label.price-editor
            span.price-editor__label 售價
            input.price-editor__input(v-model="draftPrices[item.id]" type="number" min="0" step="1")
            button.price-editor__save(type="button" @click="savePrice(item)") 儲存價格
          span.menu-admin-row__status(
            :class="{ 'is-hidden': item.hidden, 'is-sold-out': item.soldOut && !item.hidden }"
          ) {{ item.hidden ? '已下架' : item.soldOut ? '已售完' : '上架中' }}

        .customization-card
          .customization-card__head
            h3.customization-card__title 客製規則
            p.customization-card__meta 建立選項群組、選項內容與預設值，供顧客端點餐時使用。

          .group-create
            label.form-field
              span.form-field__label 新群組名稱
              input.form-field__input(
                v-model="optionGroupCreateForms[item.id].label"
                type="text"
                placeholder="例：麵量、辣度、加料"
              )
            label.form-field
              span.form-field__label 選擇方式
              select.form-field__input(v-model="optionGroupCreateForms[item.id].type")
                option(value="single") 單選
                option(value="multi") 多選
            label.form-field.group-create__check
              input(type="checkbox" v-model="optionGroupCreateForms[item.id].required")
              span 顧客必選
            button.action-chip(type="button" @click="createOptionGroup(item)") 新增群組

          .group-list(v-if="item.optionGroups && item.optionGroups.length > 0")
            article.option-group-card(v-for="group in item.optionGroups" :key="group.id")
              .option-group-card__head
                .option-group-card__title-block
                  input.option-group-card__title-input(
                    v-model="optionGroupEditForms[buildGroupKey(item.id, group.id)].label"
                    type="text"
                  )
                  p.option-group-card__subtitle
                    | 可調整名稱、類型與必選設定，再儲存回商品。
                .option-group-card__actions
                  button.action-chip.is-muted(type="button" @click="saveOptionGroup(item, group)") 儲存群組
                  button.action-chip.is-danger(type="button" @click="removeOptionGroup(item, group)") 刪除群組

              .option-group-card__settings
                label.form-field
                  span.form-field__label 類型
                  select.form-field__input(v-model="optionGroupEditForms[buildGroupKey(item.id, group.id)].type")
                    option(value="single") 單選
                    option(value="multi") 多選
                label.form-field.option-group-card__required
                  span.form-field__label 必選設定
                  .checkbox-line
                    input(type="checkbox" v-model="optionGroupEditForms[buildGroupKey(item.id, group.id)].required")
                    span 顧客必須選擇

              .option-defaults(v-if="group.options.length > 0")
                h4.option-defaults__title 預設值
                .option-defaults__list
                  label.option-defaults__item(v-for="option in group.options" :key="option.id")
                    input(
                      :type="optionGroupEditForms[buildGroupKey(item.id, group.id)].type === 'single' ? 'radio' : 'checkbox'"
                      :name="`default-${item.id}-${group.id}`"
                      :checked="isDefaultSelected(item, group, option.id)"
                      @change="toggleDefaultOption(item, group, option.id, $event.target.checked)"
                    )
                    span {{ option.label }}
                button.action-chip.is-muted(type="button" @click="saveDefaultOptions(item)") 儲存預設值

              .option-list
                article.option-row(v-for="option in group.options" :key="option.id")
                  input.option-row__input(
                    v-model="optionEditForms[buildOptionKey(item.id, group.id, option.id)].label"
                    type="text"
                  )
                  input.option-row__price(
                    v-model="optionEditForms[buildOptionKey(item.id, group.id, option.id)].priceDelta"
                    type="number"
                    min="0"
                    step="1"
                  )
                  button.action-chip.is-muted(type="button" @click="saveOption(item, group, option)") 儲存
                  button.action-chip.is-danger(type="button" @click="removeOption(item, group, option)") 刪除

              .option-create
                input.form-field__input(
                  v-model="optionCreateForms[buildGroupKey(item.id, group.id)].label"
                  type="text"
                  placeholder="新增選項名稱"
                )
                input.form-field__input.option-create__price(
                  v-model="optionCreateForms[buildGroupKey(item.id, group.id)].priceDelta"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="加價"
                )
                button.action-chip.is-muted(type="button" @click="createOption(item, group)") 新增選項

          p.customization-card__empty(v-else) 目前尚未設定任何客製群組。

      .menu-admin-row__actions
        button.action-chip(type="button" @click="updateItemStatus(item, { hidden: !item.hidden })")
          | {{ item.hidden ? '重新上架' : '下架商品' }}
        button.action-chip.is-muted(
          type="button"
          @click="updateItemStatus(item, { soldOut: !item.soldOut })"
          :disabled="item.hidden"
        ) {{ item.soldOut ? '恢復供應' : '標記售完' }}
</template>

<style lang="sass">
.menu-admin-page
  display: grid
  gap: 18px

.menu-admin-card
  padding: 22px
  border-radius: 22px
  background: rgba(255, 255, 255, 0.88)
  border: 1px solid rgba(140, 90, 31, 0.12)
  display: grid
  gap: 16px

.menu-admin-card__head
  display: flex
  justify-content: space-between
  align-items: start
  gap: 16px

.eyebrow
  margin: 0 0 8px
  color: #8c5a1f
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase

.menu-admin-card__title
  margin: 0 0 10px
  color: #243a3e

.menu-admin-card__lead
  margin: 0
  color: #6e8083
  line-height: 1.6

.category-create
  display: grid
  grid-template-columns: minmax(0, 1fr) auto
  gap: 12px

.category-list
  display: grid
  gap: 10px

.category-row
  display: grid
  grid-template-columns: minmax(0, 1fr) auto
  gap: 12px
  align-items: center
  padding: 14px 16px
  border-radius: 16px
  background: rgba(121, 214, 207, 0.08)
  border: 1px solid rgba(109, 180, 177, 0.18)

.category-row__main
  display: grid
  gap: 8px

.category-row__input
  width: 100%
  border: 1px solid rgba(109, 180, 177, 0.24)
  border-radius: 12px
  padding: 10px 12px
  font: inherit
  color: #243a3e
  background: #fff

.category-row__meta
  color: #6e8083
  font-size: 12px

.category-row__actions
  display: flex
  gap: 8px
  flex-wrap: wrap
  justify-content: end

.create-button
  border: 0
  border-radius: 999px
  padding: 12px 16px
  background: #17383f
  color: #fff
  font-weight: 700
  cursor: pointer

.create-panel
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 12px
  padding: 16px
  border-radius: 18px
  background: rgba(121, 214, 207, 0.08)
  border: 1px solid rgba(109, 180, 177, 0.18)

.form-field
  display: grid
  gap: 8px

.form-field--wide
  grid-column: 1 / -1

.form-field__label
  color: #51686b
  font-size: 13px
  font-weight: 700

.form-field__input
  width: 100%
  border: 1px solid rgba(109, 180, 177, 0.25)
  border-radius: 12px
  padding: 10px 12px
  font: inherit
  color: #243a3e
  background: #fff

.form-field__textarea
  resize: vertical

.create-preview
  grid-column: 1 / -1
  display: flex
  align-items: center

.create-preview__image
  width: 160px
  aspect-ratio: 1 / 1
  border-radius: 18px
  object-fit: cover
  border: 1px solid rgba(109, 180, 177, 0.18)

.create-panel__actions
  grid-column: 1 / -1
  display: flex
  justify-content: end

.menu-admin-table
  display: grid
  gap: 12px

.menu-admin-row
  display: grid
  grid-template-columns: 132px minmax(0, 1fr) auto
  gap: 14px
  padding: 16px
  border-radius: 18px
  background: #fff
  border: 1px solid rgba(109, 180, 177, 0.18)

.menu-admin-row__image
  display: grid
  gap: 10px
  align-content: start

.menu-admin-row__preview
  width: 132px
  aspect-ratio: 1 / 1
  border-radius: 16px
  object-fit: cover
  border: 1px solid rgba(109, 180, 177, 0.18)
  background: #f1f7f6

.menu-admin-row__preview.is-empty
  display: grid
  place-items: center
  color: #6e8083
  font-size: 13px

.upload-chip
  display: inline-flex
  justify-content: center
  align-items: center
  border-radius: 999px
  padding: 10px 12px
  background: rgba(121, 214, 207, 0.14)
  color: #2d6f6d
  font-weight: 700
  cursor: pointer

.upload-chip__input
  display: none

.menu-admin-row__main
  display: grid
  gap: 12px

.menu-admin-row__title-wrap
  display: flex
  flex-wrap: wrap
  align-items: center
  gap: 10px

.menu-admin-row__title
  color: #21393d

.menu-admin-row__category
  color: #6e8083
  font-size: 13px

.menu-admin-row__description
  margin: 0
  color: #53686c
  line-height: 1.6

.menu-admin-row__meta
  display: flex
  flex-wrap: wrap
  gap: 12px
  align-items: center

.price-editor
  display: flex
  align-items: center
  gap: 10px
  flex-wrap: wrap

.price-editor__label
  color: #6e8083
  font-size: 13px

.price-editor__input
  width: 120px
  border: 1px solid rgba(109, 180, 177, 0.25)
  border-radius: 12px
  padding: 10px 12px
  font: inherit
  color: #243a3e
  background: #f8fcfb

.price-editor__save
  border: 0
  border-radius: 999px
  padding: 10px 14px
  background: rgba(121, 214, 207, 0.16)
  color: #2d6f6d
  font-weight: 700
  cursor: pointer

.menu-admin-row__status
  padding: 5px 10px
  border-radius: 999px
  background: rgba(95, 196, 129, 0.12)
  color: #2b7c4f
  font-size: 12px
  font-weight: 700

.menu-admin-row__status.is-sold-out
  background: rgba(241, 164, 76, 0.16)
  color: #9c5d11

.menu-admin-row__status.is-hidden
  background: rgba(90, 111, 132, 0.14)
  color: #4c6378

.customization-card
  display: grid
  gap: 12px
  padding: 14px
  border-radius: 16px
  background: rgba(121, 214, 207, 0.08)
  border: 1px solid rgba(109, 180, 177, 0.18)

.customization-card__head
  display: grid
  gap: 4px

.customization-card__title
  margin: 0
  color: #21393d
  font-size: 15px

.customization-card__meta
  margin: 0
  color: #6e8083
  font-size: 13px

.group-create
  display: grid
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) auto auto
  gap: 10px
  align-items: end

.group-create__check
  display: flex
  align-items: center
  gap: 8px
  padding-bottom: 10px
  color: #51686b
  font-size: 13px
  font-weight: 700

.group-list
  display: grid
  gap: 10px

.option-group-card
  display: grid
  gap: 12px
  padding: 12px
  border-radius: 14px
  background: #fff
  border: 1px solid rgba(109, 180, 177, 0.16)

.option-group-card__head
  display: flex
  justify-content: space-between
  align-items: start
  gap: 12px

.option-group-card__title-block
  display: grid
  gap: 8px
  flex: 1

.option-group-card__title-input
  width: 100%
  border: 1px solid rgba(109, 180, 177, 0.24)
  border-radius: 12px
  padding: 10px 12px
  font: inherit
  color: #243a3e

.option-group-card__subtitle
  margin: 0
  color: #6e8083
  font-size: 12px

.option-group-card__actions
  display: flex
  gap: 8px
  flex-wrap: wrap
  justify-content: end

.option-group-card__settings
  display: grid
  grid-template-columns: 180px auto
  gap: 12px

.option-group-card__required
  align-content: end

.checkbox-line
  display: inline-flex
  align-items: center
  gap: 8px
  color: #51686b

.option-defaults
  display: grid
  gap: 10px
  padding: 12px
  border-radius: 12px
  background: rgba(121, 214, 207, 0.08)

.option-defaults__title
  margin: 0
  color: #243a3e
  font-size: 13px

.option-defaults__list
  display: flex
  flex-wrap: wrap
  gap: 8px 14px

.option-defaults__item
  display: inline-flex
  align-items: center
  gap: 8px
  color: #486c70
  font-size: 13px

.option-list
  display: grid
  gap: 8px

.option-row
  display: grid
  grid-template-columns: minmax(0, 1fr) 120px auto auto
  gap: 10px
  align-items: center

.option-row__input,
.option-row__price
  width: 100%
  border: 1px solid rgba(109, 180, 177, 0.24)
  border-radius: 12px
  padding: 10px 12px
  font: inherit
  color: #243a3e
  background: #fff

.option-create
  display: grid
  grid-template-columns: minmax(0, 1fr) 120px auto
  gap: 10px

.option-create__price
  width: 120px

.customization-card__empty
  margin: 0
  color: #6e8083

.menu-admin-row__actions
  display: flex
  flex-wrap: wrap
  justify-content: end
  gap: 10px
  align-items: start

.action-chip
  border: 0
  border-radius: 999px
  padding: 10px 14px
  background: #17383f
  color: #fff
  font-weight: 700
  cursor: pointer

.action-chip.is-muted
  background: rgba(121, 214, 207, 0.14)
  color: #2d6f6d

.action-chip.is-danger
  background: rgba(214, 87, 74, 0.14)
  color: #a63d31

.action-chip:disabled
  opacity: 0.45
  cursor: not-allowed

@media (max-width: 1180px)
  .menu-admin-row
    grid-template-columns: 1fr

  .menu-admin-row__image
    justify-items: start

  .menu-admin-row__actions
    justify-content: start

@media (max-width: 960px)
  .category-create,
  .category-row,
  .create-panel,
  .group-create,
  .option-group-card__settings,
  .option-row,
  .option-create
    grid-template-columns: 1fr

  .create-panel__actions
    justify-content: start

  .option-group-card__head
    display: grid
    grid-template-columns: 1fr

  .option-group-card__actions,
  .category-row__actions
    justify-content: start
</style>
