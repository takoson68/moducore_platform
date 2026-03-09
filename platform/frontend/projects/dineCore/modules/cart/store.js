import world from '@/world.js'
import {
  buildCheckoutSummaryFromLocalCart,
  clearLocalCartPayload,
  createEmptyLocalCart,
  createLocalCartItemId,
  loadLocalCartPayload,
  normalizeLocalCartPayload,
  persistLocalCartPayload
} from './localCart.js'

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

function buildItemFromSchema({ schema, menuItemId, cartId, customization }) {
  const selectedOptionIds = Array.isArray(customization?.selectedOptionIds)
    ? [...customization.selectedOptionIds]
    : [...(schema.defaultOptionIds || [])]
  const selectedOptions = (schema.optionGroups || []).flatMap(group =>
    (group.options || []).filter(option => selectedOptionIds.includes(option.id))
  )
  const extraPrice = selectedOptions.reduce(
    (sum, option) => sum + Number(option.priceDelta || 0),
    0
  )

  return {
    id: createLocalCartItemId(),
    menu_item_id: menuItemId,
    title: schema.title,
    quantity: 1,
    price: Number(schema.basePrice || 0) + extraPrice,
    note: String(customization?.note || schema.defaultNote || ''),
    options: selectedOptions.map(option => option.label),
    selected_option_ids: selectedOptionIds,
    cart_id: cartId,
    editSchema: {
      ...schema,
      note: String(customization?.note || schema.defaultNote || ''),
      selectedOptionIds
    }
  }
}

function patchStateWithPayload(state, payload) {
  const nextItemSchemas =
    payload.itemSchemasByMenuItemId &&
    Object.keys(payload.itemSchemasByMenuItemId).length > 0
      ? payload.itemSchemasByMenuItemId
      : state.itemSchemasByMenuItemId

  return {
    ...state,
    orderingSessionToken: payload.orderingSessionToken || state.orderingSessionToken,
    errorMessage: '',
    orderingCartId: payload.orderingCartId || state.orderingCartId,
    orderingLabel: payload.orderingLabel || state.orderingLabel,
    personSlot: Number(payload.personSlot || state.personSlot || 0),
    currentBatchId: payload.currentBatchId || state.currentBatchId,
    currentBatchNo: Number(payload.currentBatchNo || state.currentBatchNo || 0),
    currentBatchStatus: payload.currentBatchStatus || state.currentBatchStatus,
    participantCount: Number(payload.participantCount || 0),
    viewingCartId: payload.orderingCartId || state.viewingCartId,
    carts: Array.isArray(payload.carts) ? payload.carts : [],
    cartItemsByCartId: payload.cartItemsByCartId || {},
    itemSchemasByMenuItemId: nextItemSchemas
  }
}

