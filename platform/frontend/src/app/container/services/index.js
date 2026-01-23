// src/app/container/services/index.js

/**
 * Platform Services
 * ==================================================
 * 本層只提供「能力（capability）」
 *
 * 規則：
 * - ❌ 不做流程
 * - ❌ 不讀 config / auth
 * - ❌ 不知道模組存在
 * - ❌ 不管理生命週期
 * - ✅ 只輸出可被使用的工具
 *
 * services 是「工具箱」，不是「控制中心」
 * ==================================================
 */

import { resolveNavProjection } from './resolveNavProjection.js'

export const services = {
  resolveNavProjection
}
