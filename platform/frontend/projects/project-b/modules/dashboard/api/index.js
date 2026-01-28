// modules/dashboard/api/index.js
// 專用資料查詢（可改成實際 API 呼叫）

export async function fetchDashboardOverview() {
  // TODO: 替換為後端 API
  return Promise.resolve({
    stats: { tasks: 0, employees: 0, votes: 0 },
    activities: [],
  });
}
