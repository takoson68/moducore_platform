export default {
  name: 'chatCore',
  title: 'chatCore 私人聊天室實驗',
  tenant_id: 'chatCore',
  modules: ['entry', 'private-chat-lab'],
  description: '提供私人聊天室技術實驗的獨立入口與控制台。',
  scenario: '已列入實驗名單的 dineCore 會員登入後，建立或加入最多 20 個在線裝置的合成文字聊天室。',
  skills: [],
  capabilities: ['project-entry', 'integrated-experiment-view', 'focused-chat-view', 'webrtc-datachannel-twenty-device-lab', 'chatcore-session-and-room-ticket', 'private-chat-local-indexeddb-history-outbox', 'private-chat-peer-ack-dedup-read'],
  constraints: [
    '只傳輸合成測試明文，每房最多 20 位會員與 20 個在線裝置；M3 提供本機 IndexedDB history/outbox 與逐 Peer ACK/READ，不提供跨裝置同步或伺服器離線 queue。',
    'Private Chat Lab 使用 chatCore 專屬 Worker 與 Signaling route，不與公開聊天室共用契約或 Durable Object。',
    'dineCore 帳密只交給 dineCore 驗證；chatCore 簽發 30 分鐘、chatCore scope Session，絕不將 dineCore token 用作 chatCore token。實驗會員以 Worker CHATCORE_MEMBER_USERNAMES 帳號名稱 allowlist 限定。',
    '加入聊天室需要已登入且列入 chatCore 實驗 allowlist 的 dineCore 會員；整合視圖與專注聊天仍皆可切換。',
    'Project 連結由本地設定明確列出；目標 Project 自行驗證登入與授權。',
    '不修改平台核心、其他 Project 或既有公開聊天室。'
  ],
  assumptions: ['M1 使用獨立 chatCore Staging 網站與 Signaling；僅供少數已知實驗參與者測試。']
}
