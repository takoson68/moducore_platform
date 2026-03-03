import world from '@/world.js'
import { loadMenuPayload } from './service.js'

function createCategory(id, name) {
  return { id, name }
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
      activeCategoryId: 'popular',
      categories: [
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
        const payload = await loadMenuPayload(tableCode, orderingSessionToken)
        store.set({
          ...store.get(),
          categories: payload.categories.map(category => createCategory(category.id, category.name)),
          items: payload.items.map(createItem)
        })
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
