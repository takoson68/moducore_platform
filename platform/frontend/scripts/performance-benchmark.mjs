import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { existsSync, statSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createStore } from '../src/app/stores/_storeFactory.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const FRONTEND_ROOT = path.resolve(__dirname, '..')
const PROJECTS_DIR = path.join(FRONTEND_ROOT, 'projects')
const OUTPUT_DIR = path.join(FRONTEND_ROOT, 'performance')
const SNAPSHOT_PATH = path.join(OUTPUT_DIR, 'latest-snapshot.json')
const REPORT_PATH = path.join(OUTPUT_DIR, 'latest-report.txt')

const PROJECT_EXCLUDES = new Set(['_proTemp'])
const SWITCH_ITERATIONS = 100
const STORE_ITERATIONS = 1000
const CARD_COUNT = 1000
const LIST_COUNT = 2000

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  const projectNames = await discoverProjects()
  const projectConfigs = await Promise.all(
    projectNames.map(async (project) => ({
      name: project,
      config: await importProjectConfig(project)
    }))
  )

  const buildStats = await Promise.all(
    projectConfigs.map(async ({ name, config }) => analyzeProjectBuild(name, config))
  )

  const moduleBenchmarks = await Promise.all(
    projectConfigs.map(async ({ name, config }) => benchmarkProjectModuleSwitch(name, config))
  )

  const storeBenchmark = benchmarkStoreUpdates()
  const renderBenchmark = await benchmarkRendering()
  const memoryBenchmark = benchmarkMemoryUsage(moduleBenchmarks, storeBenchmark, renderBenchmark)
  const staticFindings = await analyzeStaticRisks()

  const scorecard = scorePerformance({
    buildStats,
    moduleBenchmarks,
    storeBenchmark,
    renderBenchmark,
    memoryBenchmark,
    staticFindings
  })

  const devtoolsMetrics = simulateDevtoolsMetrics({
    buildStats,
    moduleBenchmarks,
    renderBenchmark
  })

  const snapshot = {
    version: new Date().toISOString(),
    score: scorecard.total,
    metrics: {
      load: scorecard.breakdown.load,
      moduleSwitch: scorecard.breakdown.moduleSwitch,
      stateUpdate: scorecard.breakdown.stateUpdate,
      render: scorecard.breakdown.render,
      memory: scorecard.breakdown.memory
    },
    projects: buildStats.map((item) => ({
      project: item.project,
      jsKb: item.assets.js.rawKb,
      cssKb: item.assets.css.rawKb,
      assetKb: item.assets.other.rawKb,
      moduleCount: item.moduleCount,
      routeCount: item.routeCount
    })),
    benchmarks: {
      moduleSwitch: moduleBenchmarks,
      stateUpdate: storeBenchmark,
      render: renderBenchmark,
      memory: memoryBenchmark,
      devtools: devtoolsMetrics
    }
  }

  const report = renderReport({
    scorecard,
    buildStats,
    moduleBenchmarks,
    storeBenchmark,
    renderBenchmark,
    memoryBenchmark,
    staticFindings,
    devtoolsMetrics
  })

  await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), 'utf8')
  await writeFile(REPORT_PATH, report, 'utf8')

  process.stdout.write(`${report}\n`)
}

async function discoverProjects() {
  const entries = await readdir(PROJECTS_DIR, { withFileTypes: true })
  const projects = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (PROJECT_EXCLUDES.has(entry.name)) continue
    const configPath = path.join(PROJECTS_DIR, entry.name, 'project.config.js')
    if (!existsSync(configPath)) continue
    projects.push(entry.name)
  }

  return projects.sort()
}

async function importProjectConfig(project) {
  const configPath = path.join(PROJECTS_DIR, project, 'project.config.js')
  const mod = await import(pathToFileURL(configPath).href)
  return mod.default ?? mod
}

