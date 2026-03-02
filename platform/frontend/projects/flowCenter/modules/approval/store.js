import world from '@/world.js'
import { fetchApprovalRecords, submitApprovalDecision } from './service.js'

function canAccess() {
  return world.store('auth').state.user?.role === 'manager'
}

function createDefaultDecisionForm() {
  return {
    decision: 'approve',
    comment: ''
  }
}

export function createApprovalStore() {
  return world.createStore({
    name: 'flowCenterApprovalStore',
    defaultValue: {
      loading: false,
      saving: false,
      error: '',
      records: [],
      selectedId: null,
      activeFilter: 'all',
      decisionForm: createDefaultDecisionForm()
    },
    actions: {
      reset(store) {
        store.set({
          ...store.get(),
          loading: false,
          saving: false,
          error: '',
          records: [],
          selectedId: null,
          activeFilter: 'all',
          decisionForm: createDefaultDecisionForm()
        })
      },
      selectRecord(store, id) {
        store.set({
          ...store.get(),
          selectedId: id
        })
      },
      setFilter(store, value) {
        store.set({
          ...store.get(),
          activeFilter: value
        })
      },
      updateDecisionForm(store, patch = {}) {
        const state = store.get()
        store.set({
          ...state,
          decisionForm: {
            ...state.decisionForm,
            ...patch
          }
        })
      },
      clearDecisionForm(store) {
        store.set({
          ...store.get(),
          decisionForm: createDefaultDecisionForm()
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
          const records = await fetchApprovalRecords()
          store.set({
            ...store.get(),
            loading: false,
            records,
            selectedId: records[0]?.source_id || null
          })
        } catch (error) {
          store.set({
            ...store.get(),
            loading: false,
            records: [],
            selectedId: null,
            error: error.message
          })
        }
      },
      async submitDecision(store) {
        const state = store.get()
        const selectedRecord = state.records.find((item) => item.source_id === state.selectedId)
        if (state.saving || !canAccess() || !selectedRecord) return

        store.set({
          ...state,
          saving: true,
          error: ''
        })

        try {
          await submitApprovalDecision({
            source_type: selectedRecord.source_type,
            source_id: selectedRecord.source_id,
            decision: state.decisionForm.decision,
            comment: state.decisionForm.comment
          })
          store.clearDecisionForm()
          await store.load()
        } catch (error) {
          store.set({
            ...store.get(),
            saving: false,
            error: error.message
          })
          return
        }

        store.set({
          ...store.get(),
          saving: false
        })
      }
    }
  })
}
