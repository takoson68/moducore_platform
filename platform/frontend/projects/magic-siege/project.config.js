export default {
  name: 'magic-siege',
  title: '攻破魔法城',
  tenant_id: 'magic-siege',
  modules: ['battlefield'],
  description: '以復刻成熟格子塔防核心體驗為學習目標的幾何原型遊戲。',
  scenario: '玩家在固定格子地圖建造、升級與拆除砲塔，完成共十波的基地防守。',
  capabilities: ['game-runtime', 'p5-rendering', 'tower-defense', 'platform-chat'],
  chat: {
    enabled: true,
    endpoint: 'wss://moducore-chat-poc-staging.takoson68.workers.dev/ws/chat',
    roomId: 'public',
  },
  constraints: [
    '第一階段只做幾何原型，正式美術延後',
    '參考 Infinitode 2 的核心操作體驗，不複製其程式碼或受保護資產',
    '目前為幾何 MVP，正式美術與音效延後至玩法驗證後',
  ],
};