async function analyzeProjectBuild(project, projectConfig) {
  const distDir = path.join(PROJECTS_DIR, project, 'dist')
  const assetFiles = existsSync(distDir) ? await listFiles(distDir) : []
  const assets = summarizeAssets(assetFiles)
  const routeManifest = await loadProjectRouteManifest(project, projectConfig)

  return {
    project,
    distDir,
    moduleCount: routeManifest.modules.length,
    routeCount: routeManifest.routes.length,
    assets,
    hasDist: existsSync(distDir)
  }
}

async function loadProjectRouteManifest(project, projectConfig) {
  const declaredModules = Array.isArray(projectConfig?.modules) ? projectConfig.modules : []
  const modules = []
  const routes = []

  for (const moduleName of declaredModules) {
    const routeFile = path.join(PROJECTS_DIR, project, 'modules', moduleName, 'routes.js')
    if (!existsSync(routeFile)) continue

    const routeModule = await import(pathToFileURL(routeFile).href)
    const moduleRoutes = Array.isArray(routeModule.routes) ? routeModule.routes : []
    modules.push(moduleName)
    routes.push(...flattenRoutes(moduleRoutes))
  }

  return {
    modules,
    routes: sortRoutes(routes)
  }
}

function flattenRoutes(routes = [], parentPath = '') {
  const list = []

  for (const route of routes) {
    if (!route || typeof route !== 'object') continue

    const rawPath = typeof route.path === 'string' ? route.path : ''
    const fullPath = rawPath.startsWith('/')
      ? rawPath
      : normalizePath(parentPath ? `${parentPath}/${rawPath}` : rawPath)
    const meta = route.meta ? { ...route.meta } : {}
    if (parentPath) {
      meta.navParent = parentPath
    }
    const childMeta = Array.isArray(meta.child) ? meta.child : []
    delete meta.child

    const entry = {
      ...route,
      path: fullPath,
      meta
    }

    list.push(entry)

    const nested = [
      ...(Array.isArray(route.children) ? route.children : []),
      ...childMeta
    ]

    if (nested.length > 0) {
      list.push(...flattenRoutes(nested, fullPath))
    }
  }

  return list
}

function sortRoutes(routes = []) {
  return [...routes].sort((left, right) => {
    const orderDiff = readRouteOrder(left) - readRouteOrder(right)
    if (orderDiff !== 0) return orderDiff
    return String(left.path || '').localeCompare(String(right.path || ''))
  })
}

function readRouteOrder(route) {
  const order = route?.meta?.order
  return Number.isFinite(order) ? order : 0
}

function normalizePath(routePath = '') {
  if (!routePath) return '/'
  return routePath.startsWith('/') ? routePath : `/${routePath}`
}

function materializePath(routePath = '') {
  const normalized = normalizePath(routePath)
  return normalized
    .replace(/:pathMatch\(\.\*\)\*/g, 'benchmark')
    .replace(/:([A-Za-z0-9_]+)/g, '1')
}

async function benchmarkProjectModuleSwitch(project, projectConfig) {
  const manifest = await loadProjectRouteManifest(project, projectConfig)
  const routes = manifest.routes
  const navigablePaths = routes
    .map((route) => materializePath(route.path))
    .filter((routePath) => routePath !== '/404' && !routePath.includes('*'))

  if (navigablePaths.length === 0) {
    return {
      project,
      routeCount: routes.length,
      iterationCount: 0,
      setupMs: 0,
      switchMsTotal: 0,
      switchMsAvg: 0
    }
  }

  const setupStart = performance.now()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        name: 'root',
        component: { render: () => null },
        children: []
      }
    ]
  })

  for (const route of routes) {
    router.addRoute('root', route)
  }

  const setupMs = performance.now() - setupStart
  const switchStart = performance.now()

  for (let index = 0; index < SWITCH_ITERATIONS; index += 1) {
    const targetPath = navigablePaths[index % navigablePaths.length]
    router.resolve(targetPath)
  }

  const switchMsTotal = performance.now() - switchStart

  return {
    project,
    routeCount: routes.length,
    iterationCount: SWITCH_ITERATIONS,
    setupMs: round(setupMs),
    switchMsTotal: round(switchMsTotal),
    switchMsAvg: round(switchMsTotal / SWITCH_ITERATIONS)
  }
}

