export default {
  name: 'chatCore',
  title: 'chatCore 私人聊天室實驗',
  tenant_id: 'chatCore',
  modules: ['entry', 'console', 'private-chat-lab'],
  description: '提供私人聊天室技術實驗的獨立入口與控制台。',
  scenario: '實驗參與者從入口頁進入控制台，查看目前已開放與規劃中的聊天室能力。',
  skills: [],
  capabilities: ['project-entry', 'experiment-console', 'webrtc-datachannel-lab'],
  constraints: [
    'M1 只傳輸合成測試明文，不提供登入、會員資料、歷史紀錄或持久化。',
    'Private Chat Lab 使用 chatCore 專屬 Worker 與 Signaling route，不與公開聊天室共用契約或 Durable Object。',
    'chatCore 使用獨立 tenant_id；不得將 dineCore Session 或 token 視為 chatCore 授權。',
    'Project 連結由本地設定明確列出；目標 Project 自行驗證登入與授權。',
    '不修改平台核心、其他 Project 或既有公開聊天室。'
  ],
  assumptions: ['M1 使用獨立 chatCore Staging 網站與 Signaling；僅供少數已知實驗參與者測試。']
}
