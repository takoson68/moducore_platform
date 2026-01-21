// container/index.js

/**
 * Platform Container Facade
 *
 * 這是平台層對外的唯一入口
 * - 不做初始化
 * - 不做註冊
 * - 不產生副作用
 */

// 容器本體（核心機械）
export { container } from './container.js'

// 模組註冊協議（給 module 用）
export { createRegister } from './register.js'

// 平台服務清單（只是 export，不會啟動）
export * as services from './services/index.js'