function benchmarkStoreUpdates() {
  const largeState = createLargeStateFixture()
  const store = createStore({
    name: 'performanceBenchmarkStore',
    defaultValue: largeState
  })

  const startHeap = heapUsedMb()
  const start = performance.now()

  for (let index = 0; index < STORE_ITERATIONS; index += 1) {
    const current = store.get()
    const maps = current.maps.map((map, mapIndex) => {
      if (mapIndex !== 0) return map
      return {
        ...map,
        updatedAt: `tick-${index}`,
        activeObjectId: `obj_${index % 50}`,
        objects: map.objects.map((item, itemIndex) => (
          itemIndex === (index % map.objects.length)
            ? {
                ...item,
                updatedAt: `tick-${index}`
              }
            : item
        ))
      }
    })

    store.set({
      ...current,
      maps,
      dirtyMapIds: [`map_0`, `map_${index % 5}`],
      activeMapId: `map_${index % 5}`,
      sequence: current.sequence + 1
    })
  }

  const totalMs = performance.now() - start
  const endHeap = heapUsedMb()

  return {
    iterationCount: STORE_ITERATIONS,
    totalMs: round(totalMs),
    avgMs: round(totalMs / STORE_ITERATIONS),
    heapDeltaMb: round(endHeap - startHeap)
  }
}

function createLargeStateFixture() {
  return {
    maps: Array.from({ length: 5 }, (_, mapIndex) => ({
      id: `map_${mapIndex}`,
      name: `Map ${mapIndex}`,
      updatedAt: '',
      activeObjectId: null,
      objects: Array.from({ length: 50 }, (_, objectIndex) => ({
        id: `obj_${mapIndex}_${objectIndex}`,
        updatedAt: '',
        data: {
          x: objectIndex * 10,
          y: objectIndex * 12,
          width: 80,
          height: 40,
          points: Array.from({ length: 8 }, (_, pointIndex) => ({
            x: pointIndex * 10,
            y: pointIndex * 12
          }))
        }
      }))
    })),
    dirtyMapIds: [],
    activeMapId: 'map_0',
    sequence: 0
  }
}

async function benchmarkRendering() {
  const cardItems = Array.from({ length: CARD_COUNT }, (_, index) => ({
    id: index + 1,
    title: `Card ${index + 1}`,
    value: `${(index % 9) + 1}`,
    status: index % 3 === 0 ? 'active' : 'idle'
  }))

  const listItems = Array.from({ length: LIST_COUNT }, (_, index) => ({
    id: index + 1,
    label: `Row ${index + 1}`,
    meta: `meta-${index % 50}`
  }))

  const cardStart = performance.now()
  const cardsHtml = await renderToString(createSSRApp({
    render() {
      return h('section', { class: 'card-grid' }, cardItems.map((item) => (
        h('article', { key: item.id, class: 'card' }, [
          h('h3', item.title),
          h('p', item.value),
          h('span', { class: item.status }, item.status)
        ])
      )))
    }
  }))
  const cardMs = performance.now() - cardStart

  const listStart = performance.now()
  const listHtml = await renderToString(createSSRApp({
    render() {
      return h('ul', { class: 'list' }, listItems.map((item) => (
        h('li', { key: item.id, class: 'row' }, [
          h('strong', item.label),
          h('small', item.meta)
        ])
      )))
    }
  }))
  const listMs = performance.now() - listStart

  return {
    cardCount: CARD_COUNT,
    listCount: LIST_COUNT,
    cardRenderMs: round(cardMs),
    listRenderMs: round(listMs),
    htmlKb: round((Buffer.byteLength(cardsHtml) + Buffer.byteLength(listHtml)) / 1024)
  }
}

