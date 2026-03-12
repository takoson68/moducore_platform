import world from '@/world.js'
import { loadDashboardSummary } from './service.js'

export function createDashboardStore() {
  return world.createStore({
    name: 'dineCoreDashboardStore',
    defaultValue: {
      loading: false,
      error: '',
      businessDate: '',
      dailyOrderCount: 0,
      dailyRevenueTotal: 0,
      dailyOrderGrossTotal: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      completedOrderCount: 0,
      cancelledOrderCount: 0,
      averageOrderValue: 0,
      orderStatusBreakdown: {
        pending: 0,
        preparing: 0,
        ready: 0,
        picked_up: 0,
        cancelled: 0
      },
      paymentMethodBreakdown: {
        cash: 0,
        counter_card: 0,
        other: 0,
        unpaid: 0
      },
      batchSnapshot: {
        activeBatchCount: 0,
        submittedCount: 0,
        preparingCount: 0,
        readyCount: 0,
        draftOrderCount: 0,
        unpaidOrderCount: 0
      },
      warnings: [],
      topSellingItems: [],
      recentOrders: []
    },
    actions: {
      async load(store) {
        const state = store.get()
        store.set({
          ...state,
          loading: true,
          error: '',
          warnings: []
        })

        try {
          const summary = await loadDashboardSummary()
          store.set({
            ...store.get(),
            loading: false,
            error: '',
            ...summary
          })
        } catch (error) {
          store.set({
            ...store.get(),
            loading: false,
            error: error instanceof Error ? error.message : '營運總覽資料載入失敗。'
          })
        }
      }
    }
  })
}
