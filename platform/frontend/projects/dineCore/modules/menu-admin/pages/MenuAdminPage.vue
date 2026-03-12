<script setup>
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import world from '@/world.js'

const menuAdminStore = world.store('dineCoreMenuAdminStore')
const state = computed(() => menuAdminStore.state)

const categoryPanelOpen = ref(false)
const activeItemCategoryId = ref('')
const createPanelOpen = ref(false)
const createForm = reactive({
  title: '',
  categoryId: '',
  price: '0',
  description: '',
  imageUrl: ''
})

const categoryCreateName = ref('')
const categoryDraftNames = reactive({})
const draftTitles = reactive({})
const draftDescriptions = reactive({})
const draftCategoryIds = reactive({})
const draftPrices = reactive({})
const draftImages = reactive({})
const customizationCollapsed = reactive({})
const optionGroupCreateForms = reactive({})
const optionCreateForms = reactive({})
const optionGroupEditForms = reactive({})
const optionEditForms = reactive({})

watchEffect(() => {
  menuAdminStore.load().catch(error => {
    window.alert(error instanceof Error ? error.message : 'MENU_ADMIN_LOAD_FAILED')
  })
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

    const availableIds = new Set(categories.map(category => String(category.id || '')))
    if (!availableIds.has(activeItemCategoryId.value)) {
      activeItemCategoryId.value = resolvePreferredCategoryId(categories)
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => state.value.items,
  items => {
    items.forEach(item => {
      draftTitles[item.id] = item.title || ''
      draftDescriptions[item.id] = item.description || ''
      draftCategoryIds[item.id] = item.categoryId || draftCategoryIds[item.id] || ''
      draftPrices[item.id] = String(item.price)
      draftImages[item.id] = item.imageUrl || ''
      customizationCollapsed[item.id] ??= true

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

function isMainCategory(category) {
  const id = String(category?.id || '').trim().toLowerCase()
  const name = String(category?.name || '').trim()
  return id.includes('main') || name.includes('主餐')
}

function resolvePreferredCategoryId(categories = []) {
  const matched = categories.find(isMainCategory)
  return String(matched?.id || categories[0]?.id || '')
}

const filteredItems = computed(() => {
  const categoryId = String(activeItemCategoryId.value || '').trim()
  const items = Array.isArray(state.value.items) ? state.value.items : []

  if (!categoryId) {
    return items
  }

  return items.filter(item => String(item?.categoryId || '') === categoryId)
})

async function runSafely(task) {
  try {
    await task()
  } catch (error) {
    const message = String(error?.message || '')

    if (message === 'MENU_CATEGORY_IN_USE') {
      window.alert('此分類仍有商品使用中，請先移動商品後再刪除分類。')
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

    if (message === 'MENU_ITEM_NOT_FOUND') {
      window.alert('找不到指定商品，請重新整理後再試。')
      return
    }

    if (message === 'MENU_OPTION_GROUP_NOT_FOUND' || message === 'OPTION_GROUP_NOT_FOUND') {
      window.alert('找不到指定客製群組，請重新整理後再試。')
      return
    }

    if (message === 'MENU_OPTION_NOT_FOUND' || message === 'OPTION_NOT_FOUND') {
      window.alert('找不到指定選項，請重新整理後再試。')
      return
    }

    if (message === 'MENU_OPTION_GROUP_LABEL_REQUIRED' || message === 'OPTION_GROUP_LABEL_REQUIRED') {
      window.alert('請輸入客製群組名稱。')
      return
    }

    if (message === 'MENU_OPTION_LABEL_REQUIRED' || message === 'OPTION_LABEL_REQUIRED') {
      window.alert('請輸入選項名稱。')
      return
    }

    if (message === 'INVALID_OPTION_GROUP_TYPE') {
      window.alert('客製群組類型無效，請改用單選或多選。')
      return
    }

    if (message === 'INVALID_OPTION_PRICE_DELTA') {
      window.alert('選項加價必須是大於或等於 0 的數字。')
      return
    }

    if (message === 'MENU_IMAGE_URL_REQUIRED') {
      window.alert('請輸入圖片網址。')
      return
    }

    window.alert('操作失敗：' + (message || 'UNKNOWN_ERROR'))
    console.error(error)
  }
}

function toggleCreatePanel() {
  createPanelOpen.value = !createPanelOpen.value
}

function toggleCategoryPanel() {
  categoryPanelOpen.value = !categoryPanelOpen.value
}

function setActiveItemCategory(categoryId) {
  activeItemCategoryId.value = String(categoryId || '').trim()
}

function isCustomizationCollapsed(itemId) {
  return customizationCollapsed[itemId] !== false
}

function toggleCustomization(itemId) {
  customizationCollapsed[itemId] = !isCustomizationCollapsed(itemId)
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
    const categories = [...(state.value.categories || [])]
    const currentIndex = categories.findIndex(entry => entry.id === category.id)
    if (currentIndex < 0) return

    const targetIndex =
      direction === 'up' ? currentIndex - 1 : direction === 'down' ? currentIndex + 1 : currentIndex

    if (targetIndex < 0 || targetIndex >= categories.length || targetIndex === currentIndex) {
      return
    }

    const [movedCategory] = categories.splice(currentIndex, 1)
    categories.splice(targetIndex, 0, movedCategory)

    await menuAdminStore.reorderCategories({
      categoryIds: categories.map(entry => entry.id)
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
    createPanelOpen.value = false
  })
}

async function saveItemBasics(item) {
  const nextImageUrl = String(draftImages[item.id] || '').trim()
  const nextTitle = String(draftTitles[item.id] || '').trim()
  const nextDescription = String(draftDescriptions[item.id] || '').trim()
  const nextPrice = Number(draftPrices[item.id] || item.price)
  const nextCategoryId = draftCategoryIds[item.id]

  await runSafely(async () => {
    await menuAdminStore.updateItemImage({
      itemId: item.id,
      imageUrl: nextImageUrl
    })

    await menuAdminStore.updateItemContent({
      itemId: item.id,
      title: nextTitle,
      description: nextDescription
    })

    await menuAdminStore.updateItemPrice({
      itemId: item.id,
      price: nextPrice
    })

    await menuAdminStore.updateItemCategory({
      itemId: item.id,
      categoryId: nextCategoryId
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
  const nextGroup = {
    label: String(form?.label || '').trim(),
    type: String(form?.type || 'single'),
    required: Boolean(form?.required)
  }
  const nextOptions = (group.options || []).map(option => {
    const optionForm = optionEditForms[buildOptionKey(item.id, group.id, option.id)]

    return {
      optionId: option.id,
      label: String(optionForm?.label || '').trim(),
      priceDelta: Number(optionForm?.priceDelta || 0)
    }
  })
  const nextDefaultOptionIds = collectGroupDefaultOptionIds(item, group)

  await runSafely(async () => {
    await menuAdminStore.updateOptionGroup({
      itemId: item.id,
      groupId: group.id,
      label: nextGroup.label,
      type: nextGroup.type,
      required: nextGroup.required
    })

    for (const option of nextOptions) {
      await menuAdminStore.updateOption({
        itemId: item.id,
        groupId: group.id,
        optionId: option.optionId,
        label: option.label,
        priceDelta: option.priceDelta
      })
    }

    await menuAdminStore.updateDefaultOptions({
      itemId: item.id,
      selectedOptionIds: nextDefaultOptionIds
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

async function removeOption(item, group, option) {
  await runSafely(async () => {
    await menuAdminStore.deleteOption({
      itemId: item.id,
      groupId: group.id,
      optionId: option.id
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

function collectGroupDefaultOptionIds(item, targetGroup) {
  return (item.optionGroups || []).flatMap(group => {
    const groupKey = buildGroupKey(item.id, group.id)
    const form = optionGroupEditForms[groupKey]
    const selectedOptionIds = Array.isArray(form?.defaultOptionIds) ? form.defaultOptionIds : []
    const validOptionIds = group.options
      .map(option => option.id)
      .filter(optionId => selectedOptionIds.includes(optionId))

    if (group.id !== targetGroup.id) {
      return []
    }

    if ((form?.type || group.type) === 'single') {
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
      button.create-button(type="button" @click="toggleCategoryPanel()")
        | {{ categoryPanelOpen ? '收起分類管理' : '展開分類管理' }}
    .category-create(v-if="categoryPanelOpen")
      input.form-field__input(
        v-model="categoryCreateName"
        type="text"
        placeholder="請輸入新分類名稱"
      )
      button.action-chip(type="button" @click="createCategory()") 新增分類
    .category-list(v-if="categoryPanelOpen")
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
    p.menu-admin-card__collapsed-note(v-else) 分類管理預設收合，需要時再展開調整。

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
        input.form-field__input(v-model="createForm.title" type="text" placeholder="例如：招牌海藻涼麵")
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
          placeholder="請輸入商品描述"
        )
      label.form-field.form-field--wide
        span.form-field__label 商品圖片網址
        input.form-field__input(v-model="createForm.imageUrl" type="url" placeholder="因為是免費伺服器所以暫不提供圖片上傳功能，以免費圖片網站代替")
      .create-preview(v-if="createForm.imageUrl")
        img.create-preview__image(:src="createForm.imageUrl" alt="商品預覽")
      .create-panel__actions
        button.action-chip(type="submit") 建立商品

  section.menu-admin-card(v-if="state.categories.length > 0")
    .item-category-tabs
      button.item-category-tab(
        v-for="category in state.categories"
        :key="category.id"
        type="button"
        :class="{ 'is-active': activeItemCategoryId === category.id }"
        @click="setActiveItemCategory(category.id)"
      ) {{ category.name }}

  section.menu-admin-table
    article.menu-admin-row(v-for="item in filteredItems" :key="item.id")
      .menu-admin-row__image
        img.menu-admin-row__preview(v-if="draftImages[item.id]" :src="draftImages[item.id]" :alt="item.title")
        .menu-admin-row__preview.is-empty(v-else) 尚未設定圖片
        input.form-field__input(v-model="draftImages[item.id]" type="url" placeholder="https://images.example.com/menu/item.jpg")


      .menu-admin-row__main
        .menu-admin-row__title-wrap
          input.menu-admin-row__title-input(
            v-model="draftTitles[item.id]"
            type="text"
            placeholder="請輸入商品名稱"
          )
          span.menu-admin-row__category {{ item.categoryName }}
        textarea.menu-admin-row__description-input(
          v-model="draftDescriptions[item.id]"
          rows="2"
          placeholder="請輸入商品描述"
        )
        .menu-admin-row__meta
          label.price-editor
            span.price-editor__label 分類
            select.price-editor__input(v-model="draftCategoryIds[item.id]")
              option(v-for="category in state.categories" :key="category.id" :value="category.id") {{ category.name }}
          label.price-editor
            span.price-editor__label 售價
            input.price-editor__input(v-model="draftPrices[item.id]" type="number" min="0" step="1")
          span.menu-admin-row__status(
            :class="{ 'is-hidden': item.hidden, 'is-sold-out': item.soldOut && !item.hidden }"
          ) {{ item.hidden ? "已下架" : item.soldOut ? "已售完" : "上架中" }}

        .customization-card
          .customization-card__head
            .customization-card__head-main
              h3.customization-card__title 客製規則
              p.customization-card__meta 建立選項群組、選項內容與預設值，供顧客端點餐時使用。
            button.action-chip.is-muted(
              type="button"
              @click="toggleCustomization(item.id)"
            ) {{ isCustomizationCollapsed(item.id) ? '展開' : '收合' }}

          .group-create(v-if="!isCustomizationCollapsed(item.id)")
            label.form-field
              span.form-field__label 新群組名稱
              input.form-field__input(
                v-model="optionGroupCreateForms[item.id].label"
                type="text"
                placeholder="例如：份量、辣度、加料"
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

          .group-list(v-if="!isCustomizationCollapsed(item.id) && item.optionGroups && item.optionGroups.length > 0")
            article.option-group-card(v-for="group in item.optionGroups" :key="group.id")
              .option-group-card__head
                .option-group-card__title-block
                  input.option-group-card__title-input(
                    v-model="optionGroupEditForms[buildGroupKey(item.id, group.id)].label"
                    type="text"
                  )
                  p.option-group-card__subtitle
                    | 單選群組僅可設定一個預設值，多選群組可設定多個預設值。

              .option-group-card__settings
                label.form-field
                  span.form-field__label 選擇方式
                  select.form-field__input(v-model="optionGroupEditForms[buildGroupKey(item.id, group.id)].type")
                    option(value="single") 單選
                    option(value="multi") 多選
                label.form-field.option-group-card__required
                  span.form-field__label 顧客必選
                  .checkbox-line
                    input(type="checkbox" v-model="optionGroupEditForms[buildGroupKey(item.id, group.id)].required")
                    span 啟用必選

              .option-defaults(v-if="group.options.length > 0")
                h4.option-defaults__title 預設選項
                .option-defaults__list
                  label.option-defaults__item(v-for="option in group.options" :key="option.id")
                    input(
                      :type="optionGroupEditForms[buildGroupKey(item.id, group.id)].type === 'single' ? 'radio' : 'checkbox'"
                      :name="`default-${item.id}-${group.id}`"
                      :checked="isDefaultSelected(item, group, option.id)"
                      @change="toggleDefaultOption(item, group, option.id, $event.target.checked)"
                    )
                    span {{ option.label }}

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

              .option-group-card__actions
                button.action-chip.is-muted(type="button" @click="saveOptionGroup(item, group)") 儲存此群組
                button.action-chip.is-danger(type="button" @click="removeOptionGroup(item, group)") 刪除群組

          p.customization-card__empty(v-if="!isCustomizationCollapsed(item.id) && (!item.optionGroups || item.optionGroups.length === 0)") 尚未設定客製規則，請先新增群組。

      .menu-admin-row__actions
        button.action-chip(type="button" @click="saveItemBasics(item)") 確認修改
        button.action-chip.is-warning(type="button" @click="updateItemStatus(item, { hidden: !item.hidden })")
          | {{ item.hidden ? '重新上架' : '下架商品' }}
        button.action-chip.is-muted(
          type="button"
          @click="updateItemStatus(item, { soldOut: !item.soldOut })"
          :disabled="item.hidden"
        ) {{ item.soldOut ? '恢復供應' : '標記售完' }}
    p.menu-admin-table__empty(v-if="filteredItems.length === 0") 目前這個分類尚無商品。
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

.menu-admin-card__collapsed-note
  margin: 0
  color: #6e8083
  font-size: 13px

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

.item-category-tabs
  display: flex
  flex-wrap: wrap
  gap: 10px

.item-category-tab
  border: 0
  border-radius: 999px
  padding: 10px 14px
  background: rgba(121, 214, 207, 0.14)
  color: #2d6f6d
  font-weight: 700
  cursor: pointer

.item-category-tab.is-active
  background: #17383f
  color: #fff

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

.menu-admin-table__empty
  margin: 0
  padding: 20px
  border-radius: 18px
  background: rgba(255, 255, 255, 0.88)
  border: 1px dashed rgba(109, 180, 177, 0.24)
  color: #6e8083

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

.menu-admin-row__title-input
  flex: 1
  min-width: 220px
  border: 1px solid rgba(109, 180, 177, 0.24)
  border-radius: 12px
  padding: 10px 12px
  font: inherit
  color: #21393d
  background: #fff

.menu-admin-row__category
  color: #6e8083
  font-size: 13px

.menu-admin-row__description-input
  width: 100%
  min-height: 64px
  border: 1px solid rgba(109, 180, 177, 0.24)
  border-radius: 12px
  padding: 10px 12px
  font: inherit
  color: #53686c
  background: #fff
  line-height: 1.6
  resize: vertical

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
  display: flex
  justify-content: space-between
  align-items: start
  gap: 10px

.customization-card__head-main
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
  justify-content: center

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

.action-chip.is-warning
  background: rgba(241, 164, 76, 0.18)
  color: #9c5d11

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
