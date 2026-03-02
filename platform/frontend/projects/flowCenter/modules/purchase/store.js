import world from '@/world.js'
import { createPurchaseRecord, fetchPurchaseRecords, updatePurchaseRecord } from './service.js'

const statusLabelMap = {
  draft: '草稿',
  submitted: '送出待審',
  approved: '已核准',
  rejected: '已退回'
}

function currentUser() {
  return world.store('auth').state.user
}

function canAccess() {
  const user = currentUser()
  return Boolean(user) && user.role === 'employee' && user.company_id !== 'company-b'
}

function createDefaultForm() {
  return {
    itemName: '',
    amount: 12000,
    purpose: '',
    vendor: ''
  }
}

function normalizeRecord(record) {
  return {
    ...record,
    statusLabel: statusLabelMap[record.status] || record.status
  }
}

function createFormFromRecord(record) {
  return {
    itemName: record?.item_name || '',
    amount: Number(record?.amount || 0),
    purpose: record?.purpose || '',
    vendor: record?.vendor_name || ''
  }
}

function isEditableRecord(record) {
  return ['draft', 'submitted'].includes(record?.status || '')
}

export function createPurchaseStore() {
  return world.createStore({
    name: 'flowCenterPurchaseStore',
    defaultValue: {
      loading: false,
      submitting: false,
      error: '',
      records: [],
      selectedId: null,
      editingId: null,
      form: createDefaultForm()
    },
    actions: {
      reset(store) {
        store.set({
          ...store.get(),
          loading: false,
          submitting: false,
          error: '',
          records: [],
          selectedId: null,
          editingId: null,
          form: createDefaultForm()
        })
      },
      selectRecord(store, id) {
        const state = store.get()
        const record = state.records.find((item) => item.id === id) || null
        store.set({
          ...state,
          selectedId: id,
          editingId: isEditableRecord(record) ? record.id : null,
          form: record && isEditableRecord(record) ? createFormFromRecord(record) : state.form
        })
      },
      updateForm(store, patch = {}) {
        const state = store.get()
        store.set({
          ...state,
          form: {
            ...state.form,
            ...patch
          }
        })
      },
      clearForm(store) {
        const state = store.get()
        store.set({
          ...state,
          editingId: null,
          form: createDefaultForm()
        })
      },
      async load(store) {
        if (!canAccess()) {
          store.reset()
          return
        }

        store.set({
          ...store.get(),
          loading: true,
          error: ''
        })

        try {
          const records = (await fetchPurchaseRecords()).map(normalizeRecord)
          store.set({
            ...store.get(),
            loading: false,
            records,
            selectedId: records[0]?.id || null,
            editingId: null
          })
        } catch (error) {
          store.set({
            ...store.get(),
            loading: false,
            records: [],
            selectedId: null,
            editingId: null,
            error: error.message
          })
        }
      },
      async submit(store, status) {
        const state = store.get()
        if (state.submitting || !canAccess()) return

        store.set({
          ...state,
          submitting: true,
          error: ''
        })

        try {
          const payload = {
            item_name: state.form.itemName,
            amount: Number(state.form.amount),
            purpose: state.form.purpose,
            vendor_name: state.form.vendor,
            status
          }

          if (state.editingId) {
            await updatePurchaseRecord(state.editingId, payload)
          } else {
            await createPurchaseRecord(payload)
          }
          store.clearForm()
          await store.load()
        } catch (error) {
          store.set({
            ...store.get(),
            submitting: false,
            error: error.message
          })
          return
        }

        store.set({
          ...store.get(),
          submitting: false
        })
      }
    }
  })
}
