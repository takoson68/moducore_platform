// src/modules/notification/api/mockNotifications.js

export const mockNotifications = [
  {
    id: 'ntf-1',
    type: 'system',
    title: '系統更新',
    content: '今晚 23:00 進行短暫維護',
    created_at: Date.now() - 1000 * 60 * 30,
    read: false
  },
  {
    id: 'ntf-2',
    type: 'task',
    title: '任務提醒',
    content: '「客服腳本更新」已完成，請 QA 回測',
    created_at: Date.now() - 1000 * 60 * 90,
    read: true
  }
]
