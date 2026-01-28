// modules/dashboard/store.js
export function createStore() {
  return {
    state: {
      stats: {
        tasks: 0,
        employees: 0,
        votes: 0,
      },
      recentActivities: [],
    },
    setStats(next) {
      this.state.stats = { ...this.state.stats, ...next };
    },
    setActivities(list) {
      this.state.recentActivities = Array.isArray(list) ? list : [];
    },
  };
}
