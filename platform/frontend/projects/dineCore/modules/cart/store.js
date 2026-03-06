import world from '@/world.js'
import {
  addItemToCartSelection,
  changeCartItemQuantity,
  loadCartPayload,
  mapCartError,
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
    orderingSessionToken: payload.orderingSessionToken || '',
    orderingCartId: payload.orderingCartId || '',
    orderingLabel: payload.orderingLabel || '',
    personSlot: Number(payload.personSlot || 0),
    currentBatchId: payload.currentBatchId || '',
    currentBatchNo: Number(payload.currentBatchNo || 0),
    currentBatchStatus: payload.currentBatchStatus || '',
    participantCount: Number(payload.participantCount || 0),
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
    cartId: item.cart_id || '',
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
      // orderingCartId 代表這支手機目前加點要送進哪個 cart；
      // viewingCartId 只控制購物車頁現在在看哪個 cart。
      orderingSessionToken: '',
      errorMessage: '',
      orderingCartId: '',
      orderingLabel: '',
      personSlot: 0,
      currentBatchId: '',
      currentBatchNo: 0,
      currentBatchStatus: '',
      participantCount: 0,
      viewingCartId: '',
      carts: [],
      cartItemsByCartId: {},
      itemSchemasByMenuItemId: {},
      editor: createDefaultEditor()
    },
    actions: {
      async load(store, input) {
        const tableCode = typeof input === 'string' ? input : input?.tableCode
        const orderingSessionToken =
          typeof input === 'string' ? '' : String(input?.orderingSessionToken || '')
        const current = store.get()
        try {
        const payload = normalizePayload(
            await loadCartPayload(tableCode, orderingSessionToken)
          )
        const batchChanged =
          current.currentBatchId &&
          payload.currentBatchId &&
          current.currentBatchId !== payload.currentBatchId
        const availableCartIds = payload.carts.map(cart => cart.id)
        const orderingCartId = availableCartIds.includes(payload.orderingCartId)
          ? payload.orderingCartId
          : payload.carts[0]?.id || ''
        const viewingCartId = orderingCartId

        store.set({
          ...current,
          ...payload,
          errorMessage: '',
          orderingSessionToken: payload.orderingSessionToken || current.orderingSessionToken,
          orderingCartId,
          viewingCartId,
          editor: batchChanged ? createDefaultEditor() : current.editor
        })
        } catch (error) {
          store.set({
            ...current,
            errorMessage: mapCartError(error)
          })
        }
      },
      setViewingCart(store, cartId) {
        store.set({
          ...store.get(),
          viewingCartId: cartId
        })
      },
      async addMenuItemToOrderingCart(store, { tableCode, menuItemId, customization }) {
        const current = store.get()
        const targetCartId = current.orderingCartId || current.viewingCartId
        if (!targetCartId) return

        const payload = normalizePayload(
          await addItemToCartSelection({
            tableCode,
            cartId: targetCartId,
            menuItemId,
            customization,
            orderingSessionToken: current.orderingSessionToken
          })
        )

        store.set({
          ...current,
          ...payload,
          errorMessage: '',
          orderingSessionToken: payload.orderingSessionToken || current.orderingSessionToken,
          orderingCartId: payload.orderingCartId || current.orderingCartId,
          viewingCartId: current.viewingCartId || payload.orderingCartId || current.orderingCartId
        })
      },
      async addMenuItemToActiveCart(store, payload) {
        await store.addMenuItemToOrderingCart(payload)
      },
      async changeItemQuantity(store, { tableCode, cartId, cartItemId, delta }) {
        const current = store.get()
        try {
          const payload = normalizePayload(
            await changeCartItemQuantity({
              tableCode,
              cartId,
              cartItemId,
              delta,
              orderingSessionToken: current.orderingSessionToken
            })
          )
        const shouldCloseEditor =
          current.editor?.cartItemId === cartItemId &&
          !payload.cartItemsByCartId[cartId]?.some(item => item.id === cartItemId)

        store.set({
          ...current,
          ...payload,
          errorMessage: '',
          editor: shouldCloseEditor ? createDefaultEditor() : current.editor
        })
        } catch (error) {
          store.set({
            ...current,
            errorMessage: mapCartError(error)
          })
        }
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

        try {
          const payload = normalizePayload(
            await updateCartItemCustomization({
              tableCode,
              cartId: editor.cartId || current.viewingCartId,
              cartItemId: editor.cartItemId,
              customization: {
                note: editor.note,
                selectedOptionIds: editor.selectedOptionIds
              },
              orderingSessionToken: current.orderingSessionToken
            })
          )

        store.set({
          ...current,
          ...payload,
          errorMessage: '',
          editor: createDefaultEditor()
        })
        } catch (error) {
          store.set({
            ...current,
            errorMessage: mapCartError(error)
          })
        }
      }
    }
  })
}
