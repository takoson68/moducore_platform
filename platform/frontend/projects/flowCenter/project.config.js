export default {
  name: 'flowCenter',
  title: 'Flow Center',
  tenant_id: 'flowCenter',
  modules: ['dashboard', 'leave', 'purchase', 'announcement', 'task', 'approval'],
  description: '企業內部流程中心平台，整合請假、採購、公告、任務與主管審核。',
  scenario: '先建立可載入與可渲染的專案殼層，再依規劃 Phase 逐步推進。',
  skills: ['routing', 'module-installation'],
  constraints: [
    '不得修改 platform/frontend/src/app/**，除非最小變更提案已獲確認。',
    '目前階段只建立靜態介面，不實作業務邏輯。'
  ]
}
