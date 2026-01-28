// src/modules/task/api/mockTasks.js

export const mockTasks = [
  {
    id: 1,
    title: '新增預約後要寫入資料庫',
    desc: '後端 API 需要補齊相關欄位',
    status: 'todo',
    priority: 'medium',
    due_date: '2025-12-12',
    members: ['cody', 'esther'],
    messages: [
      { user: 'esther', text: '我先補 API，你晚點串接', created_at: '2025-12-07 12:31' }
    ]
  },
  {
    id: 2,
    title: '調整報表匯出格式',
    desc: '新增 XLSX 並優化欄位順序',
    status: 'doing',
    priority: 'high',
    due_date: '2025-12-05',
    members: ['robin', 'cody'],
    messages: [
      { user: 'cody', text: '欄位定義已確認，等你上 PR', created_at: '2025-12-06 09:10' }
    ]
  },
  {
    id: 3,
    title: '客服腳本更新',
    desc: '同步最新 FAQ 並重新上傳音檔',
    status: 'done',
    priority: 'low',
    due_date: '2025-12-03',
    members: ['esther'],
    messages: [
      { user: 'esther', text: '已完成，請 QA 回測', created_at: '2025-12-04 16:00' }
    ]
  }
]
