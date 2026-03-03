import world from '@/world.js'
import {
  addItemToCartSelection,
  changeCartItemQuantity,
  loadCartPayload,
  updateCartItemCustomization
} from './service.js'

function createDefaultEditor() {
  return null
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

function normalizeSchema(schema) {
  if (!schema) return null

  return {
    id: schema.id,
    title: schema.title,
    basePrice: Number(schema.basePrice || 0),
    defaultNote: schema.defaultNote || '',
    defaultOptionIds: Array.isArray(schema.defaultOptionIds) ? [...schema.defaultOptionIds] : [],
    optionGroups: Array.isArray(schema.optionGroups) ? schema.optionGroups.map(normalizeOptionGroup) : []
  }
}

function normalizePayload(payload) {
  return {
    carts: Array.isArray(payload.carts) ? payload.carts : [],
    cartItemsByCartId: payload.cartItemsByCartId || {},
    itemSchemasByMenuItemId: Object.fromEntries(
      Object.entries(payload.itemSchemasByMenuItemId || {}).map(([menuItemId, schema]) => [
        menuItemId,
        normalizeSchema(schema)
      ])
    )
  }
}

function buildEditorFromItem(item) {
  if (!item?.editSchema) {
    return null
  }

  return {
    cartItemId: item.id,
    menuItemId: item.menu_item_id,
    title: item.title,
    note: item.editSchema.note || '',
    selectedOptionIds: Array.isArray(item.editSchema.selectedOptionIds)
      ? [...item.editSchema.selectedOptionIds]
      : [],
    optionGroups: Array.isArray(item.editSchema.optionGroups)
      ? item.editSchema.optionGroups.map(normalizeOptionGroup)
      : [],
    basePrice: Number(item.editSchema.basePrice || 0)
  }
}

export function createCartStore() {
  return world.createStore({
    name: 'dineCoreCartStore',
    defaultValue: {
      activeCartId: 'guest-a',
      carts: [],
      cartItemsByCartId: {},
      itemSchemasByMenuItemId: {},
      editor: createDefaultEditor()
    },
    actions: {
      async load(store, tableCode) {
        const payload = normalizePayload(await loadCartPayload(tableCode))
        const current = store.get()
        const activeCartId = payload.carts.some(cart => cart.id === current.activeCartId)
          ? current.activeCartId
          : payload.carts[0]?.id || ''

        store.set({
          ...current,
          ...payload,
          activeCartId
        })
      },
      setActiveCart(store, cartId) {
        store.set({
          ...store.get(),
          activeCartId: cartId
        })
      },
      async addMenuItemToActiveCart(store, { tableCode, menuItemId, customization }) {
        const payload = normalizePayload(
          await addItemToCartSelection({
            tableCode,
            cartId: store.get().activeCartId,
            menuItemId,
            customization
          })
        )
        const current = store.get()

        store.set({
          ...current,
          ...payload
        })
      },
      async changeItemQuantity(store, { tableCode, cartId, cartItemId, delta }) {
        const payload = normalizePayload(
          await changeCartItemQuantity({
            tableCode,
            cartId,
            cartItemId,
            delta
          })
        )

        const current = store.get()
        const shouldCloseEditor =
          current.editor?.cartItemId === cartItemId &&
          !payload.cartItemsByCartId[cartId]?.some(item => item.id === cartItemId)

        store.set({
          ...current,
          ...payload,
          editor: shouldCloseEditor ? createDefaultEditor() : current.editor
        })
      },
      openEditor(store, item) {
        store.set({
          ...store.get(),
          editor: buildEditorFromItem(item)
        })
      },
      closeEditor(store) {
        store.set({
          ...store.get(),
          editor: createDefaultEditor()
        })
      },
      toggleEditorOption(store, { groupId, optionId }) {
        const current = store.get()
        const editor = current.editor
        if (!editor) return

        const group = editor.optionGroups.find(entry => entry.id === groupId)
        if (!group) return

        let selectedOptionIds = [...editor.selectedOptionIds]

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
          editor: {
            ...editor,
            selectedOptionIds
          }
        })
      },
      setEditorNote(store, note) {
        const current = store.get()
        if (!current.editor) return

        store.set({
          ...current,
          editor: {
            ...current.editor,
            note
          }
        })
      },
      async saveEditor(store, { tableCode }) {
        const current = store.get()
        const editor = current.editor
        if (!editor) return

        const payload = normalizePayload(
          await updateCartItemCustomization({
            tableCode,
            cartId: current.activeCartId,
            cartItemId: editor.cartItemId,
            customization: {
              note: editor.note,
              selectedOptionIds: editor.selectedOptionIds
            }
          })
        )

        store.set({
          ...current,
          ...payload,
          editor: createDefaultEditor()
        })
      }
    }
  })
}
