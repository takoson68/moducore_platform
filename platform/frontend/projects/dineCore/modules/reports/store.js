import world from '@/world.js'
import { loadReportsSnapshot } from './service.js'

function createDefaultState() {
  return {
    filters: {
      dateFrom: '',
      dateTo: '',
      status: 'all',
      paymentStatus: 'all',
      paymentMethod: 'all',
      keyword: ''
    },
    loading: false,
    error: '',
    summary: {
      businessDate: '',
      grossSales: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      orderCount: 0,
      completedOrderCount: 0,
      cancelledOrderCount: 0,
      averageOrderValue: 0
    },
    statusBreakdown: {
      pending: 0,
      preparing: 0,
      ready: 0,
      picked_up: 0,
      cancelled: 0
    },
    paymentBreakdown: {
      cash: 0,
      counter_card: 0,
      other: 0,
      unpaid: 0
    },
    topItems: [],
    orderRows: [],
    lastLoadedAt: ''
  }
}

export function createReportsStore() {
  return world.createStore({
    name: 'dineCoreReportsStore',
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
          const snapshot = await loadReportsSnapshot(state.filters)
          store.set({
            ...store.get(),
            loading: false,
            error: '',
            summary: snapshot.summary,
            statusBreakdown: snapshot.statusBreakdown,
            paymentBreakdown: snapshot.paymentBreakdown,
            topItems: snapshot.topItems,
            orderRows: snapshot.orderRows,
            lastLoadedAt: new Date().toISOString()
          })
        } catch (error) {
          store.set({
            ...store.get(),
            loading: false,
            error: error instanceof Error ? error.message : '營運報表資料載入失敗。'
          })
        }
      },
      setFilters(store, patch = {}) {
        const state = store.get()
        store.set({
          ...state,
          filters: {
            ...state.filters,
            ...patch
          }
        })
      },
      resetFilters(store) {
        const state = store.get()
        store.set({
          ...state,
          filters: createDefaultState().filters
        })
      }
    }
  })
}
