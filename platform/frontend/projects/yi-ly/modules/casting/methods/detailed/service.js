export const CONSULTATION_STEPS = Object.freeze([
  Object.freeze({ id: 'origin', title: '緣起', question: '形成目前情況的背景、累積因素或尚未處理的影響是什麼？' }),
  Object.freeze({ id: 'present', title: '當下', question: '現在最主要的情勢、力量、矛盾或需要看清的部分是什麼？' }),
  Object.freeze({ id: 'trend', title: '趨勢', question: '若目前條件持續，事情可能往什麼方向發展，又需要留意哪些條件？' }),
])

export const VARIABLE_TAGS = Object.freeze({
  事業: Object.freeze(['薪水', '發展空間', '主管', '同事關係', '工作量', '穩定性', '通勤', '健康', '家庭', '工作機會', '合約', '時機']),
  感情: Object.freeze(['溝通', '信任', '承諾', '距離', '家庭', '金錢', '過去經歷', '相處時間', '未來規劃', '價值觀', '外部壓力', '時機']),
  財運: Object.freeze(['收入', '支出', '負債', '現金流', '投資風險', '合作對象', '合約', '家庭負擔', '市場變化', '資金需求', '時機']),
  健康: Object.freeze(['睡眠', '壓力', '飲食', '工作', '情緒', '家庭', '生活習慣', '醫療安排', '復原時間', '環境']),
  其他: Object.freeze(['人', '金錢', '時間', '資源', '健康', '家庭', '溝通', '合約', '環境', '外部變化', '時機']),
})

export function civilDateTimeAt(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]))
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  }
}

export function buildDetailedAiContext({ question, category, variables, steps, meihua, meihuaReading }) {
  const variableText = variables.length ? variables.join('、') : '未選取補充變數'
  const stepSections = steps.flatMap((step, index) => {
    const source = step.reading?.yilin?.source
    const sourceText = [source?.name, source?.edition, source?.url].filter(Boolean).join('｜')
    return [
      `【階段 ${index + 1}：${step.title}】`,
      `子問題：${step.prompt}`,
      `卦象：${step.reading?.baseHexagram?.hexagram_name || step.casting.basePatternBottomUp} → ${step.reading?.changedHexagram?.hexagram_name || step.casting.changedPatternBottomUp}`,
      `《焦氏易林》：${step.reading?.yilin?.text || '經文目前未載入'}`,
      sourceText ? `來源：${sourceText}` : '',
    ].filter(Boolean)
  })
  const meihuaNames = [
    meihuaReading?.baseHexagram?.hexagram_name || meihua.basePatternBottomUp,
    meihuaReading?.changedHexagram?.hexagram_name || meihua.changedPatternBottomUp,
  ]

  return [
    '請將以下資料整合解讀，最後寫成一篇前後連貫、可以直接閱讀的完整問事文章，不要只用條列逐項回答，也不要把緣起、當下、趨勢與梅花易數寫成彼此無關的四份解釋。文章應先簡短交代主問題，再依緣起、當下、趨勢形成自然的敘事脈絡，說明三首《焦氏易林》林辭之間的延續、轉折、呼應或矛盾，接著把整體梅花易數的本卦、互卦、變卦、動爻與體用關係融入同一條分析線，最後綜合補充變數，提出整體判讀、需要留意的條件與可採取的方向。段落可以有小標題，但全文必須像一篇完整文章，而不是資料摘要或分項報告。每項推論須指出所依據的詩句或演算資料。補充變數只表示使用者認為該因素相關，未提供實際狀態或影響方向，不得自行假設薪資高低、關係好壞或其他具體事實。請清楚區分原文、演算資料與推論；趨勢不是必然預言。若資料不足或不同結果沒有明顯呼應，請直接說明，不要勉強串連或下結論。',
    '【主問題】',
    question || '（尚未填寫）',
    `【問題分類】${category}`,
    `【使用者標記的相關變數】${variableText}`,
    ...stepSections,
    '【整體梅花易數】',
    `確認時間：${meihua.calendar.solarDateTime.year}/${meihua.calendar.solarDateTime.month}/${meihua.calendar.solarDateTime.day} ${String(meihua.calendar.solarDateTime.hour).padStart(2, '0')}:${String(meihua.calendar.solarDateTime.minute).padStart(2, '0')}（${meihua.calendar.timeZone}）`,
    `本卦 → 變卦：${meihuaNames.join(' → ')}`,
    `互卦卦畫：${meihua.mutual.patternBottomUp}${meihua.mutual.isSourceException ? '（乾坤純卦例外，取變卦互卦）' : ''}`,
    `動爻：第 ${meihua.calculation.movingLine} 爻`,
    `體用：體卦${meihua.bodyUse.body.name}${meihua.bodyUse.body.element}；用卦${meihua.bodyUse.use.name}${meihua.bodyUse.use.element}；${meihua.bodyUse.relation}`,
    `梅花規則版本：${meihua.methodRuleVersion}`,
  ].join('\n\n')
}
