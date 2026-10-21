import { execFileSync } from 'node:child_process'
import { appendFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const MIGRATION_PATTERN = /^\d{4}_[A-Za-z0-9_-]+\.sql$/

function args(values) {
  const parsed = {}
  for (let index = 0; index < values.length; index += 2) parsed[values[index]?.replace(/^--/, '')] = values[index + 1]
  return parsed
}

export function orderedMigrations(directory) {
  const names = readdirSync(directory).filter((name) => MIGRATION_PATTERN.test(name)).sort()
  if (names.length === 0) throw new Error('找不到正式 Migration')
  const versions = names.map((name) => Number(name.slice(0, 4)))
  for (let index = 0; index < versions.length; index += 1) {
    if (versions[index] !== index + 1) throw new Error('Migration 編號必須由 0001 連續遞增')
  }
  return names
}

export function evaluateSchemaCompatibility({ available, applied, minimum, requireMinimum = false }) {
  if (!available.includes(minimum)) throw new Error('minimumSchemaVersion 不存在於正式 Migration')
  const unknown = applied.filter((name) => !available.includes(name))
  if (unknown.length > 0) throw new Error(`遠端含未知 Migration：${unknown.join(', ')}`)
  const expectedPrefix = available.slice(0, applied.length)
  if (JSON.stringify(applied) !== JSON.stringify(expectedPrefix)) throw new Error('遠端 Migration 不是正式序列的連續前綴')
  const minimumIndex = available.indexOf(minimum)
  const currentIndex = applied.length - 1
  const compatible = currentIndex >= minimumIndex
  if (requireMinimum && !compatible) throw new Error(`遠端 Schema 尚未達最低需求 ${minimum}`)
  return {
    minimum,
    current: applied.at(-1) || null,
    compatible,
    needsMigration: !compatible,
    pending: available.slice(applied.length),
  }
}

function remoteMigrations(config) {
  const output = execFileSync('npx', [
    'wrangler', 'd1', 'execute', 'DB', '--remote', '--config', config,
    '--command', 'SELECT id, name FROM d1_migrations ORDER BY id', '--json',
  ], { encoding: 'utf8' })
  const response = JSON.parse(output)
  if (!response?.[0]?.success || !Array.isArray(response[0].results)) throw new Error('無法讀取遠端 Migration 狀態')
  return response[0].results.map((row) => row.name)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const command = process.argv[2]
  const options = args(process.argv.slice(3))
  const directory = path.resolve(options.migrations || 'migrations')
  const available = orderedMigrations(directory)
  if (command === 'derive') {
    const minimum = available.at(-1)
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `minimum-schema-version=${minimum}\n`)
    console.log(minimum)
  } else if (command === 'check') {
    if (!options.minimum || !options.config) throw new Error('check 缺少 --minimum 或 --config')
    const result = evaluateSchemaCompatibility({
      available,
      applied: remoteMigrations(options.config),
      minimum: options.minimum,
      requireMinimum: options.phase === 'after',
    })
    console.log(JSON.stringify(result, null, 2))
  } else {
    throw new Error('指令必須為 derive 或 check')
  }
}
