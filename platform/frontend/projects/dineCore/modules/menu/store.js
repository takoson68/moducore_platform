import world from '@/world.js'
import { loadMenuPayload } from './service.js'

function createCategory(id, name) {
  return { id, name }
}

function normalizeCategoryToken(value) {
  return String(value || '').trim().toLowerCase()
}

function isMainCategory(category) {
  const id = normalizeCategoryToken(category?.id)
  const name = String(category?.name || '').trim()
  return id.includes('main') || name.includes('主餐')
}

function isDrinkCategory(category) {
  const id = normalizeCategoryToken(category?.id)
  const name = String(category?.name || '').trim()
  return id.includes('drink') || name.includes('飲')
}

function sortCategoriesByBusinessPriority(categories = []) {
  return categories
    .map((category, index) => ({ ...category, __index: index }))
    .sort((left, right) => {
      const leftRank = isMainCategory(left) ? 0 : isDrinkCategory(left) ? 2 : 1
      const rightRank = isMainCategory(right) ? 0 : isDrinkCategory(right) ? 2 : 1
      if (leftRank !== rightRank) return leftRank - rightRank
      return left.__index - right.__index
    })
    .map(({ __index, ...category }) => category)
}

function normalizeCategoriesWithAll(categories = []) {
  const mapped = Array.isArray(categories)
    ? categories.map(category => createCategory(category.id, category.name))
    : []
  const sorted = sortCategoriesByBusinessPriority(mapped)

  const seen = new Set()
  const result = [createCategory('all', '全部商品')]
  seen.add('all')

  for (const category of sorted) {
    const id = String(category.id || '').trim()
    if (!id || seen.has(id) || id === 'all') continue
    seen.add(id)
    result.push(createCategory(id, category.name))
  }

  return result
}

function normalizeOption(option) {
  return {
    id: option.id,
    label: option.label,
    priceDelta: Number(option.priceDelta || 0)
  }
}

function normalizeOptionGroup(group) {
  return {
    id: group.id,
    label: group.label,
    type: group.type,
    required: Boolean(group.required),
    options: Array.isArray(group.options) ? group.options.map(normalizeOption) : []
  }
}

function createItem(payload) {
  return {
    id: payload.id,
    categoryId: payload.categoryId,
    title: payload.title,
    subtitle: payload.subtitle,
    price: Number(payload.price || 0),
    imageUrl: payload.imageUrl || '',
    soldOut: Boolean(payload.soldOut),
    badge: payload.badge || '',
    tone: payload.tone || 'mint',
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    customization: payload.customization
      ? {
          id: payload.customization.id,
          title: payload.customization.title,
          basePrice: Number(payload.customization.basePrice || 0),
          defaultNote: payload.customization.defaultNote || '',
          defaultOptionIds: Array.isArray(payload.customization.defaultOptionIds)
            ? [...payload.customization.defaultOptionIds]
            : [],
          optionGroups: Array.isArray(payload.customization.optionGroups)
            ? payload.customization.optionGroups.map(normalizeOptionGroup)
            : []
        }
      : null
  }
}

function sortItemsByCategoryPriority(items = [], categories = []) {
  const categoryOrder = new Map()
  categories.forEach((category, index) => {
    categoryOrder.set(String(category.id), index)
  })

  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftOrder = categoryOrder.get(String(left.item.categoryId)) ?? Number.MAX_SAFE_INTEGER
      const rightOrder = categoryOrder.get(String(right.item.categoryId)) ?? Number.MAX_SAFE_INTEGER
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
      return left.index - right.index
    })
    .map(entry => entry.item)
}

function buildOptionDraft(item) {
  if (!item?.customization) {
    return null
  }

  const groups = item.customization.optionGroups || []
  const selectedOptionIds = [...(item.customization.defaultOptionIds || [])]

  groups.forEach(group => {
    if (group.type === 'single') {
      const hasSelection = selectedOptionIds.some(optionId =>
        group.options.some(option => option.id === optionId)
      )
      if (!hasSelection && group.options[0]) {
        selectedOptionIds.push(group.options[0].id)
      }
    }
  })

  return {
    menuItemId: item.id,
    title: item.title,
    basePrice: item.customization.basePrice,
    note: item.customization.defaultNote || '',
    selectedOptionIds,
    optionGroups: groups
  }
}

export function createMenuStore() {
  return world.createStore({
    name: 'dineCoreMenuStore',
    defaultValue: {
      activeCategoryId: 'all',
      errorMessage: '',
      categories: [
        createCategory('all', '全部商品'),
        createCategory('popular', '人氣推薦'),
        createCategory('main', '主餐'),
        createCategory('drink', '飲品'),
        createCategory('seasonal', '季節限定'),
        createCategory('new', '新品上市')
      ],
      items: [],
      optionDraft: null
    },
    actions: {
      async load(store, input) {
        const tableCode = typeof input === 'string' ? input : input?.tableCode
        const orderingSessionToken =
          typeof input === 'string' ? '' : String(input?.orderingSessionToken || '')
        try {
          const payload = await loadMenuPayload(tableCode, orderingSessionToken)
          const categories = normalizeCategoriesWithAll(payload.categories)
          const items = sortItemsByCategoryPriority(payload.items.map(createItem), categories)
          store.set({
            ...store.get(),
            errorMessage: '',
            categories,
            items
          })
          return {
            categories,
            items
          }
        } catch (error) {
          store.set({
            ...store.get(),
            errorMessage: error instanceof Error ? error.message : 'MENU_LOAD_FAILED',
            items: []
          })
          throw error
        }
      },
      setActiveCategory(store, categoryId) {
        store.set({
          ...store.get(),
          activeCategoryId: categoryId
        })
      },
      openOptionDraft(store, item) {
        store.set({
          ...store.get(),
          optionDraft: buildOptionDraft(item)
        })
      },
      closeOptionDraft(store) {
        store.set({
          ...store.get(),
          optionDraft: null
        })
      },
      toggleDraftOption(store, { groupId, optionId }) {
        const current = store.get()
        const draft = current.optionDraft
        if (!draft) return

        const group = draft.optionGroups.find(entry => entry.id === groupId)
        if (!group) return

        let selectedOptionIds = [...draft.selectedOptionIds]

        if (group.type === 'single') {
          selectedOptionIds = selectedOptionIds.filter(existingId =>
            !group.options.some(option => option.id === existingId)
          )
          selectedOptionIds.push(optionId)
        } else {
          const hasOption = selectedOptionIds.includes(optionId)
          selectedOptionIds = hasOption
            ? selectedOptionIds.filter(existingId => existingId !== optionId)
            : [...selectedOptionIds, optionId]
        }

        store.set({
          ...current,
          optionDraft: {
            ...draft,
            selectedOptionIds
          }
        })
      },
      setDraftNote(store, note) {
        const current = store.get()
        if (!current.optionDraft) return

        store.set({
          ...current,
          optionDraft: {
            ...current.optionDraft,
            note
          }
        })
      }
    }
  })
}
