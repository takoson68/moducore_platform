// src/modules/notification/api/mockNotifications.js

export const mockNotifications = [
  {
    id: "ntf-1",
    type: "system",
    title: "系統更新",
    content: "今天 23:00 將進行短暫維護",
    created_at: Date.now() - 1000 * 60 * 30,
    read: false,
  },
  {
    id: "ntf-2",
    type: "task",
    title: "任務進度",
    content: "「客戶關鍵回報」已完成，請 QA 測試",
    created_at: Date.now() - 1000 * 60 * 90,
    read: true,
  },
];
