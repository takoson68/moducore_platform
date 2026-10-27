export default {
  name: 'game-demo',
  title: 'ModuCore Game｜遊戲試玩室',
  tenant_id: 'game-demo',
  modules: ['playground'],
  description: '使用 Game 管理入口的最小互動遊戲畫面。',
  scenario: '先驗證遊戲開始、暫停、重開與頁面卸載，再逐步加入玩法。',
  skills: [],
  game: { diagnostics: { showFps: true } },
  chat: {
    enabled: true,
    endpoint: 'wss://moducore-chat-poc-staging.takoson68.workers.dev/ws/chat',
    roomId: 'game-demo',
  },
  constraints: ['遊戲本體為本機示範，不串接帳號；Chat 以平台 WebSocket 作為獨立能力', '尚非完整塔防遊戲'],
};
