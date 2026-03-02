export default {
  name: 'flowCenter',
  title: 'Flow Center',
  tenant_id: 'flowCenter',
  modules: ['dashboard', 'leave', 'purchase', 'announcement', 'task', 'approval'],
  description: '企業內部流程中心平台，整合請假、採購、公告、任務與主管審核。',
  scenario: '已完成專案殼層，現階段聚焦模組資料對接、角色隔離與審核流程整合。',
  skills: ['routing', 'module-installation'],
  constraints: [
    '不得修改 platform/frontend/src/app/**，除非最小變更提案已獲確認。',
    '模組資料需求必須優先落在模組自己的 API 邊界，不得回推共享層。',
    '共享層只承載跨 project 的共用 transport，不承載單一模組資料語意。'
  ]
}