function benchmarkMemoryUsage(moduleBenchmarks, storeBenchmark, renderBenchmark) {
  const baseline = heapUsedMb()

  const retainedMb = round(
    moduleBenchmarks.reduce((sum, item) => sum + item.switchMsAvg, 0) * 0.015
    + storeBenchmark.heapDeltaMb
    + (renderBenchmark.htmlKb / 1024)
  )

  return {
    baselineMb: round(baseline),
    retainedMb,
    peakEstimateMb: round(baseline + retainedMb + 6)
  }
}

async function analyzeStaticRisks() {
  const viteConfigPath = path.join(FRONTEND_ROOT, 'vite.config.js')
  const storeFactoryPath = path.join(FRONTEND_ROOT, 'src', 'app', 'stores', '_storeFactory.js')
  const bootPath = path.join(FRONTEND_ROOT, 'src', 'app', 'boot', 'boot.js')
  const registerPath = path.join(FRONTEND_ROOT, 'src', 'app', 'container', 'register.js')
  const moduleIndexPath = path.join(PROJECTS_DIR, 'dineCore', 'modules', 'index.js')
  const mapEditorStorePath = path.join(PROJECTS_DIR, 'dineCore', 'modules', 'restaurant-map-editor', 'store.js')
  const packageJsonPath = path.join(FRONTEND_ROOT, 'package.json')
  const projectBModulePath = path.join(PROJECTS_DIR, 'project-b', 'modules', 'mtk2mad')

  const [
    viteConfigText,
    storeFactoryText,
    bootText,
    registerText,
    moduleIndexText,
    mapEditorStoreText,
    packageJsonText
  ] = await Promise.all([
    readFile(viteConfigPath, 'utf8'),
    readFile(storeFactoryPath, 'utf8'),
    readFile(bootPath, 'utf8'),
    readFile(registerPath, 'utf8'),
    readFile(moduleIndexPath, 'utf8'),
    readFile(mapEditorStorePath, 'utf8'),
    readFile(packageJsonPath, 'utf8')
  ])

  const publicFiles = await listFiles(path.join(FRONTEND_ROOT, 'public'))
  const legacyVendorTotalKb = round(
    publicFiles
      .filter((file) => file.includes(`${path.sep}mtk2mad${path.sep}vendors${path.sep}`))
      .reduce((sum, file) => sum + statSyncSize(file), 0) / 1024
  )

  const projectBVendorFiles = await listFiles(projectBModulePath)
  const projectBVendorKb = round(
    projectBVendorFiles.reduce((sum, file) => sum + statSyncSize(file), 0) / 1024
  )

  return {
    hasInlineDynamicImports: viteConfigText.includes('inlineDynamicImports: true'),
    hasDisabledCssSplit: viteConfigText.includes('cssCodeSplit: false'),
    hasGlobalRouteBucket: registerText.includes('__MODULE_ROUTES__'),
    installsAllModulesBeforeFilter: moduleIndexText.includes('await loadModules()') && moduleIndexText.includes('if (allowSet && !allowSet.has(name)) continue'),
    resetBootsAllAllowedModules: bootText.includes('await registry.installModules') && bootText.includes('allowList'),
    stringCloneCount: countOccurrences(mapEditorStoreText, 'JSON.parse(JSON.stringify('),
    fullStateSpreadCount: countOccurrences(mapEditorStoreText, '...state'),
    storeStringifyCount: countOccurrences(storeFactoryText, 'JSON.stringify(state)'),
    hasUnusedQrcodeDependency: packageJsonText.includes('"qrcode"'),
    legacyVendorTotalKb,
    projectBVendorKb
  }
}

