export default {
  name: 'chatCore',
  title: 'chatCore 私人聊天室實驗',
  tenant_id: 'chatCore',
  modules: ['entry', 'private-chat-lab'],
  description: '提供私人聊天室技術實驗的獨立入口與控制台。',
  scenario: '實驗參與者進入專注聊天頁，建立或加入五人以下的合成文字聊天室。',
  skills: [],
  capabilities: ['project-entry', 'integrated-experiment-view', 'focused-chat-view', 'webrtc-datachannel-five-peer-lab'],
  constraints: [
    'M1b 只傳輸合成測試明文，每房最多五位參與者，不提供登入、會員資料、歷史紀錄或持久化。',
    'Private Chat Lab 使用 chatCore 專屬 Worker 與 Signaling route，不與公開聊天室共用契約或 Durable Object。',
    'chatCore 使用獨立 tenant_id；不得將 dineCore Session 或 token 視為 chatCore 授權。',
    '整合視圖與專注聊天皆開放給實驗參與者；沒有登入或角色判斷，也不提供管理授權。',
    'Project 連結由本地設定明確列出；目標 Project 自行驗證登入與授權。',
    '不修改平台核心、其他 Project 或既有公開聊天室。'
  ],
  assumptions: ['M1 使用獨立 chatCore Staging 網站與 Signaling；僅供少數已知實驗參與者測試。']
}
