import { performance } from 'node:perf_hooks'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Container } from '../src/app/container/container.js'
import { createStore } from '../src/app/stores/_storeFactory.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPORT_DIR = path.resolve(__dirname, '../../../_workspace/_reports/2026-10-27_platform_chat_m4a_container_benchmark')
const SAMPLE_COUNT = 30
const WARMUP_COUNT = 5
const UPDATE_COUNT = 1000
const CHURN_COUNT = 1000

function forceGc() {
  if (typeof global.gc === 'function') global.gc()
}

function percentile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(ratio * sorted.length) - 1))
  return sorted[index]
}

function summarize(samples) {
  return {
    samples: samples.length,
    minMs: round(Math.min(...samples)),
    medianMs: round(percentile(samples, 0.5)),
    p95Ms: round(percentile(samples, 0.95)),
    maxMs: round(Math.max(...samples)),
  }
}

function round(value) {
  return Number(value.toFixed(4))
}

function createMeasuredContainer(index) {
  const container = new Container({ services: {} })
  container.register(`store-${index}`, () => createStore({
    name: `benchmark-${index}`,
    defaultValue: { count: 0, messages: [] },
  }), { scope: 'core' })
  container.register(`resource-${index}`, () => ({
    dispose() {},
  }))
  return container
}

function measure(label, operation) {
  for (let index = 0; index < WARMUP_COUNT; index += 1) operation()
  const samples = []
  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    forceGc()
    const start = performance.now()
    operation()
    samples.push(performance.now() - start)
  }
  return { label, ...summarize(samples) }
}

function benchmarkSingleLifecycle() {
  return measure('single container create / resolve / destroy', () => {
    const container = createMeasuredContainer(0)
    container.resolve('store-0')
    container.resolve('resource-0')
    container.destroy()
  })
}

function benchmarkTripleLifecycle() {
  return measure('three containers create / resolve / destroy', () => {
    const containers = [0, 1, 2].map(createMeasuredContainer)
    containers.forEach((container, index) => {
      container.resolve(`store-${index}`)
      container.resolve(`resource-${index}`)
    })
    containers.forEach((container) => container.destroy())
  })
}

function benchmarkIsolatedUpdates() {
  const result = measure('three containers isolated store updates', () => {
    const containers = [0, 1, 2].map(createMeasuredContainer)
    const stores = containers.map((container, index) => {
      const unsubscribe = container.subscribe('store-update', () => {})
      return { container, store: container.resolve(`store-${index}`), unsubscribe }
    })

    for (let update = 1; update <= UPDATE_COUNT; update += 1) {
      stores.forEach(({ container, store }) => {
        const state = store.get()
        store.set({ ...state, count: update })
        container.emit('store-update', { update })
      })
    }

    stores.forEach(({ container, unsubscribe }) => {
      unsubscribe()
      container.destroy()
    })
  })
  return { ...result, updatesPerSample: UPDATE_COUNT * 3, notificationsPerSample: UPDATE_COUNT * 3 }
}

function benchmarkChurn() {
  return measure(`repeated container create / destroy (${CHURN_COUNT} cycles)`, () => {
    for (let index = 0; index < CHURN_COUNT; index += 1) {
      const container = createMeasuredContainer(index)
      container.resolve(`resource-${index}`)
      container.destroy()
    }
  })
}

function memorySnapshot() {
  forceGc()
  return process.memoryUsage().heapUsed
}

async function main() {
  const beforeHeap = memorySnapshot()
  const single = benchmarkSingleLifecycle()
  const triple = benchmarkTripleLifecycle()
  const isolatedUpdates = benchmarkIsolatedUpdates()
  const churn = benchmarkChurn()
  const afterHeap = memorySnapshot()

  const result = {
    generatedAt: new Date().toISOString(),
    node: process.version,
    gcAvailable: typeof global.gc === 'function',
    sampleCount: SAMPLE_COUNT,
    warmupCount: WARMUP_COUNT,
    updateCountPerContainer: UPDATE_COUNT,
    churnCount: CHURN_COUNT,
    heapUsedBeforeBytes: beforeHeap,
    heapUsedAfterBytes: afterHeap,
    heapDeltaBytes: afterHeap - beforeHeap,
    benchmarks: { single, triple, isolatedUpdates, churn },
  }

  await mkdir(REPORT_DIR, { recursive: true })
  await writeFile(path.join(REPORT_DIR, 'raw.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  await writeFile(path.join(REPORT_DIR, 'RESULT.md'), renderReport(result), 'utf8')
  process.stdout.write(renderReport(result))
}

function renderReport(result) {
  const { benchmarks: b } = result
  return `# M4-A 純 Container 基準測試結果

生成時間：${result.generatedAt}

## 測試環境

- Node：${result.node}
- GC：${result.gcAvailable ? '可用（以 --expose-gc 執行）' : '不可用'}
- 每項樣本：${result.sampleCount}，暖身：${result.warmupCount}
- Store 更新：每個 Container ${result.updateCountPerContainer} 次
- 建立／銷毀循環：${result.churnCount} 次

## 結果（毫秒）

| 測試 | 中位數 | p95 | 最大 |
|---|---:|---:|---:|
| ${b.single.label} | ${b.single.medianMs} | ${b.single.p95Ms} | ${b.single.maxMs} |
| ${b.triple.label} | ${b.triple.medianMs} | ${b.triple.p95Ms} | ${b.triple.maxMs} |
| ${b.isolatedUpdates.label} | ${b.isolatedUpdates.medianMs} | ${b.isolatedUpdates.p95Ms} | ${b.isolatedUpdates.maxMs} |
| ${b.churn.label} | ${b.churn.medianMs} | ${b.churn.p95Ms} | ${b.churn.maxMs} |

## 隔離與資源觀察

- 三個 Container 的每次更新與通知數：${b.isolatedUpdates.notificationsPerSample}；每個更新只通知所屬 Container。
- 測試前後 heapUsed 差異：${result.heapDeltaBytes} bytes。這是 Node 單次執行的觀察值，不是長時間記憶體穩定性結論。
- 所有 Container 均使用原始 Container，沒有建立 Chat 專用容器實作。

## 判讀與限制

本報告只回答「原始 Container 多實例是否有明顯固定成本」；尚未涵蓋瀏覽器 DOM、p5.js、WebSocket 或真實 Game + Chat 負載。下一步是 M4-B：以本地模擬訊息與真實 WebSocket，測量 FPS、訊息延遲、DOM 更新與斷線資源釋放。
`
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
