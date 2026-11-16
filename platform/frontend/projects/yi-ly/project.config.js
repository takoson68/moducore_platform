export default {
  name: 'yi-ly',
  title: '易經解卦',
  tenant_id: 'yi-ly',
  modules: [],
  description: '提供可追溯《周易》經文、選配離線資料與外部 AI 交接的手機優先解卦工具。',
  scenario: '使用者免登入完成起卦，閱讀本卦、動爻與之卦，並可選擇保存本機歷史或複製結果給外部 AI。',
  skills: [],
  capabilities: [
    'traceable-yijing-corpus',
    'offline-corpus-snapshot',
    'structured-divination-result'
  ],
  constraints: [
    '經文、本站導讀與外部 AI 解讀必須分層',
    '不混入其他占術或無來源詩籤',
    '離線資料只在使用者明確同意後下載',
    '公開免登入且手機優先',
    '第一版不串站內 AI',
    '目前只建立企劃與空骨架，不實作業務功能'
  ],
  assumptions: [
    '本機歷史由使用者選擇是否保存',
    '歷史紀錄預設名稱為 TAKO'
  ]
}
