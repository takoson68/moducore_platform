export default {
  name: 'yi-ly',
  title: '易占',
  tenant_id: 'yi-ly',
  modules: ['casting'],
  description: '提供可追溯卜法、卜問結構、解讀資料、選配離線內容與外部 AI 交接的手機優先工具。',
  scenario: '使用者免登入以預設六鍵時機取數或手動輸入實體三錢完成一卦問事，閱讀核心經文並自行展開傳文，亦可選擇保存本機歷史或複製問題與詩籤給外部 AI。',
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
    '經文呈現只使用資料庫來源文字，不人工校字或補寫占斷',
    '六鍵時間取數清楚標示為產品互動方式，不宣稱等同實體三錢'
  ],
  assumptions: [
    '本機歷史由使用者選擇是否保存',
    '首次保存紀錄時名稱留白並要求使用者輸入；之後預填最近一筆由使用者命名的紀錄名稱'
  ]
}
