// modules/task/api/mockTasks.js

export const mockTasks = [
  {
    id: 1,
    title: "登入後寫入資料庫--我是mock",
    desc: "後端 API 完成後需與前端串接資料流程。",
    status: "todo",
    publisher: "esther",
    assignee: "cody", // ✳️ 單一負責人
    priority: "medium",
    due_date: "2025-12-12",
    members: ["esther"],

    events: [
      {
        type: "system",
        user: "系統",
        text: "任務建立，指派給 cody",
        created_at: "2025-12-07 12:00",
      },
      {
        type: "note",
        user: "esther",
        text: "我先補上 API，完成後再串接。",
        created_at: "2025-12-07 12:31",
      },
    ],
  },

  {
    id: 2,
    title: "調整報表欄位輸出",
    desc: "匯出 XLSX 並優化欄位排序，讓營運好讀。",
    status: "doing",
    publisher: "robin",
    assignee: "cody", // ✳️ 負責人
    priority: "high",
    due_date: "2025-12-05",
    members: ["robin"],

    events: [
      {
        type: "system",
        user: "系統",
        text: "任務建立，指派給 cody",
        created_at: "2025-12-05 08:50",
      },
      {
        type: "system",
        user: "系統",
        text: "狀態變更：待處理 → 進行中",
        created_at: "2025-12-05 09:00",
      },
      {
        type: "note",
        user: "cody",
        text: "欄位定義已確認，完成後會送 PR。",
        created_at: "2025-12-06 09:10",
      },
    ],
  },

  {
    id: 3,
    title: "客服腳本更新",
    desc: "同步 FAQ 並錄製新的語音檔，讓客服照稿回覆。",
    status: "done",
    publisher: "esther",
    assignee: "esther", // ✳️ 負責人就是本人
    priority: "low",
    due_date: "2025-12-03",
    members: [],

    events: [
      {
        type: "system",
        user: "系統",
        text: "任務建立，指派給 esther",
        created_at: "2025-12-02 10:00",
      },
      {
        type: "system",
        user: "系統",
        text: "狀態變更：進行中 → 已完成",
        created_at: "2025-12-04 15:55",
      },
      {
        type: "note",
        user: "esther",
        text: "已完成，請 QA 幫忙驗收。",
        created_at: "2025-12-04 16:00",
      },
    ],
  },
];
