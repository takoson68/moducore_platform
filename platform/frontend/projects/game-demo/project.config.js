export default {
  name: 'game-demo',
  title: 'ModuCore Game｜遊戲試玩室',
  tenant_id: 'game-demo',
  modules: ['playground'],
  description: '使用 Game 管理入口的最小互動遊戲畫面。',
  scenario: '先驗證遊戲開始、暫停、重開與頁面卸載，再逐步加入玩法。',
  skills: [],
  game: { diagnostics: { showFps: true } },
  constraints: ['純本機示範，不串接帳號與後端', '尚非完整塔防遊戲'],
};