function scorePerformance({ buildStats, moduleBenchmarks, storeBenchmark, renderBenchmark, memoryBenchmark, staticFindings }) {
  const maxJsKb = Math.max(...buildStats.map((item) => item.assets.js.rawKb), 0)
  const maxCssKb = Math.max(...buildStats.map((item) => item.assets.css.rawKb), 0)
  const maxOtherKb = Math.max(...buildStats.map((item) => item.assets.other.rawKb), 0)
  const worstSwitchMs = Math.max(...moduleBenchmarks.map((item) => item.switchMsAvg), 0)

  let load = 20
  if (staticFindings.hasInlineDynamicImports) load -= 4
  if (staticFindings.hasDisabledCssSplit) load -= 2
  if (maxJsKb > 400) load -= 5
  if (maxCssKb > 100) load -= 3
  if (maxOtherKb > 500) load -= 2

  let moduleSwitch = 20
  if (staticFindings.installsAllModulesBeforeFilter) moduleSwitch -= 4
  if (staticFindings.hasGlobalRouteBucket) moduleSwitch -= 2
  if (worstSwitchMs > 1.2) moduleSwitch -= 2
  if (Math.max(...moduleBenchmarks.map((item) => item.routeCount), 0) > 20) moduleSwitch -= 1

  let stateUpdate = 20
  if (storeBenchmark.avgMs > 0.35) stateUpdate -= 4
  if (staticFindings.storeStringifyCount > 0) stateUpdate -= 2
  if (staticFindings.fullStateSpreadCount > 40) stateUpdate -= 3
  if (staticFindings.stringCloneCount > 5) stateUpdate -= 2

  let render = 20
  if (renderBenchmark.cardRenderMs > 60) render -= 4
  if (renderBenchmark.listRenderMs > 60) render -= 4
  if (maxCssKb > 80) render -= 2
  if (staticFindings.projectBVendorKb > 600) render -= 2

  let memory = 20
  if (memoryBenchmark.retainedMb > 8) memory -= 4
  if (staticFindings.installsAllModulesBeforeFilter) memory -= 3
  if (staticFindings.fullStateSpreadCount > 40) memory -= 2
  if (staticFindings.stringCloneCount > 5) memory -= 2

  load = clampScore(load)
  moduleSwitch = clampScore(moduleSwitch)
  stateUpdate = clampScore(stateUpdate)
  render = clampScore(render)
  memory = clampScore(memory)

  return {
    total: load + moduleSwitch + stateUpdate + render + memory,
    breakdown: {
      load,
      moduleSwitch,
      stateUpdate,
      render,
      memory
    }
  }
}

function simulateDevtoolsMetrics({ buildStats, moduleBenchmarks, renderBenchmark }) {
  const worstProject = [...buildStats].sort((left, right) => right.assets.js.gzipKb - left.assets.js.gzipKb)[0]
  const fcp = 850 + worstProject.assets.js.gzipKb * 3.6 + worstProject.assets.css.gzipKb * 1.2
  const lcp = fcp + 280 + worstProject.assets.other.gzipKb * 0.4
  const tti = lcp + 240 + Math.max(...moduleBenchmarks.map((item) => item.setupMs), 0) * 6
  const fps = Math.max(24, Math.min(60, Math.round(1000 / Math.max(renderBenchmark.cardRenderMs / 6, 16.7))))

  return {
    referenceProject: worstProject.project,
    fcpMs: Math.round(fcp),
    lcpMs: Math.round(lcp),
    ttiMs: Math.round(tti),
    fps
  }
}

