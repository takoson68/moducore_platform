import { performance } from 'node:perf_hooks'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Chat } from '../src/chat/chat.js'
import { createMockWebSocketPair } from '../src/chat/mockWebSocket.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPORT_DIR = path.resolve(__dirname, '../../../_workspace/_reports/2026-10-27_platform_chat_m4b_load_benchmark')
const RATES = [0, 5, 50, 200]
const MAX_MESSAGES = 100
const FRAME_COUNT = 60

function round(value) {
  return Number(value.toFixed(4))
}

function percentile(values, ratio) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)]
}

function gameFrame(workUnits = 1000) {
  let value = 0
  for (let index = 0; index < workUnits; index += 1) value = (value + index) % 997
  return value
}

async function runScenario(rate) {
  const { WebSocketImpl } = createMockWebSocketPair()
  const chat = new Chat({ url: 'ws://local.test/chat', WebSocketImpl, maxMessages: MAX_MESSAGES, reconnect: false })
  chat.start()
  await new Promise(resolve => queueMicrotask(resolve))

  const frameTimes = []
  const start = performance.now()
  const totalMessages = rate
  for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
    const frameStart = performance.now()
    gameFrame()
    if (frame < totalMessages) {
      const messageId = `local-${rate}-${frame}`
      chat.service('messages').receive({
        type: 'chat.message.created',
        payload: {
          roomId: 'public',
          messageId,
          sender: { id: `player_${frame + 1}`, number: frame + 1, displayName: `玩家${String(frame + 1).padStart(3, '0')}` },
          content: `local-load-${frame}`,
          sequence: frame + 1,
          serverTime: Date.now(),
        },
      })
    }
    frameTimes.push(performance.now() - frameStart)
  }
  const elapsedMs = performance.now() - start
  const messageCount = chat.store('messages').state.messages.length
  chat.dispose()

  return {
    ratePerSecond: rate,
    inputMessages: totalMessages,
    retainedMessages: messageCount,
    ringBufferLimit: MAX_MESSAGES,
    elapsedMs: round(elapsedMs),
    frameP95Ms: round(percentile(frameTimes, 0.95)),
    frameMaxMs: round(Math.max(...frameTimes)),
  }
}

async function main() {
  const scenarios = []
  for (const rate of RATES) scenarios.push(await runScenario(rate))
  const result = {
    generatedAt: new Date().toISOString(),
    node: process.version,
    scenarios,
    limitations: [
      '本測試使用 MockWebSocket 與 Node Store，沒有包含瀏覽器 DOM／p5.js render。',
      'ratePerSecond 以固定 60 個 frame 內注入訊息，代表本地處理成本，不代表真實網路排程。',
    ],
  }
  await mkdir(REPORT_DIR, { recursive: true })
  await writeFile(path.join(REPORT_DIR, 'local-raw.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  await writeFile(path.join(REPORT_DIR, 'LOCAL_RESULT.md'), renderReport(result), 'utf8')
  process.stdout.write(renderReport(result))
}

function renderReport(result) {
  return `# M4-B 本地 Chat 負載測試

生成時間：${result.generatedAt}

| Chat 流量（則／秒） | 輸入數 | 保留數 | frame p95（ms） | frame 最大（ms） |
|---:|---:|---:|---:|---:|
${result.scenarios.map(item => `| ${item.ratePerSecond} | ${item.inputMessages} | ${item.retainedMessages} | ${item.frameP95Ms} | ${item.frameMaxMs} |`).join('\n')}

## 範圍

- 使用平台 Chat、原始 Container、MessageStore 與 MockWebSocket。
- 每個情境併行執行 60 個模擬遊戲 frame，訊息只寫入 Chat 自己的 Store。
- Ring buffer 上限為 ${MAX_MESSAGES}；超過上限的訊息不會無限累積。

## 限制

${result.limitations.map(item => `- ${item}`).join('\n')}

下一步仍需以真實瀏覽器與 WebSocket 補測 FPS、DOM 更新、網路延遲及背景切回。
`
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
