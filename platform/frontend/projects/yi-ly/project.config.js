export default {
  name: 'yi-ly',
  title: '易經解卦',
  tenant_id: 'yi-ly',
  modules: [],
  description: '提供可追溯卜法、卜問結構、解讀資料、選配離線內容與外部 AI 交接的手機優先工具。',
  scenario: '使用者免登入以金錢法完成一卦問事，閱讀核心經文並自行展開傳文，亦可選擇保存本機歷史或複製選定內容給外部 AI。',
  skills: [],
  capabilities: [
    'traceable-yijing-corpus',
    'complete-classical-commentary-corpus',
    'offline-corpus-snapshot',
    'structured-divination-result',
    'consultation-layout',
    'traceable-interpretation-profile'
  ],
  constraints: [
    '經文、本站導讀與外部 AI 解讀必須分層',
    '不同卜法、卜問結構與解讀資料不得混淆',
    '未通過規則、來源、授權與審校 Gate 的方法或解讀不得發布',
    '結果頁、離線內容與分享文字必須顯示對應署名、來源、版本、授權及修改聲明',
    '彖傳象傳文言預設折疊且只有使用者選取後才加入外部 AI Context',
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