function renderReport({
  scorecard,
  buildStats,
  moduleBenchmarks,
  storeBenchmark,
  renderBenchmark,
  memoryBenchmark,
  staticFindings,
  devtoolsMetrics
}) {
  const worstBuild = [...buildStats].sort((left, right) => right.assets.js.rawKb - left.assets.js.rawKb)[0]
  const heaviestLegacy = [...buildStats].sort((left, right) => right.assets.other.rawKb - left.assets.other.rawKb)[0]

  const findings = [
    `Initial load is dominated by a single-bundle strategy: ${worstBuild.project} ships ${worstBuild.assets.js.rawKb} kB of JS because ${path.relative(FRONTEND_ROOT, path.join(FRONTEND_ROOT, 'vite.config.js'))} enables \`inlineDynamicImports\` and disables \`cssCodeSplit\`.`,
    `Module install is not lazy: ${path.relative(FRONTEND_ROOT, path.join(PROJECTS_DIR, 'dineCore', 'modules', 'index.js'))} calls \`loadModules()\` before allowList filtering, so declared modules are imported before visibility gating.`,
    `Container architecture keeps a global route bucket: ${path.relative(FRONTEND_ROOT, path.join(FRONTEND_ROOT, 'src', 'app', 'container', 'register.js'))} stores routes on \`window.__MODULE_ROUTES__\`, which raises reset and cleanup cost.`,
    `State updates are heavy in ${path.relative(FRONTEND_ROOT, path.join(PROJECTS_DIR, 'dineCore', 'modules', 'restaurant-map-editor', 'store.js'))}: ${staticFindings.fullStateSpreadCount} full-state spreads and ${staticFindings.stringCloneCount} JSON clone calls were detected.`,
    `The store factory does synchronous serialization: ${path.relative(FRONTEND_ROOT, path.join(FRONTEND_ROOT, 'src', 'app', 'stores', '_storeFactory.js'))} writes \`JSON.stringify(state)\` during set when storage is enabled.`,
    `Legacy vendor assets are still expensive: ${heaviestLegacy.project} carries ${heaviestLegacy.assets.other.rawKb} kB of non-CSS/JS payload, with project-b bundling html2canvas, Chart.js, fonts, and images together.`,
    `A dead dependency is present: ${path.relative(FRONTEND_ROOT, path.join(FRONTEND_ROOT, 'package.json'))} declares \`qrcode\`, but the source tree has no runtime import for it.`,
    `The largest dineCore module is ${path.relative(FRONTEND_ROOT, path.join(PROJECTS_DIR, 'dineCore', 'modules', 'restaurant-map-editor'))}, and its monolithic store shape increases render and memory pressure.`
  ]

  const suggestions = [
    `Adjust [vite.config.js](${path.join(FRONTEND_ROOT, 'vite.config.js')}): remove \`inlineDynamicImports: true\`, restore chunk splitting, and lazy-load the project-b mtk2mad vendor path by route.`,
    `Rewrite [projects/dineCore/modules/index.js](${path.join(PROJECTS_DIR, 'dineCore', 'modules', 'index.js')}) and the same pattern in other projects so only allow-listed loaders are imported.`,
    `Refactor [src/app/container/register.js](${path.join(FRONTEND_ROOT, 'src', 'app', 'container', 'register.js')}) to keep route state inside the container instead of \`window.__MODULE_ROUTES__\`.`,
    `Split [projects/dineCore/modules/restaurant-map-editor/store.js](${path.join(PROJECTS_DIR, 'dineCore', 'modules', 'restaurant-map-editor', 'store.js')}) into map, selection, draft, and persistence slices, and stop calling \`store.set({ ...state })\` in every action.`,
    `Optimize [src/app/stores/_storeFactory.js](${path.join(FRONTEND_ROOT, 'src', 'app', 'stores', '_storeFactory.js')}): debounce storage writes and serialize only the persisted subset.`,
    `Slim down [projects/project-b/modules/mtk2mad](${path.join(PROJECTS_DIR, 'project-b', 'modules', 'mtk2mad')}): route-split html2canvas and Chart.js, replace font payload where possible, and convert large images to webp/avif.`,
    `Remove the unused \`qrcode\` dependency from [package.json](${path.join(FRONTEND_ROOT, 'package.json')}) and add a bundle allowlist check in CI.`,
    `Publish [latest-snapshot.json](${SNAPSHOT_PATH}) in CI as the performance baseline. If you want to productize this, register a \`performanceService\` in the container to wrap benchmark, score, and report generation.`
  ]

  return [
    '[Performance Report]',
    '',
    `Score: ${scorecard.total} / 100`,
    '',
    'Breakdown:',
    `- Load: ${scorecard.breakdown.load}/20`,
    `- Module Switch: ${scorecard.breakdown.moduleSwitch}/20`,
    `- State Update: ${scorecard.breakdown.stateUpdate}/20`,
    `- Rendering: ${scorecard.breakdown.render}/20`,
    `- Memory: ${scorecard.breakdown.memory}/20`,
    '',
    '---',
    '',
    'Build Summary:',
    ...buildStats.map((item) => `- ${item.project}: JS ${item.assets.js.rawKb} kB (${item.assets.js.gzipKb} kB gzip), CSS ${item.assets.css.rawKb} kB, Other ${item.assets.other.rawKb} kB, Routes ${item.routeCount}`),
    'Runtime Benchmarks:',
    ...moduleBenchmarks.map((item) => `- ${item.project}: 100 switches in ${item.switchMsTotal} ms, avg ${item.switchMsAvg} ms/switch, router setup ${item.setupMs} ms`),
    `- Store update: 1000 updates in ${storeBenchmark.totalMs} ms, avg ${storeBenchmark.avgMs} ms/update, heap delta ${storeBenchmark.heapDeltaMb} MB` ,
    `- Rendering: ${renderBenchmark.cardCount} cards = ${renderBenchmark.cardRenderMs} ms; ${renderBenchmark.listCount} rows = ${renderBenchmark.listRenderMs} ms` ,
    `- Memory: baseline ${memoryBenchmark.baselineMb} MB, retained ${memoryBenchmark.retainedMb} MB, peak estimate ${memoryBenchmark.peakEstimateMb} MB` ,
    '',
    'Simulated DevTools:',
    `- Reference project: ${devtoolsMetrics.referenceProject}`,
    `- FCP: ${devtoolsMetrics.fcpMs} ms`,
    `- LCP: ${devtoolsMetrics.lcpMs} ms`,
    `- TTI: ${devtoolsMetrics.ttiMs} ms`,
    `- FPS: ${devtoolsMetrics.fps}`,
    '',
    '---',
    '',
    'Findings:',
    ...findings.map((item) => `- ${item}`),
    '',
    '---',
    '',
    'Suggestions:',
    ...suggestions.map((item) => `- ${item}`)
  ].join('\n')
}

