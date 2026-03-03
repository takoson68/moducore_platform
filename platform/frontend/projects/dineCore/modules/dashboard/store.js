import world from '@/world.js'
import { loadDashboardSummary } from './service.js'

export function createDashboardStore() {
  return world.createStore({
    name: 'dineCoreDashboardStore',
    defaultValue: {
      dailyOrderCount: 0,
      dailyRevenueTotal: 0,
      orderStatusBreakdown: {
        pending: 0,
        preparing: 0,
        ready: 0,
        picked_up: 0,
        cancelled: 0
      },
      paymentStatusBreakdown: {
        unpaid: 0,
        paid: 0
      },
      topSellingItems: []
    },
    actions: {
      async load(store) {
        const summary = await loadDashboardSummary()
        store.set({
          ...store.get(),
          dailyOrderCount: summary.dailyOrderCount,
          dailyRevenueTotal: summary.dailyRevenueTotal,
          orderStatusBreakdown: summary.orderStatusBreakdown,
          paymentStatusBreakdown: summary.paymentStatusBreakdown,
          topSellingItems: summary.topSellingItems
        })
      },
      setSummary(store, payload = {}) {
        const state = store.get()
        store.set({
          ...state,
          dailyOrderCount: payload.dailyOrderCount ?? state.dailyOrderCount,
          dailyRevenueTotal: payload.dailyRevenueTotal ?? state.dailyRevenueTotal,
          orderStatusBreakdown: payload.orderStatusBreakdown || state.orderStatusBreakdown,
          paymentStatusBreakdown: payload.paymentStatusBreakdown || state.paymentStatusBreakdown,
          topSellingItems: Array.isArray(payload.topSellingItems)
            ? payload.topSellingItems
            : state.topSellingItems
        })
      }
    }
  })
}
