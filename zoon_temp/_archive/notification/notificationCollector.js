import { container } from '@/container/container.js'
import { createNotificationStore } from './store/createNotificationStore.js'

// 確保 store 已註冊
if (!container.has('notificationStore')) {
  container.register('notificationStore', createNotificationStore)
}

const store = container.resolve('notificationStore')

// 可擴充 mapping 表
const mapping = {
  'task.created': payload => ({
    type: 'task',
    title: '新增任務',
    content: `任務「${payload?.title || '未命名'}」已建立`
  }),
  'task.completed': payload => ({
    type: 'task',
    title: '任務完成',
    content: `任務「${payload?.title || '未命名'}」標記為完成`
  }),
  'member.added': payload => ({
    type: 'member',
    title: '新增用戶',
    content: `新增用戶「${payload?.name || '未命名'}」`
  }),
  'booking.completed': payload => ({
    type: 'booking',
    title: '預約完成',
    content: '預約已建立'
  }),
  'ads.push': payload => ({
    type: 'ads',
    title: '行銷推播',
    content: payload?.content || '行銷訊息'
  }),
  'system.info': payload => ({
    type: 'system',
    title: payload?.title || '系統訊息',
    content: payload?.content || '系統事件'
  })
}

function toNotification(eventType, payload) {
  const builder = mapping[eventType]
  if (builder) return builder(payload)
  return {
    type: 'system',
    title: eventType,
    content: typeof payload === 'string' ? payload : JSON.stringify(payload || {})
  }
}

export function collect(eventType, payload) {
  const notification = toNotification(eventType, payload)
  store.addNotification(notification)
}