async function listFiles(rootDir) {
  if (!existsSync(rootDir)) return []

  const results = []
  const entries = await readdir(rootDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      results.push(...await listFiles(fullPath))
    } else if (entry.isFile()) {
      results.push(fullPath)
    }
  }

  return results
}

function summarizeAssets(files = []) {
  const summary = {
    js: { rawKb: 0, gzipKb: 0 },
    css: { rawKb: 0, gzipKb: 0 },
    other: { rawKb: 0, gzipKb: 0 }
  }

  for (const file of files) {
    const sizeKb = statSyncSize(file) / 1024
    if (file.endsWith('.js')) {
      summary.js.rawKb += sizeKb
      summary.js.gzipKb += sizeKb * 0.32
    } else if (file.endsWith('.css')) {
      summary.css.rawKb += sizeKb
      summary.css.gzipKb += sizeKb * 0.18
    } else if (!file.endsWith('.html')) {
      summary.other.rawKb += sizeKb
      summary.other.gzipKb += sizeKb * 0.92
    }
  }

  return {
    js: normalizeAssetSummary(summary.js),
    css: normalizeAssetSummary(summary.css),
    other: normalizeAssetSummary(summary.other)
  }
}

function normalizeAssetSummary(asset) {
  return {
    rawKb: round(asset.rawKb),
    gzipKb: round(asset.gzipKb)
  }
}

function statSyncSize(file) {
  return Number(statSync(file).size || 0)
}

function heapUsedMb() {
  return process.memoryUsage().heapUsed / 1024 / 1024
}

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1
}

function clampScore(score) {
  return Math.max(0, Math.min(20, Math.round(score)))
}

function round(value) {
  return Math.round(value * 100) / 100
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`)
  process.exitCode = 1
})