export function createCartStore() {
  return world.createStore({
    name: 'dineCoreCartStore',
    defaultValue: {
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
      load(store, input) {
        const tableCode = typeof input === 'string' ? input : input?.tableCode
        const orderingSessionToken =
          typeof input === 'string' ? '' : String(input?.orderingSessionToken || '')
        const payload = loadLocalCartPayload({
          tableCode,
          orderingSessionToken,
          fallback: createEmptyLocalCart({
            orderingSessionToken,
            orderingCartId: input?.orderingCartId || '',
            orderingLabel: input?.orderingLabel || '',
            personSlot: input?.personSlot || 0
          })
        })

        store.set(patchStateWithPayload(store.get(), payload))
      },
      loadFromEntry(store, input = {}) {
        const current = store.get()
        const next = normalizeLocalCartPayload(
          loadLocalCartPayload({
            tableCode: input.tableCode,
            orderingSessionToken: input.orderingSessionToken,
            fallback: createEmptyLocalCart({
              orderingSessionToken: input.orderingSessionToken,
              orderingCartId: input.orderingCartId,
              orderingLabel: input.orderingLabel,
              personSlot: input.personSlot
            })
          }),
          createEmptyLocalCart({
            orderingSessionToken: input.orderingSessionToken,
            orderingCartId: input.orderingCartId,
            orderingLabel: input.orderingLabel,
            personSlot: input.personSlot,
            itemSchemasByMenuItemId: current.itemSchemasByMenuItemId
          })
        )

        store.set(patchStateWithPayload(current, next))
      },
      setItemSchemas(store, itemSchemasByMenuItemId = {}) {
        const state = store.get()
        store.set({
          ...state,
          itemSchemasByMenuItemId: Object.fromEntries(
            Object.entries(itemSchemasByMenuItemId).map(([menuItemId, schema]) => [
              menuItemId,
              normalizeSchema(schema)
            ])
          )
        })
      },
      persist(store, { tableCode } = {}) {
        const state = store.get()
        if (!tableCode || !state.orderingSessionToken) return

        persistLocalCartPayload({
          tableCode,
          orderingSessionToken: state.orderingSessionToken,
          payload: {
            ...state,
            editor: null
          }
        })
      },
      setViewingCart(store, cartId) {
        store.set({
          ...store.get(),
          viewingCartId: cartId
        })
      },
      addMenuItemToOrderingCart(store, { tableCode, menuItemId, customization }) {
        const state = store.get()
        const cartId = state.orderingCartId || ''
        const schema = normalizeSchema(state.itemSchemasByMenuItemId[menuItemId])
        if (!cartId || !schema) {
          return
        }

        const nextItems = [
          ...(state.cartItemsByCartId[cartId] || []),
          buildItemFromSchema({
            schema,
            menuItemId,
            cartId,
            customization
          })
        ]

        const payload = normalizeLocalCartPayload({
          ...state,
          cartItemsByCartId: {
            [cartId]: nextItems
          }
        })

        store.set(patchStateWithPayload(state, payload))
        store.persist({ tableCode })
      },
      async addMenuItemToActiveCart(store, payload) {
        store.addMenuItemToOrderingCart(payload)
      },
      changeItemQuantity(store, { tableCode, cartId, cartItemId, delta }) {
        const state = store.get()
        const currentItems = Array.isArray(state.cartItemsByCartId[cartId])
          ? [...state.cartItemsByCartId[cartId]]
          : []
        const nextItems = currentItems
          .map(item => {
            if (item.id !== cartItemId) return item
            return {
              ...item,
              quantity: Number(item.quantity || 0) + Number(delta || 0)
            }
          })
          .filter(item => Number(item.quantity || 0) > 0)

        const payload = normalizeLocalCartPayload({
          ...state,
          cartItemsByCartId: {
            [cartId]: nextItems
          }
        })

        const shouldCloseEditor =
          state.editor?.cartItemId === cartItemId &&
          !nextItems.some(item => item.id === cartItemId)

        store.set({
          ...patchStateWithPayload(state, payload),
          editor: shouldCloseEditor ? createDefaultEditor() : state.editor
        })
        store.persist({ tableCode })
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
        const state = store.get()
        const editor = state.editor
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
          selectedOptionIds = selectedOptionIds.includes(optionId)
            ? selectedOptionIds.filter(existingId => existingId !== optionId)
            : [...selectedOptionIds, optionId]
        }

        store.set({
          ...state,
          editor: {
            ...editor,
            selectedOptionIds
          }
        })
      },
      setEditorNote(store, note) {
        const state = store.get()
        if (!state.editor) return

        store.set({
          ...state,
          editor: {
            ...state.editor,
            note
          }
        })
      },
      saveEditor(store, { tableCode }) {
        const state = store.get()
        const editor = state.editor
        if (!editor) return

        const cartId = editor.cartId || state.orderingCartId
        const currentItems = Array.isArray(state.cartItemsByCartId[cartId])
          ? [...state.cartItemsByCartId[cartId]]
          : []
        const nextItems = currentItems.map(item => {
          if (item.id !== editor.cartItemId) return item

          const selectedOptions = editor.optionGroups.flatMap(group =>
            group.options.filter(option => editor.selectedOptionIds.includes(option.id))
          )
          const extraPrice = selectedOptions.reduce(
            (sum, option) => sum + Number(option.priceDelta || 0),
            0
          )

          return {
            ...item,
            note: editor.note,
            selected_option_ids: [...editor.selectedOptionIds],
            options: selectedOptions.map(option => option.label),
            price: Number(editor.basePrice || 0) + extraPrice,
            editSchema: {
              ...item.editSchema,
              note: editor.note,
              selectedOptionIds: [...editor.selectedOptionIds]
            }
          }
        })

        const payload = normalizeLocalCartPayload({
          ...state,
          cartItemsByCartId: {
            [cartId]: nextItems
          }
        })

        store.set({
          ...patchStateWithPayload(state, payload),
          editor: createDefaultEditor()
        })
        store.persist({ tableCode })
      },
      getCheckoutSummary(store) {
        return buildCheckoutSummaryFromLocalCart(store.get())
      },
      clearForSubmittedOrder(store, { tableCode, orderingSessionToken, nextBatchId = '', nextBatchNo = 0 } = {}) {
        const state = store.get()
        const empty = normalizeLocalCartPayload(
          createEmptyLocalCart({
            orderingSessionToken: orderingSessionToken || state.orderingSessionToken,
            orderingCartId: state.orderingCartId,
            orderingLabel: state.orderingLabel,
            personSlot: state.personSlot
          }),
          {
            orderingSessionToken: orderingSessionToken || state.orderingSessionToken,
            orderingCartId: state.orderingCartId,
            orderingLabel: state.orderingLabel,
            personSlot: state.personSlot,
            currentBatchId: nextBatchId,
            currentBatchNo: nextBatchNo,
            currentBatchStatus: 'draft',
            itemSchemasByMenuItemId: state.itemSchemasByMenuItemId
          }
        )

        clearLocalCartPayload({
          tableCode,
          orderingSessionToken: orderingSessionToken || state.orderingSessionToken
        })

        store.set({
          ...patchStateWithPayload(state, empty),
          currentBatchId: String(nextBatchId || ''),
          currentBatchNo: Number(nextBatchNo || 0),
          currentBatchStatus: 'draft',
          editor: createDefaultEditor()
        })
      }
    }
  })
}
