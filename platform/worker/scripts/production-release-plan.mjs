const productionTargets = Object.freeze({
  'game-demo': Object.freeze({ target: 'game-demo-production', project: 'game-demo', database: false, databaseName: null }),
  dinecore: Object.freeze({ target: 'dinecore-production', project: 'dineCore', database: true, databaseName: 'dinecore-production-db' }),
  'project-b': Object.freeze({ target: 'project-b-production', project: 'project-b', database: true, databaseName: 'project-b-production-db' }),
})

// 此模組只建立正式發布計畫，不執行部署。Production Workflow 啟用前仍須
// 驗證 Environment reviewer、獨立 Secret、Worker 與 D1 都已存在。
export function parseProductionTag(tag) {
  const match = /^prod_(game-demo|dinecore|project-b)_v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag || '')
  if (!match) throw new Error('正式發布 Tag 格式錯誤，應為 prod_<project>_v<semver>')
  const projectKey = match[1]
  return {
    ...productionTargets[projectKey],
    projectKey,
    version: match[2],
    tag,
    environment: 'production',
    artifactSource: 'build',
  }
}

export function assertProductionIsolation(plan, stagingTargets) {
  if (plan.environment !== 'production') throw new Error('PRODUCTION_ENVIRONMENT_REQUIRED')
  if (stagingTargets.includes(plan.target)) throw new Error('PRODUCTION_TARGET_REUSES_STAGING')
  if (plan.database && (!plan.databaseName || /-staging(?:-db)?$/.test(plan.databaseName))) {
    throw new Error('PRODUCTION_DATABASE_REUSES_STAGING')
  }
  return plan
}

export { productionTargets }
