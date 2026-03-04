import world from '@/world.js'
import {
  loadAuditCloseSnapshot,
  submitAuditClose,
  submitAuditUnlock
} from './service.js'

function todayText() {
  return new Date().toISOString().slice(0, 10)
}

function createDefaultState() {
  return {
    selectedDate: todayText(),
    loading: false,
    error: '',
    closeActionLoading: false,
    unlockActionLoading: false,
    closingSummary: {
      businessDate: '',
      grossSales: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      orderCount: 0,
      unfinishedOrderCount: 0,
      closeStatus: 'open',
      closedAt: '',
      closedBy: ''
    },
    blockingIssues: [],
    closeHistory: [],
    lockState: {
      businessDate: '',
      isLocked: false,
      lockedScopes: []
    },
    lastLoadedAt: ''
  }
}

export function createAuditCloseStore() {
  return world.createStore({
    name: 'dineCoreAuditCloseStore',
    defaultValue: createDefaultState(),
    actions: {
      async load(store) {
        const state = store.get()
        store.set({
          ...state,
          loading: true,
          error: ''
        })

        try {
          const snapshot = await loadAuditCloseSnapshot(state.selectedDate)
          store.set({
            ...store.get(),
            loading: false,
            error: '',
            closingSummary: snapshot.closingSummary,
            blockingIssues: snapshot.blockingIssues,
            closeHistory: snapshot.closeHistory,
            lockState: snapshot.lockState,
            lastLoadedAt: new Date().toISOString()
          })
        } catch (error) {
          store.set({
            ...store.get(),
            loading: false,
            error: error instanceof Error ? error.message : 'AUDIT_CLOSE_LOAD_FAILED'
          })
        }
      },
      setSelectedDate(store, selectedDate) {
        store.set({
          ...store.get(),
          selectedDate
        })
      },
      async close(store, payload = {}) {
        const state = store.get()
        store.set({
          ...state,
          closeActionLoading: true,
          error: ''
        })

        try {
          await submitAuditClose({
            businessDate: state.selectedDate,
            reason: payload.reason || '',
            reasonType: payload.reasonType || 'daily_close'
          })
          store.set({
            ...store.get(),
            closeActionLoading: false
          })
          await store.load()
        } catch (error) {
          store.set({
            ...store.get(),
            closeActionLoading: false,
            error: error instanceof Error ? error.message : 'AUDIT_CLOSE_SUBMIT_FAILED'
          })
        }
      },
      async unlock(store, payload = {}) {
        const state = store.get()
        store.set({
          ...state,
          unlockActionLoading: true,
          error: ''
        })

        try {
          await submitAuditUnlock({
            businessDate: state.selectedDate,
            reason: payload.reason || '',
            reasonType: payload.reasonType || 'correction'
          })
          store.set({
            ...store.get(),
            unlockActionLoading: false
          })
          await store.load()
        } catch (error) {
          store.set({
            ...store.get(),
            unlockActionLoading: false,
            error: error instanceof Error ? error.message : 'AUDIT_CLOSE_UNLOCK_FAILED'
          })
        }
      }
    }
  })
}
